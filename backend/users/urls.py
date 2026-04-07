from django.urls import path
from .views import login_user, get_users, update_user, get_master_data

urlpatterns = [
    path('login/', login_user, name='login_user'),
    path('profiles/', get_users, name='get_users'),
    path('profiles/<int:id>/', update_user, name='update_user'),
    path('master-data/', get_master_data, name='get_master_data'),
]
