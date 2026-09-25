from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from scanner.models import WebsiteScan
from scanner.services import validate_url, extract_domain, calculate_risk_score


class ScannerServiceUnitTests(TestCase):
    def test_extract_domain(self):
        self.assertEqual(extract_domain('https://example.com/login?param=1'), 'example.com')
        self.assertEqual(extract_domain('http://sub.domain.org:8080/'), 'sub.domain.org')
        self.assertEqual(extract_domain('scam-site.xyz/verify'), 'scam-site.xyz')

    def test_ssrf_prevention(self):
        # Localhost and loopback
        valid, _, err = validate_url('http://127.0.0.1/admin')
        self.assertFalse(valid)
        self.assertIn("forbidden", err.lower())

        valid, _, err = validate_url('http://localhost:8000')
        self.assertFalse(valid)

        # Cloud metadata
        valid, _, err = validate_url('http://169.254.169.254/latest/meta-data/')
        self.assertFalse(valid)

        # Invalid schemes
        valid, _, err = validate_url('file:///etc/passwd')
        self.assertFalse(valid)
        self.assertIn("only http and https", err.lower())

    def test_risk_score_calculation(self):
        # Safe site parameters
        score, level, phishing, malware = calculate_risk_score(
            ssl_status=True,
            suspicious_redirects=False,
            url_analysis={"is_phishing": False, "indicators": [], "tld": "com"},
            content_analysis={"phishing_detected": False, "malware_detected": False, "insecure_password_form": False, "scam_phrases_found": []},
            domain_age="2 years",
            fetch_error=None
        )
        self.assertGreaterEqual(score, 80)
        self.assertEqual(level, "LOW")
        self.assertFalse(phishing)
        self.assertFalse(malware)

        # High risk scam site parameters
        bad_score, bad_level, bad_phishing, bad_malware = calculate_risk_score(
            ssl_status=False,
            suspicious_redirects=True,
            url_analysis={"is_phishing": True, "indicators": ["Brand impersonation attempt detected for 'paypal'"], "tld": "xyz"},
            content_analysis={"phishing_detected": True, "malware_detected": False, "insecure_password_form": True, "scam_phrases_found": ["account suspended"]},
            domain_age="4 days",
            fetch_error=None
        )
        self.assertLess(bad_score, 40)
        self.assertIn(bad_level, ("HIGH", "CRITICAL"))
        self.assertTrue(bad_phishing)


class ScannerAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username="alice", password="Password123!", email="alice@test.com")
        self.user2 = User.objects.create_user(username="bob", password="Password123!", email="bob@test.com")
        self.scan_url = '/api/scanner/scan/'
        self.history_url = '/api/scanner/history/'

    @patch('scanner.services.fetch_website')
    @patch('scanner.services.check_ssl')
    @patch('scanner.services.get_domain_age')
    @patch('scanner.services.validate_url')
    def test_scan_website_api(self, mock_val, mock_age, mock_ssl, mock_fetch):
        mock_val.return_value = (True, "https://example.com", None)
        mock_ssl.return_value = {"valid": True, "issuer": "DigiCert", "expires": "2027", "error": None}
        mock_fetch.return_value = {
            "status_code": 200,
            "final_url": "https://example.com",
            "history": [],
            "content": "<html><head><title>Example Domain</title></head><body><h1>Example</h1></body></html>",
            "headers": {},
            "error": None
        }
        mock_age.return_value = "8 months"

        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.scan_url, {"url": "https://example.com"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["domain"], "example.com")
        self.assertEqual(response.data["risk_level"], "LOW")
        self.assertTrue(response.data["ssl_status"])
        self.assertIn("security_summary", response.data)

        # Check DB persistence
        scan_id = response.data["id"]
        scan_obj = WebsiteScan.objects.get(id=scan_id)
        self.assertEqual(scan_obj.user, self.user1)

    def test_scan_history_and_isolation(self):
        # Create scan for user1
        scan1 = WebsiteScan.objects.create(
            user=self.user1,
            url="https://site1.com",
            domain="site1.com",
            risk_score=85,
            risk_level="LOW",
            ssl_status=True,
            security_summary="Good site"
        )
        # Create scan for user2
        scan2 = WebsiteScan.objects.create(
            user=self.user2,
            url="https://site2.com",
            domain="site2.com",
            risk_score=20,
            risk_level="CRITICAL",
            ssl_status=False,
            security_summary="Bad site"
        )

        # Authenticate as user1
        self.client.force_authenticate(user=self.user1)
        history_resp = self.client.get(self.history_url)
        self.assertEqual(history_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history_resp.data), 1)
        self.assertEqual(history_resp.data[0]["id"], scan1.id)

        # Detail view for own scan
        detail_resp = self.client.get(f'/api/scanner/history/{scan1.id}/')
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_resp.data["domain"], "site1.com")

        # Detail view for user2's scan -> 404 (Permission Isolation)
        other_detail_resp = self.client.get(f'/api/scanner/history/{scan2.id}/')
        self.assertEqual(other_detail_resp.status_code, status.HTTP_404_NOT_FOUND)

        # Delete own scan
        delete_resp = self.client.delete(f'/api/scanner/history/{scan1.id}/')
        self.assertEqual(delete_resp.status_code, status.HTTP_200_OK)
        self.assertFalse(WebsiteScan.objects.filter(id=scan1.id).exists())
