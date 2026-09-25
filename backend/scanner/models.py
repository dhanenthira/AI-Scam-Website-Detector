"""
Models for website security scanning in ScamGuard AI.
"""
from django.db import models
from django.contrib.auth.models import User


class WebsiteScan(models.Model):
    """
    Stores comprehensive scan results and AI security analysis for a requested URL.
    """
    class RiskLevel(models.TextChoices):
        LOW = 'LOW', 'LOW'
        MEDIUM = 'MEDIUM', 'MEDIUM'
        HIGH = 'HIGH', 'HIGH'
        CRITICAL = 'CRITICAL', 'CRITICAL'

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='scans',
        null=True,
        blank=True,
        help_text="User who initiated the scan, or null for public/guest scans."
    )
    url = models.URLField(max_length=2048, help_text="Full analyzed target URL")
    domain = models.CharField(max_length=255, db_index=True, help_text="Extracted domain/host")
    risk_score = models.IntegerField(
        help_text="Safety/Trustworthiness score (0 = Critical Risk, 100 = Low Risk/Safe)"
    )
    risk_level = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        default=RiskLevel.MEDIUM,
        help_text="Categorized risk tier: LOW, MEDIUM, HIGH, CRITICAL"
    )
    ssl_status = models.BooleanField(
        default=False,
        help_text="True if a valid and active SSL/TLS certificate was verified"
    )
    phishing_detected = models.BooleanField(
        default=False,
        help_text="True if deceptive credential/brand phishing patterns were detected"
    )
    malware_detected = models.BooleanField(
        default=False,
        help_text="True if malware distribution/exploit indicators were flagged"
    )
    suspicious_redirects = models.BooleanField(
        default=False,
        help_text="True if deceptive redirect chains or protocol downgrades were detected"
    )
    domain_age = models.CharField(
        max_length=100,
        default="Unknown",
        help_text="Domain age derived from registration records (e.g. '8 months', '2 years')"
    )
    content_analysis = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured breakdown of DOM inspection, forms, tokens, and AI insights"
    )
    security_summary = models.TextField(
        blank=True,
        help_text="Synthesized summary of security findings and caution advice"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the scan was executed"
    )

    class Meta:
        verbose_name = 'Website Scan'
        verbose_name_plural = 'Website Scans'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at'], name='scan_user_created_idx'),
            models.Index(fields=['domain'], name='scan_domain_idx'),
            models.Index(fields=['created_at'], name='scan_created_idx'),
        ]

    def __str__(self):
        return f"{self.domain} [{self.risk_level}] - Score: {self.risk_score}"
