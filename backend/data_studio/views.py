from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .oracle_service import get_tables, get_filtered_data

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oracle_tables(request):
    """
    Fetches all non-system tables from the real Oracle Database.
    """
    tables = get_tables()
    return Response({
        "datasets": tables
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oracle_table_data(request, table_name):
    """
    Fetches filtered data from a real Oracle Database table.
    """
    user = request.user
    columns, data = get_filtered_data(user, table_name)

    return Response({
        "columns": columns,
        "data": data
    })
