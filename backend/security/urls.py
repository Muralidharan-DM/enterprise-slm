from django.urls import path
from .views import (
    get_datasets,
    get_csg, create_csg, get_csg_detail, update_csg, delete_csg,
    csg_auto_users, csg_available_users, csg_add_user,
    get_rsg, create_rsg, get_rsg_detail, update_rsg, delete_rsg,
    rsg_auto_users, rsg_available_users, rsg_add_user,
)

urlpatterns = [
    # Datasets
    path('datasets/', get_datasets, name='get_datasets'),

    # CSG
    path('csg/', get_csg, name='get_csg'),
    path('csg/create/', create_csg, name='create_csg'),
    path('csg/<int:id>/', get_csg_detail, name='get_csg_detail'),
    path('csg/<int:id>/update/', update_csg, name='update_csg'),
    path('csg/<int:id>/delete/', delete_csg, name='delete_csg'),
    path('csg/<int:id>/auto-users/', csg_auto_users, name='csg_auto_users'),
    path('csg/<int:id>/available-users/', csg_available_users, name='csg_available_users'),
    path('csg/<int:id>/add-user/', csg_add_user, name='csg_add_user'),

    # RSG
    path('rsg/', get_rsg, name='get_rsg'),
    path('rsg/create/', create_rsg, name='create_rsg'),
    path('rsg/<int:id>/', get_rsg_detail, name='get_rsg_detail'),
    path('rsg/<int:id>/update/', update_rsg, name='update_rsg'),
    path('rsg/<int:id>/delete/', delete_rsg, name='delete_rsg'),
    path('rsg/<int:id>/auto-users/', rsg_auto_users, name='rsg_auto_users'),
    path('rsg/<int:id>/available-users/', rsg_available_users, name='rsg_available_users'),
    path('rsg/<int:id>/add-user/', rsg_add_user, name='rsg_add_user'),
]
