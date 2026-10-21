"""
Views for ScamGuard AI chatbot interaction.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiResponse

from scanner.models import WebsiteScan
from .serializers import ChatRequestSerializer, ChatResponseSerializer
from .services import answer_scan_query


class ChatbotQueryView(APIView):
    """
    Submit a question regarding a specific scanned website.
    The AI answers strictly based on the stored technical scan findings.
    """
    permission_classes = [AllowAny]
    serializer_class = ChatRequestSerializer

    @extend_schema(
        request=ChatRequestSerializer,
        responses={
            200: ChatResponseSerializer,
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="Scan not found"),
        },
        tags=['Chatbot'],
        summary='Ask AI questions about a scanned website'
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        scan_id = serializer.validated_data['scan_id']
        message = serializer.validated_data['message']

        # Retrieve scan record
        scan_record = WebsiteScan.objects.filter(pk=scan_id).first()
        if not scan_record:
            # Fallback to the user's latest scan, or the most recent system scan
            if request.user.is_authenticated:
                scan_record = WebsiteScan.objects.filter(user=request.user).order_by('-created_at').first()
            if not scan_record:
                scan_record = WebsiteScan.objects.order_by('-created_at').first()

        if not scan_record:
            return Response(
                {"answer": "No scan reports are available yet. Please scan a website first using the scanner tab, and I'll analyze its security details for you!"},
                status=status.HTTP_200_OK
            )

        # If scan has an owner and requester is an authenticated user that does not match
        if scan_record.user is not None and request.user.is_authenticated:
            if scan_record.user != request.user and not request.user.is_staff:
                return Response(
                    {"error": "You do not have permission to view or query this scan record."},
                    status=status.HTTP_403_FORBIDDEN
                )

        answer = answer_scan_query(scan_record, message)
        return Response({"answer": answer}, status=status.HTTP_200_OK)
