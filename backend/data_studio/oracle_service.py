import cx_Oracle
import os
from django.core.cache import cache
from security.utils import filter_columns, apply_row_filter

def get_oracle_connection():
    """
    Creates and returns a connection to the Oracle Database using .env credentials.
    """
    try:
        # Use DSN string from environment variables
        dsn = cx_Oracle.makedsn(
            os.getenv("ORACLE_HOST"),
            int(os.getenv("ORACLE_PORT", 1521)),
            service_name=os.getenv("ORACLE_SERVICE")
        )

        connection = cx_Oracle.connect(
            user=os.getenv("ORACLE_USER"),
            password=os.getenv("ORACLE_PASSWORD"),
            dsn=dsn
        )
        print("✅ Oracle Connected Successfully")
        return connection
    except Exception as e:
        print(f"❌ Oracle Connection Error: {str(e)}")
        return None

def get_tables():
    """
    Fetches all non-system tables from the Oracle database.
    """
    conn = get_oracle_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT owner, table_name
            FROM all_tables
            WHERE owner NOT IN ('SYS','SYSTEM','XDB','MDSYS','CTXSYS','OLAPSYS','WMSYS')
            ORDER BY owner, table_name
        """)

        tables = [
            f"{row[0]}.{row[1]}"
            for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
        print("Tables fetched:", tables)
        return tables
    except Exception as e:
        print(f"Error fetching tables: {e}")
        if conn: conn.close()
        return []

def get_table_data(table_name):
    """
    Fetches the first 50 rows of data from a specific Oracle table.
    """
    conn = get_oracle_connection()
    if not conn:
        return [], []
    
    try:
        cursor = conn.cursor()
        query = f"SELECT * FROM {table_name} FETCH FIRST 50 ROWS ONLY"
        cursor.execute(query)

        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        data = [
            dict(zip(columns, row))
            for row in rows
        ]

        cursor.close()
        conn.close()
        return columns, data
    except Exception as e:
        print(f"Error fetching table data for {table_name}: {e}")
        if conn: conn.close()
        return [], []

def get_filtered_data(user, table_name):
    """
    Fetches table data and applies security filters (RSG + CSG).
    """
    columns, data = get_table_data(table_name)

    if data:
        data = apply_row_filter(user, table_name, data)
        data = filter_columns(user, table_name, data)

    return columns, data
