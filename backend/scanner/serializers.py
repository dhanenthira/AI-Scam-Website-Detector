"""
Serializers for website scanning operations and history.
"""
from rest_framework import serializers
from .models import WebsiteScan


class ScanRequestSerializer(serializers.Serializer):
    """
    Input serializer for initiating a website scan.
    """
    url = serializers.CharField(
        required=True,
        max_length=2048,
        help_text="Target website URL to scan (e.g. 'https://example.com')"
    )


class WebsiteScanResponseSerializer(serializers.ModelSerializer):
    """
    Standard response serializer matching the exact format specified in section 4.
    """
    class Meta:
        model = WebsiteScan
        fields = (
            'id',
            'url',
            'domain',
            'risk_score',
            'risk_level',
            'ssl_status',
            'phishing_detected',
            'malware_detected',
            'suspicious_redirects',
            'domain_age',
            'security_summary',
        )


class ScanHistorySerializer(serializers.ModelSerializer):
    """
    Summary serializer for user scan history list, matching section 8.
    """
    class Meta:
        model = WebsiteScan
        fields = (
            'id',
            'url',
            'risk_score',
            'risk_level',
            'created_at',
        )


class ScanDetailSerializer(serializers.ModelSerializer):
    """
    Comprehensive scan detail serializer for single scan report inspection.
    """
    class Meta:
        model = WebsiteScan
        fields = (
            'id',
            'url',
            'domain',
            'risk_score',
            'risk_level',
            'ssl_status',
            'phishing_detected',
            'malware_detected',
            'suspicious_redirects',
            'domain_age',
            'content_analysis',
            'security_summary',
            'created_at',
        )
        read_only_fields = fields
