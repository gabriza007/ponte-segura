from django.contrib import admin
from .models import Estudante, AlertaSOS

# Registrando as tabelas para que elas apareçam no painel
admin.site.register(Estudante)
admin.site.register(AlertaSOS)