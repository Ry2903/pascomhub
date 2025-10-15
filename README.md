# pascomhub
PascomHub é uma plataforma web moderna desenvolvida para agilizar o gerenciamento de escalas da PASCOM (Pastoral da Comunicação) da Paróquia Divino Espírito Santo. O sistema permite cadastro de membros, criação de eventos personalizados e missas, atribuição de funções e envio automático de notificações para funções ainda vagas.

## 📝 Funcionalidades
### 👥 Membros da Pastoral:
- Cadastro com nome, e-mail, senha e habilidades
- Visualização de eventos disponíveis
- Assumir funções de eventos
- Área de perfil para visualizar e atualizar suas habilidades
- Recebimento de notificações push e email sobre funções vagas.

### 🚹 Coordenador da Pastoral:
- Dashboard exclusivo para criação de eventos personalizados e missas.
- Seleção de funções e número de membros necessários por função.

### ⛪ Eventos:
- Criação de eventos personalizados e missas padronizadas.
- Funções e sub-habilidades associadas a cada evento.
- Exibição de eventos em formato de cards expansíveis.
- Funções já ocupadas são destacadas com cores diferentes.
- Exclusão automática de eventos após a data do evento terminar.

### 💬 Notificações:
- Alertas push e email enviados 24h e 12h antes do evento para funções ainda vagas.

## 🎨 Identidade Visual
- Fundo principal: Off White (#F5F5F5)
- Containers: Azul Escuro (#001F3F)
- Detalhes e botões: Dourado (#d4af37)
- Layout responsivo para dispositivos móveis.

## 🛠 Tecnologias Utilizadas
- Frontend: HTML, CSS, JavaScript
- Backend & Autenticação: Firebase Auth
- Banco de Dados: Firestore
- Notificações: Firebase Cloud Messaging (Push) + SendGrid (Email)
- Hospedagem: Vercel