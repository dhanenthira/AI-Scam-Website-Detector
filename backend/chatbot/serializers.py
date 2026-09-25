"""
Serializers for AI security chatbot.
"""
from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    """
    Input serializer for asking a question about a scanned website.
    """
    scan_id = serializers.IntegerField(
        required=True,
        help_text="The ID of the WebsiteScan record providing technical context"
    )
    message = serializers.CharField(
        required=True,
        max_length=2000,
        help_text="User question regarding the website safety or scan indicators"
    )


class ChatResponseSerializer(serializers.Serializer):
    """
    Output serializer returning the AI security answer.
    """
    answer = serializers.CharField(
        help_text="AI security assistant contextual answer"
    )
