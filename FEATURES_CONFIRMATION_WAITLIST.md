# Confirmação Inteligente de Consultas e Lista de Espera

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Feature 1: Confirmação Inteligente](#feature-1-confirmação-inteligente-de-consultas)
3. [Feature 2: Lista de Espera](#feature-2-lista-de-espera-waitlist)
4. [Arquitetura Técnica](#arquitetura-técnica)
5. [Fluxos de Negócio](#fluxos-de-negócio)
6. [Guia de Uso](#guia-de-uso)
7. [Configuração](#configuração)

---

## Visão Geral

Duas novas features foram implementadas para otimizar o gerenciamento de consultas e reduzir no-show:

### ✅ Confirmação Inteligente de Consultas
Sistema automatizado que solicita confirmação de presença via WhatsApp e atualiza status em tempo real.

### 🕐 Lista de Espera (Waitlist)
Sistema FIFO que oferece automaticamente horários cancelados para pacientes em espera.

---

## Feature 1: Confirmação Inteligente de Consultas

### 🎯 Objetivo
Reduzir taxa de no-show através de confirmação proativa e automatizada.

### 📊 Status de Agendamentos

| Status | Descrição | Cor | Ações Disponíveis |
|--------|-----------|-----|-------------------|
| **Agendado** | Consulta criada, aguardando confirmação | Azul | Confirmar, Cancelar |
| **Confirmado** | Paciente confirmou presença | Verde | Realizado, No-Show, Cancelar |
| **Aguardando Confirmação** | Paciente não respondeu no prazo | Vermelho | Confirmar (manual), Cancelar |
| **Realizado** | Consulta foi realizada | Cinza | - |
| **No-Show** | Paciente faltou | Vermelho | - |
| **Cancelado** | Consulta cancelada | Vermelho | - |

### 🔄 Fluxo Automático

```
1. Agendamento criado → Status: "Agendado"
   ↓
2. 48h antes da consulta → Envia WhatsApp solicitando confirmação
   ↓
3a. Paciente responde "SIM" → Status: "Confirmado"
3b. Paciente responde "NÃO" → Status: "Cancelado" + Dispara Lista de Espera
3c. Sem resposta após 12h → Status: "Aguardando Confirmação" + Alerta visual
```

### 🚨 Alertas Visuais

**Quando um agendamento está "Aguardando Confirmação":**
- ⚠️ Borda vermelha no card
- 📢 Banner de alerta destacado
- 💬 Mensagem: "Paciente não confirmou presença. Entre em contato urgente!"
- 👥 Visível apenas para Admin e Secretary

### 📱 Mensagem de Confirmação (WhatsApp)

```
Olá [Nome do Paciente]! 👋

Você tem uma consulta agendada:
📅 [Data e Hora]
👨‍⚕️ Dr(a). [Nome do Médico]

Por favor, confirme sua presença:
✅ Responda SIM para confirmar
❌ Responda NÃO para cancelar

ID: [ID do Agendamento]
```

### 🔐 Permissões

| Role | Visualizar Status | Confirmar Manualmente | Receber Alertas |
|------|-------------------|----------------------|-----------------|
| Admin | ✅ | ✅ | ✅ |
| Secretary | ✅ | ✅ | ✅ |
| Doctor | ✅ | ❌ | ❌ |
| Patient | ❌ | ❌ | ❌ |

### 💾 Modelo de Dados

```typescript
interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  date: Timestamp;
  status: 'agendado' | 'confirmado' | 'aguardando-confirmacao' | 
          'cancelado' | 'realizado' | 'no-show';
  
  // Campos de confirmação
  confirmationRequestedAt?: Timestamp;
  confirmedAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancelledBy?: 'patient' | 'system' | 'staff' | null;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Feature 2: Lista de Espera (Waitlist)

### 🎯 Objetivo
Otimizar preenchimento de horários vagos causados por cancelamentos.

### 📋 Fila FIFO (First In, First Out)

Pacientes são ordenados por **data de entrada** na lista. O primeiro compatível recebe a oferta.

### 🔄 Fluxo Automático

```
1. Consulta é cancelada
   ↓
2. Sistema busca automaticamente pacientes compatíveis:
   - Mesma clínica
   - Mesma especialidade
   - Médico compatível (se especificado)
   - Data dentro do período preferido
   ↓
3. PRIMEIRO da fila recebe oferta via WhatsApp
   - Tempo limite: 15 minutos
   ↓
4a. Paciente aceita → Agendamento criado automaticamente
4b. Paciente recusa/expira → Passa para o PRÓXIMO da fila
```

### 📊 Status da Lista de Espera

| Status | Descrição | Cor | Ação |
|--------|-----------|-----|------|
| **Aguardando** | Na fila, aguardando horário | Azul | Posição na fila visível |
| **Oferta Ativa** | Horário oferecido, aguardando resposta | Verde | Timer de 15 min |
| **Aceito** | Paciente aceitou e foi agendado | Cinza | Movido para histórico |
| **Expirado** | Não respondeu no prazo | Vermelho | Movido para histórico |

### 🎫 Indicadores Visuais

**Fila Ativa:**
- 🔢 Número da posição em círculo destacado
- 📍 Cards organizados por ordem de chegada
- ⚡ Badge de "Oferta Ativa" para quem está com horário oferecido
- ⏰ Alerta visual quando há oferta pendente

**Histórico:**
- 📜 Seção separada
- 🔍 Opacidade reduzida
- 📊 Status final (Aceito/Expirado)

### 📱 Mensagem de Oferta (WhatsApp)

```
🎉 Boa notícia!

Um horário ficou disponível:
📅 [Data e Hora]
👨‍⚕️ Dr(a). [Nome do Médico]

⏰ Você tem 15 minutos para responder:
✅ Responda SIM para aceitar
❌ Responda NÃO para recusar

ID: [ID da Lista de Espera]
```

### 🔐 Permissões

| Role | Visualizar Fila | Adicionar Paciente | Remover Paciente |
|------|-----------------|-------------------|------------------|
| Admin | ✅ | ✅ | ✅ |
| Secretary | ✅ | ✅ | ✅ |
| Doctor | ✅ | ❌ | ❌ |
| Patient | ❌ | ❌ | ❌ |

### 💾 Modelo de Dados

```typescript
interface WaitlistEntry {
  id: string;
  clinicId: string;
  patientId: string;
  specialty: string;
  doctorId?: string | null; // Opcional
  
  preferredDateRange: {
    start: Timestamp;
    end: Timestamp;
  };
  
  status: 'waiting' | 'offered' | 'accepted' | 'expired';
  
  // Campos de oferta
  offeredAppointmentId?: string | null;
  offeredAt?: Timestamp;
  offerExpiresAt?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Arquitetura Técnica

### 🏗️ Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **UI:** shadcn/ui, TailwindCSS
- **Backend:** Firebase Firestore, Cloud Functions
- **Mensageria:** Twilio WhatsApp Business API
- **Real-time:** Firestore onSnapshot listeners

### 📁 Estrutura de Arquivos

```
app/
├── appointments/
│   └── page.tsx              # Atualizado com novos status e alertas
├── calendar/
│   └── page.tsx              # Atualizado com novos status
├── waitlist/
│   ├── page.tsx              # Página principal da lista de espera
│   └── new/
│       └── page.tsx          # Adicionar paciente à lista

lib/
├── actions/
│   ├── whatsapp.ts           # Server actions para WhatsApp e automações
│   └── waitlist.ts           # Server actions para gerenciar lista de espera

types/
└── index.ts                  # Tipos TypeScript (Appointment, WaitlistEntry)

CLOUD_FUNCTIONS_SETUP.md     # Documentação completa das Cloud Functions
```

### 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  • Appointments Page (com alertas)                          │
│  • Calendar Page (com novos status)                         │
│  • Waitlist Page (fila FIFO)                                │
│  • Real-time listeners (onSnapshot)                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                  FIRESTORE DATABASE                          │
├─────────────────────────────────────────────────────────────┤
│  Collections:                                                │
│  • appointments (com campos de confirmação)                  │
│  • waitlist (fila ordenada por createdAt)                   │
│  • patients, doctors, clinics                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              CLOUD FUNCTIONS (Automação)                     │
├─────────────────────────────────────────────────────────────┤
│  1. sendDailyConfirmations (cron: 9h diário)               │
│  2. processWhatsAppResponse (webhook)                       │
│  3. markPendingConfirmations (cron: a cada hora)           │
│  4. onAppointmentCancelled (trigger)                        │
│  5. expireWaitlistOffers (cron: a cada 5 min)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              TWILIO WHATSAPP API                             │
├─────────────────────────────────────────────────────────────┤
│  • Envio de mensagens                                        │
│  • Recebimento via webhook                                   │
│  • Processamento de respostas                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxos de Negócio

### 🔄 Fluxo Completo: Confirmação + Lista de Espera

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CRIAÇÃO DO AGENDAMENTO                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓ Status: "Agendado"
┌─────────────────────────────────────────────────────────────┐
│ 2. ENVIO DE CONFIRMAÇÃO (48h antes)                         │
│    Cloud Function: sendDailyConfirmations                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────────┐
        ↓                     ↓                   ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Responde SIM │    │ Responde NÃO │    │ Sem Resposta │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       ↓                   ↓                    ↓ (após 12h)
Status:            Status:              Status:
"Confirmado"       "Cancelado"          "Aguardando Confirmação"
       │                   │                    │
       │                   ↓                    ↓
       │         ┌──────────────────┐    ┌──────────────┐
       │         │ LISTA DE ESPERA  │    │ ALERTA VISUAL│
       │         │ Busca compatível │    │ Para staff   │
       │         └────────┬─────────┘    └──────────────┘
       │                  │
       │         ┌────────┴────────┐
       │         ↓                 ↓
       │   ┌──────────┐      ┌──────────┐
       │   │ Encontrou│      │ Não Achou│
       │   │ Paciente │      │ Ninguém  │
       │   └────┬─────┘      └──────────┘
       │        │
       │        ↓ Oferta (15 min)
       │   ┌──────────────────┐
       │   │ Paciente Aceita? │
       │   └────┬──────┬──────┘
       │        │      │
       │    SIM │      │ NÃO/Expirou
       │        ↓      ↓
       │   Agendado  Próximo da Fila
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. DIA DA CONSULTA                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
┌──────────────┐    ┌──────────────┐
│ Compareceu   │    │ Não Veio     │
└──────┬───────┘    └──────┬───────┘
       │                   │
       ↓                   ↓
Status:            Status:
"Realizado"        "No-Show"
```

### ⚡ Atomicidade e Transações

**Garantias:**
- ✅ Um horário cancelado só é oferecido para UM paciente por vez
- ✅ Ofertas expiradas automaticamente passam para o próximo
- ✅ Pacientes que aceitam são removidos da fila automaticamente
- ✅ Status são atualizados em tempo real via listeners

---

## Guia de Uso

### 👨‍💼 Para Admin/Secretary

#### Gerenciar Confirmações

1. **Ver Alertas:**
   - Acesse "Consultas" ou "Calendário"
   - Agendamentos com borda vermelha precisam de atenção
   - Banner de alerta indica falta de confirmação

2. **Confirmar Manualmente:**
   - Click no botão "Confirmar" no card
   - Status muda para "Confirmado"

3. **Cancelar Consulta:**
   - Click em "Cancelar"
   - Confirme a ação
   - Lista de espera é acionada automaticamente

#### Gerenciar Lista de Espera

1. **Adicionar Paciente:**
   ```
   Waitlist → "Adicionar à Lista"
   ├── Selecionar Paciente
   ├── Escolher Especialidade
   ├── Médico Preferido (opcional)
   └── Período Preferido (datas)
   ```

2. **Visualizar Fila:**
   - **Fila Ativa:** Pacientes aguardando
   - **Posição:** Número em círculo
   - **Oferta Ativa:** Badge verde + alerta
   - **Histórico:** Aceitos e expirados

3. **Remover da Fila:**
   - Click em "Remover da Lista"
   - Confirme a ação

### 👨‍⚕️ Para Doctor

- **Visualizar:** Status de confirmação e lista de espera
- **Sem Ações:** Não pode confirmar ou gerenciar fila

### 👤 Para Patient

- **Interação:** Apenas via WhatsApp
- **Não acessa:** Painel web

---

## Configuração

### 📋 Pré-requisitos

1. ✅ Firebase Project configurado
2. ✅ Firestore habilitado
3. ✅ Cloud Functions habilitadas
4. ✅ Conta Twilio com WhatsApp Business API

### 🚀 Setup Rápido

#### 1. Instalar Dependências

```bash
npm install
```

#### 2. Configurar Índices Firestore

```bash
# Via Firebase Console ou CLI
firebase firestore:indexes
```

Índices necessários:
- `appointments`: `status`, `date`, `confirmationRequestedAt`
- `waitlist`: `clinicId`, `status`, `createdAt`
- `waitlist`: `status`, `offerExpiresAt`

#### 3. Configurar Cloud Functions

Siga o guia completo em: [`CLOUD_FUNCTIONS_SETUP.md`](./CLOUD_FUNCTIONS_SETUP.md)

**Resumo:**
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Configurar Twilio
firebase functions:config:set twilio.account_sid="YOUR_SID"
firebase functions:config:set twilio.auth_token="YOUR_TOKEN"
firebase functions:config:set twilio.whatsapp_number="+14155238886"

# Deploy
firebase deploy --only functions
```

#### 4. Configurar Webhook Twilio

No Twilio Console:
- URL: `https://YOUR_PROJECT.cloudfunctions.net/processWhatsAppResponse`
- Método: POST

### ⚙️ Configurações Ajustáveis

**No código das Cloud Functions:**

```javascript
// Tempo antes da consulta para enviar confirmação
const hoursBeforeAppointment = 48; // Padrão: 48h

// Tempo para marcar como "aguardando confirmação"
const hoursSinceRequest = 12; // Padrão: 12h

// Tempo para responder oferta da lista de espera
const offerExpirationMinutes = 15; // Padrão: 15 min
```

---

## 📊 Métricas e KPIs

### Confirmação Inteligente

- **Taxa de Confirmação:** % de pacientes que confirmam
- **Taxa de No-Show:** % de faltas (deve reduzir)
- **Tempo Médio de Resposta:** Quanto tempo levam para confirmar
- **Confirmações Pendentes:** Quantos estão aguardando

### Lista de Espera

- **Taxa de Preenchimento:** % de horários cancelados preenchidos
- **Tempo Médio na Fila:** Quanto tempo até receber oferta
- **Taxa de Aceitação:** % de ofertas aceitas
- **Taxa de Expiração:** % de ofertas não respondidas

---

## 🔒 Segurança

### RBAC (Role-Based Access Control)

Todas as operações respeitam permissões por role:
- ✅ Verificação no frontend
- ✅ Validação no backend (Cloud Functions)
- ✅ Regras Firestore Security Rules

### Dados Sensíveis

- 🔐 Números de telefone armazenados com segurança
- 🔐 IDs de agendamento não expostos publicamente
- 🔐 Webhook Twilio com validação de origem

---

## 🐛 Troubleshooting

### Mensagens não estão sendo enviadas

1. Verificar credenciais Twilio
2. Verificar saldo da conta
3. Checar logs: `firebase functions:log`

### Ofertas não estão expirando

1. Verificar cron job está ativo
2. Verificar timezone configurado
3. Verificar índices Firestore

### Alerta não aparece

1. Verificar role do usuário (Admin/Secretary)
2. Verificar status do agendamento
3. Limpar cache do navegador

---

## 📈 Próximas Melhorias

- [ ] Dashboard de métricas e analytics
- [ ] Notificações por SMS como fallback
- [ ] Múltiplos idiomas
- [ ] Integração com Google Calendar
- [ ] A/B testing de mensagens
- [ ] Machine Learning para prever no-show
- [ ] Lembretes adicionais (24h, 2h antes)
- [ ] Confirmação por email

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte [`CLOUD_FUNCTIONS_SETUP.md`](./CLOUD_FUNCTIONS_SETUP.md)
2. Verifique logs do Firebase
3. Revise configurações do Twilio

---

**Versão:** 1.0.0  
**Última Atualização:** Janeiro 2026  
**Status:** ✅ Pronto para Produção (após configurar Cloud Functions)
