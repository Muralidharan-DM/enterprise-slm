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
        print(f"Error executing chat SQL: {e}")
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sessions(request):
    sessions = ChatSession.objects.filter(user=request.user).order_by('-created_at')
    data = [{"id": s.id, "title": s.title, "created_at": s.created_at} for s in sessions]
    return Response({"sessions": data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_history(request, session_id):
    try:
        session = ChatSession.objects.get(id=session_id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)
        
    messages = session.messages.all()
    history = []
    for msg in messages:
        if msg.role == 'user':
            history.append({"role": "user", "text": msg.text})
        else:
            history.append({"role": "bot", "data": msg.data_payload})
            
    return Response({"session_id": session.id, "title": session.title, "history": history})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_api(request):
    user = request.user
    query = request.data.get("message", "").strip()
    session_id = request.data.get("session_id", None)

    # Step 10.10: Session Management Logic
    if not session_id or session_id == "new":
        session = ChatSession.objects.create(user=user, title=query[:50] if query else "New Chat")
    else:
        try:
            session = ChatSession.objects.get(id=session_id, user=user)
        except ChatSession.DoesNotExist:
            session = ChatSession.objects.create(user=user, title=query[:50] if query else "New Chat")

    # Log user message
    ChatMessage.objects.create(session=session, role='user', text=query)
    
    # Step 10.14: Log Activity
    ActivityLog.objects.create(
        user=user, 
        action="Chat Query", 
        details=f"Query: {query} | Session: {session.id}"
    )

    def log_bot_response(data_payload):
        ChatMessage.objects.create(session=session, role='bot', data_payload=data_payload)
        return Response({"session_id": session.id, "data": data_payload})

    # Step 10.5: Recommendation Engine (If empty query)
    if not query:
        # Get authorized datasets from CSGs
        csgs = user.csgs.all()
        datasets = []
        for csg in csgs:
            datasets.extend(csg.datasets)
        
        datasets = list(set(datasets))
        rec_text = "Available datasets for you:\n" + ("\n".join(f"• {d}" for d in datasets) if datasets else "⚠ No datasets found to create insights")
        
        return log_bot_response({
            "summary": rec_text,
            "chart": [],
            "table": []
        })

    intent = detect_intent(query)
    
    # Get authorized datasets for "Access Denied" list (Step 10.6)
    csgs = user.csgs.all()
    allowed_list = []
    for csg in csgs:
        allowed_list.extend(csg.datasets)
    allowed_list = list(set(allowed_list))
    denied_msg = f"🚫 Access Denied\nYou can only access: {', '.join(allowed_list) if allowed_list else 'No datasets assigned'}"

    if not intent:
        return log_bot_response({
            "summary": denied_msg,
            "chart": [],
            "table": []
        })

    sql = INTENT_SQL.get(intent)
    if not sql:
        return log_bot_response({
            "summary": "🚫 Access Denied\nQuery not within predefined analytical scope.",
            "chart": [],
            "table": []
        })

    columns, data = execute_query(sql)

    try:
        table_name = sql.upper().split("FROM")[1].strip().split()[0]
    except Exception:
        table_name = "UNKNOWN"

    # Step 10.14: Log Dataset Access
    ActivityLog.objects.create(
        user=user, 
        action="Dataset Access", 
        details=f"Table: {table_name} accessed via Chat"
    )

    data = secure_data(user, table_name, data)
    
    if not data:
        return log_bot_response({
            "summary": f"🚫 Access Denied\nCorporate Security Policy (CSG/RSG) prevents viewing {table_name}.",
            "chart": [],
            "table": []
        })

    response_data = generate_response(intent, data)
    return log_bot_response(response_data)
