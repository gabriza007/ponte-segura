# Documento de Requisitos

Este documento descreve os requisitos funcionais e não funcionais do sistema **Alerta SOS Estudante**, um sistema de alertas de emergência para estudantes e a Guarda Municipal.

## 1. Requisitos Funcionais (RF)

Os requisitos funcionais definem as funções que o sistema deve realizar.

*   **RF01 - Envio de Alerta (SOS):** O sistema deve permitir que estudantes enviem um alerta de emergência (SOS) imediato com apenas um clique.
*   **RF02 - Captura de Localização:** O sistema deve capturar a localização GPS precisa do estudante no momento em que o alerta é acionado.
*   **RF03 - Recepção de Alertas:** O sistema deve permitir que a Guarda Municipal receba os alertas enviados pelos estudantes em tempo real.
*   **RF04 - Rastreamento no Radar:** O sistema deve exibir para a Guarda Municipal um radar interativo para rastrear e monitorar os alertas e a localização dos estudantes em tempo real.
*   **RF05 - Chat ao Vivo:** O sistema deve fornecer um canal de comunicação via chat ao vivo entre o estudante em perigo e a central de operações (Guarda Municipal).
*   **RF06 - Autenticação de Usuários:** O sistema deve possuir um mecanismo de login e autenticação para diferenciar estudantes de agentes da Guarda Municipal e garantir a segurança do acesso.

## 2. Requisitos Não Funcionais (RNF)

Os requisitos não funcionais especificam critérios que podem ser usados para julgar a operação de um sistema, em vez de comportamentos específicos.

*   **RNF01 - Tempo Real:** O sistema deve processar o envio e o recebimento de alertas, bem como as mensagens do chat, em tempo real com baixa latência.
*   **RNF02 - Usabilidade sob Tensão:** A interface do usuário deve ser altamente intuitiva, responsiva e focada na facilidade de uso durante momentos de tensão (design "glassmorphism" e moderno).
*   **RNF03 - Disponibilidade e Escalabilidade:** O backend deve ser baseado em soluções em nuvem (BaaS - Backend as a Service) para garantir alta disponibilidade e escalabilidade.
*   **RNF04 - Segurança de Dados:** Os dados de localização e informações dos usuários devem ser armazenados de forma segura e protegidos contra acessos não autorizados.
*   **RNF05 - Tecnologias (Frontend):** O frontend deve ser desenvolvido utilizando React (com Vite), TypeScript e Tailwind CSS.
*   **RNF06 - Tecnologias (Backend):** O backend deve utilizar os serviços do Firebase (Authentication e Firestore).
*   **RNF07 - Mapas:** A visualização de mapas e localização no radar deve ser implementada utilizando a biblioteca React Leaflet.
