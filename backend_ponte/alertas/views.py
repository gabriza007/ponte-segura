import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Estudante, AlertaSOS

@csrf_exempt
def login_aluno(request):
    """
    Endpoint para Cadastrar ou Autenticar um Estudante através de Matrícula.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nome = data.get('nome')
            matricula = data.get('matricula')
            telefone = data.get('telefone')
            
            if not matricula:
                return JsonResponse({'erro': 'A Matrícula é obrigatória!'}, status=400)
                
            estudante, created = Estudante.objects.get_or_create(
                matricula=matricula,
                defaults={'nome': nome, 'telefone_familia': telefone}
            )
            
            return JsonResponse({'sucesso': True, 'estudante_id': estudante.id})
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=400)
    return JsonResponse({'erro': 'Use apenas requisições POST'}, status=405)

@csrf_exempt
def criar_alerta(request):
    """
    Endpoint (API REST) responsável por receber requisições POST com JSON
    e registrar um novo AlertaSOS no banco de dados, atrelado a um Estudante_id.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            estudante_id = data.get('estudante_id')

            if not estudante_id:
                return JsonResponse({'erro': 'Identificação do usuário (estudante_id) ausente!'}, status=400)
            
            try:
                estudante = Estudante.objects.get(id=estudante_id)
            except Estudante.DoesNotExist:
                return JsonResponse({'erro': 'Estudante não encontrado no sistema.'}, status=404)
            
            alerta = AlertaSOS.objects.create(
                estudante=estudante,
                localizacao=data.get('localizacao', 'Localização GPS não informada')
            )
            return JsonResponse({'sucesso': True, 'alerta_id': alerta.id, 'mensagem': 'Alerta gravado no banco!'})
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=400)
    return JsonResponse({'erro': 'Método não suportado'}, status=405)

@csrf_exempt
def listar_ocorrencias(request):
    """
    Endpoint Exclusivo da Guarda e Polícia. Requer Payload com senha correta.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            senha = data.get('senha')
            
            if senha != "153":
                return JsonResponse({'erro': 'Acesso negado. Credencial inválida.'}, status=403)
            
            # Buscar todos os alertas ocorridos e pré-puxar a relação do estudante
            alertas = AlertaSOS.objects.all().select_related('estudante').order_by('-data_hora')
            lista_alertas = []
            for a in alertas:
                lista_alertas.append({
                    'id': a.id,
                    'estudante_nome': a.estudante.nome,
                    'estudante_telefone': a.estudante.telefone_familia,
                    'localizacao': a.localizacao,
                    'data_hora': a.data_hora.strftime("%d/%m/%Y às %H:%M:%S"),
                    'resolvido': a.resolvido
                })
                
            estudantes = Estudante.objects.all().order_by('nome')
            lista_estudantes = []
            for e in estudantes:
                lista_estudantes.append({
                    'matricula': e.matricula,
                    'nome': e.nome,
                    'telefone': e.telefone_familia
                })
                
            return JsonResponse({
                'sucesso': True,
                'alertas': lista_alertas,
                'estudantes': lista_estudantes
            })
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=400)
    return JsonResponse({'erro': 'Método não suportado'}, status=405)

