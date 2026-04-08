from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .db_service import get_db_connection, fetch_tables, get_secured_data

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def db_connect(request):
    """
    Validates connection credentials and stores them in the session.
    """
    db_config = request.data
    db_type = db_config.get('type')
    
    if not db_type:
        return Response({"error": "Database type is required"}, status=400)

    try:
        # Attempt to connect to validate credentials
        conn = get_db_connection(db_config)
        if hasattr(conn, 'close'):
            conn.close()
            
        # Store config in session (excluding password if you prefer, but needed for subsequent requests)
        request.session['db_config'] = db_config
        request.session.modified = True
        
        return Response({
            "success": True,
            "message": f"Successfully connected to {db_type.capitalize()} database",
            "host": db_config.get('host')
        })
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def db_tables(request):
    """
    Fetches all tables for the currently connected database.
    """
    db_config = request.session.get('db_config')
    if not db_config:
        return Response({"error": "No active database connection. Please connect first."}, status=401)

    try:
        conn = get_db_connection(db_config)
        tables = fetch_tables(conn, db_config['type'])
        if hasattr(conn, 'close'):
            conn.close()
            
        return Response({
            "datasets": tables
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def db_table_data(request, table_name):
    """
    Fetches table data with security enforcement.
    """
    db_config = request.session.get('db_config')
    if not db_config:
        return Response({"error": "No active database connection."}, status=401)

    try:
        columns, data = get_secured_data(request.user, db_config, table_name)
        
        message = ""
        if not data and columns:
            message = "Access restricted by Row Security Groups (RSG)."

        return Response({
            "columns": columns,
            "data": data,
            "message": message
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)
