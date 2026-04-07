from django.urls import path
from .views import oracle_tables, oracle_table_data

urlpatterns = [
    # Real Oracle Data Routes
    path('tables/', oracle_tables, name='oracle_tables'),
    path('table/<str:table_name>/', oracle_table_data, name='oracle_table_data'),
]
