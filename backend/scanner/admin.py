from django.contrib import admin
from .models import WebsiteScan


@admin.register(WebsiteScan)
class WebsiteScanAdmin(admin.ModelAdmin):
    """
    Django Admin configuration for WebsiteScan.
    Configured with requested columns and filters.
    """
    list_display = (
        'url',
        'user',
        'risk_score',
        'risk_level',
        'phishing_detected',
        'malware_detected',
        'ssl_status',
        'created_at',
    )
    list_filter = (
        'risk_level',
        'created_at',
        'phishing_detected',
        'malware_detected',
        'ssl_status',
        'suspicious_redirects',
    )
    search_fields = ('url', 'domain', 'user__username', 'security_summary')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
