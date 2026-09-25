from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status


class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/auth/profile/'
        self.refresh_url = '/api/auth/token/refresh/'
        self.logout_url = '/api/auth/logout/'

    def test_user_registration_success(self):
        payload = {
            "username": "user123",
            "email": "user@example.com",
            "password": "Password123!",
            "password2": "Password123!"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["username"], "user123")

        # Verify password is not stored in plaintext
        user = User.objects.get(username="user123")
        self.assertNotEqual(user.password, "Password123!")
        self.assertTrue(user.check_password("Password123!"))

    def test_registration_password_mismatch(self):
        payload = {
            "username": "user123",
            "email": "user@example.com",
            "password": "Password123!",
            "password2": "DifferentPassword!"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_user_login_and_profile_flow(self):
        # Create user
        User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="SecurePassword123!"
        )

        # Login
        login_payload = {
            "username": "testuser",
            "password": "SecurePassword123!"
        }
        login_resp = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        access_token = login_resp.data["tokens"]["access"]
        refresh_token = login_resp.data["tokens"]["refresh"]

        # Access Profile without Auth -> 401
        self.client.credentials()
        profile_unauth = self.client.get(self.profile_url)
        self.assertEqual(profile_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # Access Profile with Auth -> 200
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        profile_auth = self.client.get(self.profile_url)
        self.assertEqual(profile_auth.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_auth.data["username"], "testuser")
        self.assertEqual(profile_auth.data["email"], "test@example.com")

        # Refresh token
        refresh_resp = self.client.post(self.refresh_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_resp.data)

        # Logout
        logout_resp = self.client.post(self.logout_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(logout_resp.status_code, status.HTTP_200_OK)
