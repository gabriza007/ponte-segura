# Implementação do Painel das Autoridades (Dashboard Policial)

A missão agora é criar uma "Central de Comando" onde a Guarda Municipal consegue listar todos os Estudantes e monitorar em tempo real os Alertas de SOS gerados, usando designs adaptáveis (desktop na central e mobile na viatura).

## User Review Required

> [!IMPORTANT]
> Para proteger os dados e impedir que qualquer aluno veja os Alertas da polícia, **nós precisamos pôr um bloqueio básico na API**.
>
> Proponho duas estratégias para o **Acesso Seguro** da Polícia:
> 1. **Senha Oculta:** O Painel das autoridades exigirá uma "Senha de Oficial" para visualizar a tela. Se a senha for "153" (número da Guarda), ele mostra os dados.
> 2. **Login com Conta Django:** A polícia precisará validar usuário/senha do banco real de superusuários do Django.
>
> Pelo escopo de protótipo, a **Estratégia 1 (Senha Exclusiva da Guarda)** permite criar o painel muito mais rápido. Você aprova essa abordagem de Senha Fixa para o Painel ou quer o uso de usuários de BD reais?

## Proposed Changes

---
### 1. Backend: Criação da API de Leitura

Precisamos de uma nova rota que puxe os dados do banco, mas apenas se o "Distintivo/Senha" correto for apresentado.

#### [MODIFY] [backend_ponte/alertas/views.py](file:///d:/estudos/ponte%20segura/backend_ponte/alertas/views.py)
Adição de uma nova função:
- Criar a view `listar_ocorrencias(request)`.
- Validar se o `token` secreto da polícia foi enviado.
- Coletar `AlertaSOS.objects.all().order_by('-data_hora')` (Os mais recentes primeiro).
- Serializar os dados (data/hora, nome, matrícula) de volta pelo JsonResponse.

#### [MODIFY] [backend_ponte/alertas/urls.py](file:///d:/estudos/ponte%20segura/backend_ponte/alertas/urls.py)
- Adicionar o atalho `/api/painel/` para servir a nova visualização de ocorrências.

---
### 2. Frontend: Tela do Comando (React Responsivo)

Nós não vamos misturar o App do Estudante com a tela da Guarda. Vamos criar um "App novo e isolado".

#### [NEW] [frontend/painel.html](file:///d:/estudos/ponte%20segura/frontend/painel.html)
- Estruturar a página HTML/React específica da Autoridade.
- Integrar a segurança do `<LoginAutoridades />` e o `<DashboardLayout />`.
- **Media Queries Específicas:**
  - `Desktop (Resoluções > 800px)`: Interface Tática com Sidebar à Esquerda. Lista de Alertas desenhada em **Tabela de Dados**, permitindo ver múltiplas informações horizontais (Horário, Nome, Tel, Local).
  - `Mobile (Resoluções < 800px)`: Para oficiais via rádio/celular, a tela se encolhe para um modelo de "Aba Oculta" com as Ocorrências em formato de **Cards Verticais** grandões de fácil toque.

## Verification Plan

### Manual Verification
- Abriremos `frontend/painel.html` no PC. Ele deve solicitar a Identificação do Oficial.
- Ao colocar a senha correta, baterá na rota `/api/painel/`.
- Usaremos o modo "Inspecionar > Mobile" do navegador para verificar se a tela do Monitor troca instantaneamente da interface Tática de Computador para o modo Viatura (Mobile) perfeitamente desenhada.
