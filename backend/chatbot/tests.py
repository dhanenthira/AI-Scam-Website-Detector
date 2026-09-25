from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from scanner.models import WebsiteScan


class ChatbotAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.chat_url = '/api/chat/'
        self.user = User.objects.create_user(username="chatuser", password="Password123!", email="chat@test.com")
        self.scan = WebsiteScan.objects.create(
            user=self.user,
            url="https://example.com",
            domain="example.com",
            risk_score=86,
            risk_level="LOW",
            ssl_status=True,
            phishing_detected=False,
            malware_detected=False,
            suspicious_redirects=False,
            domain_age="8 months",
            security_summary="No major suspicious indicators were detected, but the domain is relatively new."
        )

    def test_chatbot_query_success(self):
        payload = {
            "scan_id": self.scan.id,
            "message": "Why did this website receive a score of 86?"
        }
        response = self.client.post(self.chat_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("answer", response.data)
        answer = response.data["answer"]
        self.assertIn("86", answer)
        self.assertIn("example.com", answer)

    def test_chatbot_query_safety_question(self):
        payload = {
            "scan_id": self.scan.id,
            "message": "Is this website safe to use?"
        }
        response = self.client.post(self.chat_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("answer", response.data)

    def test_chatbot_query_nonexistent_scan(self):
        payload = {
            "scan_id": 99999,
            "message": "Is this website safe?"
        }
        response = self.client.post(self.chat_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_chatbot_query_invalid_payload(self):
        response = self.client.post(self.chat_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
