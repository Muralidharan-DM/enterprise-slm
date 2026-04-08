from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .oracle_service import get_tables, get_filtered_data

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oracle_tables(request):
    """
    Fetches all non-system tables from the real Oracle Database (Secure & Logged).
    """
    try:
        print(f"INFO: Fetching table list for user {request.user.email}")
        tables = get_tables()
        return Response({
            "datasets": tables
        })
    except Exception as e:
        print(f"ERROR: Failed to fetch tables: {str(e)}")
        return Response({
            "error": "Failed to fetch datasets from Oracle Database",
            "details": str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oracle_table_data(request, table_name):
    """
    Fetches filtered data from a real Oracle Database table (Hardened).
    """
    try:
        user = request.user
        print(f"INFO: User {user.email} accessing table {table_name}")

        # Basic SQL Injection protection: validate table name against permitted schemas
        all_allowed_tables = get_tables()
        if table_name not in all_allowed_tables:
            print(f"WARNING: User {user.email} attempted to access unlisted table {table_name}")
            return Response({"error": "Invalid table or unauthorized schema asset."}, status=403)

        columns, data = get_filtered_data(user, table_name)
        
        if not data and columns:
             return Response({
                "columns": columns,
                "data": [],
                "message": "Access restricted by Row Security Groups (RSG)."
            })

        return Response({
            "columns": columns,
            "data": data
        })
    except Exception as e:
        print(f"ERROR: Failed to fetch data for {table_name}: {str(e)}")
        return Response({
            "error": f"Failed to retrieve data for table {table_name}",
            "details": str(e)
        }, status=500)
