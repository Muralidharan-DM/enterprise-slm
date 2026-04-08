from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .intents import detect_intent
from .sql_map import INTENT_SQL
from .models import ChatSession, ChatMessage
from django.db.models import Q
from users.models import ActivityLog
from data_studio.oracle_service import get_oracle_connection
from security.utils import filter_columns, apply_row_filter

def execute_query(sql):
    """
    Executes a SQL query on the live Oracle database.
    """
    conn = get_oracle_connection()
    if not conn:
        return [], []
        
    try:
        cursor = conn.cursor()
        cursor.execute(sql)
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        data = [dict(zip(columns, row)) for row in rows]
        cursor.close()
        conn.close()
        return columns, data
    except Exception as e:
        print(f"❌ Chat Query Error: {e}")
        if conn: conn.close()
        return [], []

def secure_data(user, table_name, data):
    data = apply_row_filter(user, table_name, data)
    data = filter_columns(user, table_name, data)
    return data

def generate_response(intent, data):
    summary = f"Analysis completed for {intent.replace('_',' ').title()}"
    chart_data = data[:10]
    return {
        "summary": summary,
        "chart": chart_data,
        "table": data
    }

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
    return Response({
        "session_id": session.id
    })

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

from .service import process_query

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

    # Auto-title session if it's "New Chat" and this is the first message
    if session.title == "New Chat" and query:
        session.title = query[:50]
        session.save()

    # Save user message
    save_message(session, "user", {"text": query})
    
    # Process through Seeded Engine
    response_data = process_query(query)
    
    # Save bot response
    save_message(session, "bot", response_data)
    return Response(response_data)
