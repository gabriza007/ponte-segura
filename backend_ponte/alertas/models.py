from django.db import models

class Estudante(models.Model):
    # Tabela simples para cadastrar quem está usando o app
    nome = models.CharField(max_length=100)
    matricula = models.CharField(max_length=50, unique=True) # Para integração com a escola/DPCA
    telefone_familia = models.CharField(max_length=20)
    
    def __str__(self):
        return self.nome

class AlertaSOS(models.Model):
    # Tabela que vai registrar cada vez que o botão de pânico for apertado
    estudante = models.ForeignKey(Estudante, on_delete=models.CASCADE)
    localizacao = models.CharField(max_length=255) # Ex: "Ponte Princesa Isabel" ou coordenadas GPS
    data_hora = models.DateTimeField(auto_now_add=True) # Salva a hora exata automaticamente
    resolvido = models.BooleanField(default=False) # Para a Guarda Municipal marcar quando atender a ocorrência
    
    def __str__(self):
        return f"Alerta de {self.estudante.nome} em {self.data_hora.strftime('%d/%m/%Y %H:%M')}"
        