from django.urls import path
from . import views

urlpatterns = [
    path('query/', views.chat_api, name='chat_api'),
    path('session/create/', views.create_session, name='create_session'),
    path('sessions/', views.get_sessions, name='get_sessions'),
    path('session/<int:session_id>/', views.get_session_messages, name='get_session_messages'),
]
