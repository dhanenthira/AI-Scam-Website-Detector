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
        try:
            scan_record = WebsiteScan.objects.get(pk=scan_id)
        except WebsiteScan.DoesNotExist:
            return Response(
                {"error": f"Scan record with ID {scan_id} not found."},
                status=status.HTTP_404_NOT_FOUND
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
