"""
Custom DRF exception handler for ScamGuard AI.
Ensures standardized, clean JSON error responses across all endpoints:
{
    "error": "Human readable error message"
}
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Catch standard DRF exceptions as well as unhandled server exceptions,
    formatting them into a consistent {"error": "..."} format.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Standard DRF exception (e.g. ValidationError, AuthenticationFailed, etc.)
        error_message = _extract_error_message(response.data)
        response.data = {
            "error": error_message
        }
        return response

    # Unhandled 500 server error
    logger.exception("Unhandled server exception caught: %s", exc)
    return Response(
        {"error": "An internal server error occurred. Please try again later."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def _extract_error_message(data):
    """
    Extract a single, clean human-readable error string from various DRF data shapes
    (strings, lists, dicts).
    """
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        if len(data) > 0:
            return _extract_error_message(data[0])
        return "An error occurred."
    if isinstance(data, dict):
        # Look for detail or specific field errors
        if 'detail' in data:
            return _extract_error_message(data['detail'])
        if 'error' in data:
            return _extract_error_message(data['error'])
        # If there are field-specific errors, grab the first one
        for field, errors in data.items():
            field_name = field.replace('_', ' ').capitalize() if field != 'non_field_errors' else ''
            msg = _extract_error_message(errors)
            if field_name:
                return f"{field_name}: {msg}"
            return msg
    return "Invalid request."
