"""
Views for website scanning, history listing, report detail, and deletion.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter

from .models import WebsiteScan
from .serializers import (
    ScanRequestSerializer,
    WebsiteScanResponseSerializer,
    ScanHistorySerializer,
    ScanDetailSerializer,
)
from .services import run_full_scan


class ScanWebsiteView(APIView):
    """
    Initiate a website scan.
    Inspects SSL, URL anomalies, redirects, DOM content, phishing/malware markers,
    calculates risk score, and invokes AI security analysis.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'scan'
    serializer_class = ScanRequestSerializer

    @extend_schema(
        request=ScanRequestSerializer,
        responses={
            201: WebsiteScanResponseSerializer,
            400: OpenApiResponse(description="Invalid website URL or SSRF prohibited"),
            429: OpenApiResponse(description="Too many scan requests"),
        },
        tags=['Scanner'],
        summary='Scan a website for scams and threats'
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        url = serializer.validated_data['url']
        user = request.user if request.user.is_authenticated else None

        try:
            scan_data = run_full_scan(url, user=user)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response(
                {"error": f"Failed to complete scan: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Persist to database
        scan_record = WebsiteScan.objects.create(
            user=scan_data['user'],
            url=scan_data['url'],
            domain=scan_data['domain'],
            risk_score=scan_data['risk_score'],
            risk_level=scan_data['risk_level'],
            ssl_status=scan_data['ssl_status'],
            phishing_detected=scan_data['phishing_detected'],
            malware_detected=scan_data['malware_detected'],
            suspicious_redirects=scan_data['suspicious_redirects'],
            domain_age=scan_data['domain_age'],
            content_analysis=scan_data['content_analysis'],
            security_summary=scan_data['security_summary']
        )

        response_serializer = WebsiteScanResponseSerializer(scan_record)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ScanHistoryListView(APIView):
    """
    Retrieve authenticated user's previous website scans.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ScanHistorySerializer

    @extend_schema(
        responses={
            200: ScanHistorySerializer(many=True),
            401: OpenApiResponse(description="Authentication required"),
        },
        tags=['Scanner'],
        summary='Get scan history for current user'
    )
    def get(self, request):
        scans = WebsiteScan.objects.filter(user=request.user).order_by('-created_at')
        serializer = self.serializer_class(scans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ScanDetailView(APIView):
    """
    Retrieve complete scan report or delete a scan record owned by the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ScanDetailSerializer

    def _get_object(self, pk, user):
        try:
            return WebsiteScan.objects.get(pk=pk, user=user)
        except WebsiteScan.DoesNotExist:
            return None

    @extend_schema(
        responses={
            200: ScanDetailSerializer,
            401: OpenApiResponse(description="Authentication required"),
            404: OpenApiResponse(description="Scan not found"),
        },
        tags=['Scanner'],
        summary='Get complete scan details by ID'
    )
    def get(self, request, id):
        scan = self._get_object(pk=id, user=request.user)
        if not scan:
            return Response(
                {"error": "Scan record not found or access denied."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.serializer_class(scan)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        responses={
            204: OpenApiResponse(description="Scan deleted successfully"),
            401: OpenApiResponse(description="Authentication required"),
            404: OpenApiResponse(description="Scan not found"),
        },
        tags=['Scanner'],
        summary='Delete a scan record by ID'
    )
    def delete(self, request, id):
        scan = self._get_object(pk=id, user=request.user)
        if not scan:
            return Response(
                {"error": "Scan record not found or access denied."},
                status=status.HTTP_404_NOT_FOUND
            )
        scan.delete()
        return Response(
            {"message": "Scan record deleted successfully."},
            status=status.HTTP_200_OK
        )
