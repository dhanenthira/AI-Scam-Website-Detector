"""
URL routing for scanner endpoints.
"""
from django.urls import path
from .views import (
    ScanWebsiteView,
    ScanHistoryListView,
    ScanDetailView,
)

app_name = 'scanner'

urlpatterns = [
    path('scan/', ScanWebsiteView.as_view(), name='scan'),
    path('history/', ScanHistoryListView.as_view(), name='history_list'),
    path('history/<int:id>/', ScanDetailView.as_view(), name='history_detail'),
]
