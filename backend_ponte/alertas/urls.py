from django.urls import path
from . import views

urlpatterns = [
    path('alerta/', views.criar_alerta, name='criar_alerta'),
    path('login/', views.login_aluno, name='login_aluno'),
    path('painel/', views.listar_ocorrencias, name='listar_ocorrencias'),
]
