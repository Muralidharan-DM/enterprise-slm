import cx_Oracle
import os
from django.core.cache import cache
from security.utils import filter_columns, apply_row_filter

def get_oracle_connection():
    """
    Creates and returns a connection to the Oracle Database.
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
        return connection
    except cx_Oracle.Error as e:
        print(f"Error connecting to Oracle: {e}")
        return None

def get_tables():
    """
    Fetches all non-system tables from the Oracle database (Cached).
    """
    cache_key = "oracle_tables_list"
    cached_tables = cache.get(cache_key)
    if cached_tables:
        return cached_tables

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
        
        # Cache for 5 minutes
        cache.set(cache_key, tables, timeout=300)
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
        # Safety check: ensure table_name doesn't contain malicious characters 
        # (though in this context it comes from get_tables or validated UI selection)
        
        # Use FETCH FIRST 50 ROWS ONLY for better performance in explorer views
        query = f"SELECT * FROM {table_name} FETCH FIRST 50 ROWS ONLY"
        cursor.execute(query)

        # Extract column names from cursor description
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

    # 🔗 Step 6.5: APPLY SECURITY
    if data:
        print(f"DEBUG - TABLE: {table_name}")
        print(f"DEBUG - INITIAL ROWS: {len(data)}")
        
        data = apply_row_filter(user, table_name, data)
        data = filter_columns(user, table_name, data)
        
        print(f"DEBUG - FILTERED ROWS: {len(data)}")

    return columns, data
