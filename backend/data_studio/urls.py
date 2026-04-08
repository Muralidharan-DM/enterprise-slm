from django.urls import path
from . import views

urlpatterns = [
    path('connect/', views.db_connect, name='db_connect'),
    path('tables/', views.db_tables, name='db_tables'),
    path('table/<str:table_name>/', views.db_table_data, name='db_table_data'),
]
