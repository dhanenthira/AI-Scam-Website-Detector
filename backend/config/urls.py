"""
Main URL configuration for ScamGuard AI.
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Django Admin Panel
    path('admin/', admin.site.urls),

    # API Endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/scanner/', include('scanner.urls')),
    path('api/chat/', include('chatbot.urls')),

    # OpenAPI 3.0 Schema and Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
