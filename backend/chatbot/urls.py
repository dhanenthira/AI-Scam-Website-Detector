"""
URL routing for chatbot API.
"""
from django.urls import path
from .views import ChatbotQueryView

app_name = 'chatbot'

urlpatterns = [
    path('', ChatbotQueryView.as_view(), name='chat_query'),
]
