from django.urls import path
from . import views

urlpatterns = [
    path('alerta/', views.criar_alerta, name='criar_alerta'),
]
