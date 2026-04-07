from django.urls import path
from .views import (
    get_csg, create_csg, get_csg_detail, update_csg,
    get_rsg, create_rsg, get_rsg_detail, update_rsg
)

urlpatterns = [
    # CSG
    path('csg/', get_csg, name='get_csg'),
    path('csg/create/', create_csg, name='create_csg'),
    path('csg/<int:id>/', get_csg_detail, name='get_csg_detail'),
    path('csg/<int:id>/update/', update_csg, name='update_csg'),
    
    # RSG
    path('rsg/', get_rsg, name='get_rsg'),
    path('rsg/create/', create_rsg, name='create_rsg'),
    path('rsg/<int:id>/', get_rsg_detail, name='get_rsg_detail'),
    path('rsg/<int:id>/update/', update_rsg, name='update_rsg'),
]
