"""
Safe JWT Authentication for ScamGuard AI.
Allows endpoints with AllowAny permissions to gracefully treat users with
expired or malformed tokens as AnonymousUser rather than failing with 401.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication


class SafeJWTAuthentication(JWTAuthentication):
    """
    A tolerant JWT authentication class.
    If the token is valid, returns (user, token).
    If the token is expired, invalid, or missing, returns None so permission_classes can decide.
    """
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except Exception:
            # Return None to signify no user authenticated, letting AllowAny proceed as AnonymousUser
            return None
