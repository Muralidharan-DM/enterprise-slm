import cx_Oracle
import os
from django.core.cache import cache
from security.utils import filter_columns, apply_row_filter

def get_oracle_connection():
    """
    Creates and returns a connection to the Oracle Database using .env credentials.
    Raises an exception on failure so callers can detect the error.
    """
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

def get_tables():
    """
    Fetches all user-accessible tables from the Oracle database.
    """
    conn = get_oracle_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT owner, table_name
            FROM all_tables
            ORDER BY owner, table_name
        """)
        tables = [f"{row[0]}.{row[1]}" for row in cursor.fetchall()]
        cursor.close()
        print("Tables fetched:", len(tables))
        return tables
    finally:
        conn.close()

def get_table_data(table_name):
    """
    Fetches the first 100 rows of data from a specific Oracle table.
    """
    conn = get_oracle_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name} FETCH FIRST 100 ROWS ONLY")
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        data = [dict(zip(columns, row)) for row in rows]
        cursor.close()
        return columns, data
    finally:
        conn.close()

def get_filtered_data(user, table_name):
    """
    Fetches table data and applies security filters (RSG + CSG).
    """
    columns, data = get_table_data(table_name)

    if data:
        data = apply_row_filter(user, table_name, data)
        data = filter_columns(user, table_name, data)

    return columns, data
