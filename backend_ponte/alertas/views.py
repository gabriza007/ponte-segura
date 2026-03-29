import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Estudante, AlertaSOS

@csrf_exempt
def criar_alerta(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Como ainda não temos painel de Login nativo, o App do celular 
            # vai assumir que é o primeiro Estudante que estiver no banco de dados.
            estudante = Estudante.objects.first()
            if not estudante:
                return JsonResponse({'erro': 'Você precisa criar pelo menos um Estudante no painel /admin primeiro!'}, status=400)
            
            # Criando o registro no banco PostgreSQL usando o ORM do Django
            alerta = AlertaSOS.objects.create(
                estudante=estudante,
                localizacao=data.get('localizacao', 'Localização GPS não informada')
            )
            return JsonResponse({'sucesso': True, 'alerta_id': alerta.id, 'mensagem': 'Alerta gravado no banco!'})
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=400)
    return JsonResponse({'erro': 'Método não suportado'}, status=405)
