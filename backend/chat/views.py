from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChatSession, ChatMessage
from .service import process_query


def save_message(session, role, content):
    msg = ChatMessage(session=session, role=role)
    msg.content = content
    msg.save()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    session = ChatSession.objects.create(
        user=request.user,
        title="New Chat"
    )
    return Response({"session_id": session.id})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sessions(request):
    sessions = ChatSession.objects.filter(user=request.user).order_by('-created_at')
    data = [{"id": s.id, "title": s.title, "created_at": s.created_at} for s in sessions]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_messages(request, session_id):
    try:
        session = ChatSession.objects.get(id=session_id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)

    messages = session.messages.all().order_by('created_at')
    data = [{"role": m.role, "content": m.content} for m in messages]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_api(request):
    user = request.user
    query = request.data.get("message", "").strip()
    session_id = request.data.get("session_id")

    if not session_id:
        return Response({"error": "session_id is required"}, status=400)

    try:
        session = ChatSession.objects.get(id=session_id, user=user)
    except ChatSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)

    # Auto-title session on first real message
    if session.title == "New Chat" and query:
        session.title = query[:50]
        session.save()

    save_message(session, "user", {"text": query})

    # Process query with security filtering applied per-user
    response_data = process_query(query, user=user)

    save_message(session, "bot", response_data)
    return Response(response_data)
