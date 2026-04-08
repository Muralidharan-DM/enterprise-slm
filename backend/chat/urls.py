from django.urls import path
from .views import chat_api, get_sessions, get_session_history

urlpatterns = [
    path('query/', chat_api, name='chat_api'),
    path('sessions/', get_sessions, name='get_sessions'),
    path('session/<int:session_id>/', get_session_history, name='get_session_history'),
]
