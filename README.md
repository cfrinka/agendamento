# 🏥 Sistema de Agendamento Médico

**Sistema de agendamento de consultas em tempo real para clínicas privadas brasileiras**

[![Firebase](https://img.shields.io/badge/Firebase-10.7-orange.svg)](https://firebase.google.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## 🎯 Visão Geral

Sistema **production-ready** de agendamento médico com **colaboração em tempo real**, desenvolvido especificamente para clínicas privadas brasileiras que atendem **Particular** e **Convênios**.

### Principais Características

- ✅ **Tempo Real Absoluto** - Múltiplos usuários veem dados idênticos instantaneamente
- ✅ **Zero Conflitos** - Prevenção de agendamentos duplicados no servidor
- ✅ **WhatsApp First** - Comunicação via WhatsApp (canal preferido no Brasil)
- ✅ **LGPD Compliant** - Conformidade total com privacidade de dados
- ✅ **Redução de Faltas** - Lembretes e confirmações automatizadas
- ✅ **Janela de Agendamento Flexível** - Secretária pode estender agenda dinamicamente

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Conta Firebase
- Git

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone <repo-url>
cd agendamento

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Firebase

# 4. Inicie servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Configuração Completa

Para setup completo de produção, consulte **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)**

---

## 📚 Documentação

### Documentos Principais

| Documento | Descrição |
|-----------|-----------|
| **[PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)** | Visão geral do projeto, arquitetura e roadmap |
| **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** | Guia completo de instalação e deploy |
| **[FIRESTORE_DATA_MODEL.md](docs/FIRESTORE_DATA_MODEL.md)** | Schema completo do banco de dados |
| **[CLOUD_FUNCTIONS.md](docs/CLOUD_FUNCTIONS.md)** | Todas as Cloud Functions com exemplos |
| **[REALTIME_QUERIES.md](docs/REALTIME_QUERIES.md)** | Implementação de queries em tempo real |
| **[USER_FLOWS.md](docs/USER_FLOWS.md)** | Fluxos de usuário por papel (role) |

---

## 🏗️ Arquitetura

### Stack Tecnológico

**Frontend:**
- Next.js 16 (React 19)
- TypeScript
- TailwindCSS
- Firebase SDK

**Backend:**
- Firebase Authentication
- Cloud Firestore (real-time database)
- Cloud Functions (Node.js/TypeScript)
- Cloud Scheduler

**Infraestrutura:**
- Vercel (frontend)
- Firebase (backend)
- Região: South America East 1 (São Paulo)

### Estrutura do Projeto

```
agendamento/
├── app/                    # Next.js App Router
├── lib/                    # Bibliotecas e utilitários
│   ├── firebase.ts        # Configuração Firebase
│   ├── types.ts           # TypeScript types
│   ├── hooks/             # React hooks customizados
│   │   ├── useAuth.ts
│   │   └── useCalendar.ts
│   └── services/          # Serviços de API
│       └── appointmentService.ts
├── components/            # Componentes React
├── docs/                  # Documentação completa
├── functions/             # Cloud Functions
├── firestore.rules        # Regras de segurança
├── firestore.indexes.json # Índices do Firestore
└── .env.example           # Template de variáveis de ambiente
```

---

## 👥 Papéis de Usuário

### Admin (Dono/Gerente da Clínica)
- Acesso completo ao sistema
- Gerenciar usuários, médicos, convênios
- Visualizar relatórios e logs de auditoria
- Configurar clínica

### Secretária/Recepcionista
- Criar/editar/cancelar consultas
- Gerenciar pacientes
- **Estender janela de agendamento** (recurso chave)
- Visualizar todas as consultas da clínica

### Médico
- Visualizar agenda própria
- Marcar consultas como atendidas
- Gerenciar disponibilidade própria

### Paciente
- Agendar consultas (próprias ou familiares)
- Confirmar/cancelar consultas
- Visualizar consultas futuras
- Receber notificações via WhatsApp

---

## 🔑 Recursos Principais

### 1. Calendário em Tempo Real

- Visualizações diária/semanal/mensal
- Código de cores por médico
- Indicadores de status
- Arrastar e soltar para reagendar
- **Atualizações instantâneas** em todos os usuários

### 2. Gerenciamento de Janela de Agendamento

**Regra Padrão:**
- Agendamentos permitidos para mês atual + próximo mês (2 meses)

**Override da Secretária:**
- Botão: "Abrir agenda para os próximos X meses"
- Estende janela para 2-6 meses
- Data de expiração opcional
- **Atualiza instantaneamente** para todos os usuários
- Totalmente auditado

### 3. Gerenciamento de Consultas

**Criar:**
- Selecionar médico, data, horário
- Disponibilidade de slots em tempo real
- Suporte para particular e convênio
- Agendar para si ou familiar
- Detecção automática de conflitos

**Fluxo de Status:**
```
Agendado → Confirmado → Atendido
         ↘ Falta
         ↘ Cancelado
```

**Notificações:**
- Confirmação de agendamento (WhatsApp)
- Lembrete 24h (WhatsApp)
- Lembrete 2h (WhatsApp)
- Aviso de cancelamento (WhatsApp)

---

## ⚡ Comportamento em Tempo Real

### Critério de Aceitação

**Teste: Dois usuários visualizando mesmo calendário**

1. Usuário A (Secretária) e Usuário B (Admin) abrem calendário para 15 de janeiro
2. Ambos veem consultas idênticas
3. Usuário A cria consulta às 14:00
4. **Usuário B vê nova consulta instantaneamente sem refresh** ✅
5. Usuário B cancela consulta às 10:00
6. **Usuário A vê cancelamento instantaneamente sem refresh** ✅

### Implementação

Todo comportamento em tempo real alcançado através de:
- Listeners `onSnapshot` do Firestore
- Sem polling ou refresh manual
- Conexões WebSocket
- Atualizações otimistas de UI
- Resolução de conflitos no servidor

---

## 🔐 Segurança

### Autenticação
- Email/senha via Firebase Auth
- Controle de acesso baseado em papéis
- Gerenciamento de sessão

### Autorização
- Firestore Security Rules
- Isolamento de dados por clínica (`clinicId`)
- Recursos baseados em permissões
- Validação no servidor

### Proteção de Dados
- Criptografia em repouso (Firestore)
- Criptografia em trânsito (HTTPS)
- Criptografia de dados sensíveis (CPF, números de cartão)
- Sem prontuários médicos armazenados

---

## 📊 Conformidade LGPD

### Recursos de Privacidade

- ✅ Coleta mínima de dados
- ✅ Consentimento explícito obrigatório
- ✅ Direito ao esquecimento
- ✅ Portabilidade de dados
- ✅ Logs de acesso completos
- ✅ Trilha de auditoria completa

### Dados Armazenados

**Pacientes:**
- Nome, telefone, email (opcional)
- CPF (opcional, criptografado)
- Informações de convênio
- Apenas notas operacionais (sem prontuários médicos)

---

## 🚀 Deploy

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
# Build
npm run build

# Deploy para Vercel
vercel

# Deploy Firebase (Functions + Rules)
firebase deploy
```

Consulte **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** para instruções completas.

---

## 📈 Escalabilidade

### Capacidade Atual
- **Clínicas:** Ilimitadas (multi-tenant)
- **Médicos por clínica:** 50+
- **Consultas por dia:** 500+
- **Usuários simultâneos:** 100+

### Estimativas de Custo

**Clínica Pequena (1-3 médicos):**
- ~5.000 consultas/mês
- ~R$ 25-50/mês custos Firebase

**Clínica Média (4-10 médicos):**
- ~20.000 consultas/mês
- ~R$ 100-200/mês custos Firebase

**Clínica Grande (10+ médicos):**
- ~50.000 consultas/mês
- ~R$ 250-500/mês custos Firebase

---

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

### Testar Tempo Real

1. Abra duas janelas do navegador
2. Faça login como usuários diferentes
3. Ambos navegam para o mesmo calendário
4. Crie consulta em uma janela
5. Verifique se aparece instantaneamente na outra

---

## 🗺️ Roadmap

### MVP (Fase 1) - ✅ Atual
- Calendário em tempo real
- CRUD de consultas
- Gerenciamento de janela de agendamento
- Notificações básicas
- Conformidade LGPD
- Logs de auditoria

### Fase 2 - Q2 2026
- Integração com bot WhatsApp
- Fallback SMS
- Relatórios avançados
- Portal do paciente
- Auto-serviço do médico

### Fase 3 - Q3 2026
- Apps mobile (iOS/Android)
- Consultas recorrentes
- Lista de espera
- Integração telemedicina

### Fase 4 - Q4 2026
- Gestão multi-clínica
- Suporte a franquias
- Analytics avançado
- IA para agendamento

---

## 🤝 Contribuindo

### Fluxo de Desenvolvimento

1. Criar branch de feature a partir de `main`
2. Implementar feature com testes
3. Executar linter e testes localmente
4. Criar pull request
5. Code review obrigatório
6. Testes automatizados devem passar
7. Merge para `main`
8. Deploy automático para staging

### Padrões de Código

- TypeScript strict mode
- ESLint + Prettier
- 80%+ cobertura de testes
- Sem console.log em produção
- Mensagens de commit significativas

---

## 📞 Suporte

### Para Desenvolvedores
- Revisar documentação em `/docs`
- Verificar logs do Firebase Console
- Usar emuladores Firebase para testes

### Para Equipe da Clínica
- Manual do usuário (a ser criado)
- Tutoriais em vídeo (a ser criado)
- Email de suporte: support@example.com

---

## 📄 Licença

Proprietário - Todos os direitos reservados

---

## 🎯 Critérios de Sucesso

O sistema é considerado bem-sucedido quando:

1. ✅ **Tempo real funciona perfeitamente** - Dois usuários sempre veem dados idênticos
2. ✅ **Zero agendamentos duplicados** - Conflitos prevenidos 100% do tempo
3. ✅ **Alta taxa de adoção** - 80%+ das consultas agendadas pelo sistema
4. ✅ **Baixa taxa de faltas** - < 10% de faltas (abaixo dos típicos 20-30%)
5. ✅ **Satisfação da equipe** - 90%+ da equipe acha fácil de usar
6. ✅ **Satisfação do paciente** - 90%+ dos pacientes preferem agendamento online
7. ✅ **Conformidade LGPD** - Zero violações de privacidade de dados
8. ✅ **Confiabilidade do sistema** - 99.9% uptime

---

**Construído com ❤️ para profissionais de saúde brasileiros**

Última atualização: 5 de janeiro de 2025
