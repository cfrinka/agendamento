# Cloud Functions Setup - Confirmação Inteligente e Lista de Espera

Este documento descreve como configurar as Cloud Functions necessárias para automatizar os fluxos de confirmação de consultas e lista de espera.

## Visão Geral

As seguintes funções precisam ser implementadas como Firebase Cloud Functions:

1. **Envio de Confirmações Automáticas** - Envia mensagens de WhatsApp solicitando confirmação
2. **Processamento de Respostas** - Processa respostas dos pacientes via webhook
3. **Marcação de Confirmações Pendentes** - Marca agendamentos como "aguardando confirmação"
4. **Processamento de Lista de Espera** - Oferece horários cancelados para pacientes na fila
5. **Expiração de Ofertas** - Expira ofertas não respondidas

## 1. Configuração Inicial

### Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

### Dependências Necessárias

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0",
    "twilio": "^4.19.0",
    "date-fns": "^3.0.0"
  }
}
```

## 2. Configuração do Twilio (WhatsApp)

### Criar Conta Twilio

1. Acesse https://www.twilio.com/
2. Crie uma conta e configure WhatsApp Business API
3. Obtenha as credenciais:
   - Account SID
   - Auth Token
   - WhatsApp Number

### Configurar Variáveis de Ambiente

```bash
firebase functions:config:set twilio.account_sid="YOUR_ACCOUNT_SID"
firebase functions:config:set twilio.auth_token="YOUR_AUTH_TOKEN"
firebase functions:config:set twilio.whatsapp_number="+14155238886"
```

## 3. Cloud Functions

### functions/index.js

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');
const { addHours, subHours, format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

admin.initializeApp();
const db = admin.firestore();

// Configuração Twilio
const twilioClient = twilio(
  functions.config().twilio.account_sid,
  functions.config().twilio.auth_token
);
const twilioWhatsAppNumber = functions.config().twilio.whatsapp_number;

// ============================================================================
// FUNÇÃO 1: Enviar Confirmações Automáticas
// Executar: Diariamente às 9h
// ============================================================================
exports.sendDailyConfirmations = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const hoursBeforeAppointment = 48; // Configurável
    
    // Buscar agendamentos que precisam de confirmação
    const targetDate = addHours(now.toDate(), hoursBeforeAppointment);
    
    const appointmentsSnapshot = await db.collection('appointments')
      .where('status', '==', 'agendado')
      .where('date', '>=', now)
      .where('date', '<=', admin.firestore.Timestamp.fromDate(targetDate))
      .where('confirmationRequestedAt', '==', null)
      .get();
    
    const promises = appointmentsSnapshot.docs.map(async (doc) => {
      const appointment = doc.data();
      
      // Buscar dados do paciente
      const patientDoc = await db.collection('patients').doc(appointment.patientId).get();
      const patient = patientDoc.data();
      
      // Buscar dados do médico
      const doctorDoc = await db.collection('doctors').doc(appointment.doctorId).get();
      const doctor = doctorDoc.data();
      
      // Formatar data
      const appointmentDate = appointment.date.toDate();
      const formattedDate = format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      
      // Enviar WhatsApp
      const message = `Olá ${patient.name}! 👋\n\nVocê tem uma consulta agendada:\n📅 ${formattedDate}\n👨‍⚕️ Dr(a). ${doctor.name}\n\nPor favor, confirme sua presença:\n✅ Responda SIM para confirmar\n❌ Responda NÃO para cancelar\n\nID: ${doc.id}`;
      
      try {
        await twilioClient.messages.create({
          from: `whatsapp:${twilioWhatsAppNumber}`,
          to: `whatsapp:${patient.phone}`,
          body: message
        });
        
        // Atualizar agendamento
        await doc.ref.update({
          confirmationRequestedAt: now,
          updatedAt: now
        });
        
        console.log(`Confirmação enviada para ${patient.name} - Agendamento ${doc.id}`);
      } catch (error) {
        console.error(`Erro ao enviar para ${patient.phone}:`, error);
      }
    });
    
    await Promise.all(promises);
    console.log(`${promises.length} confirmações enviadas`);
  });

// ============================================================================
// FUNÇÃO 2: Processar Respostas de WhatsApp
// Webhook do Twilio
// ============================================================================
exports.processWhatsAppResponse = functions.https.onRequest(async (req, res) => {
  const { Body, From } = req.body;
  const response = Body.trim().toUpperCase();
  const phone = From.replace('whatsapp:', '');
  
  try {
    // Extrair ID do agendamento da última mensagem
    const appointmentId = extractAppointmentId(Body);
    
    if (!appointmentId) {
      res.status(200).send('OK');
      return;
    }
    
    const appointmentRef = db.collection('appointments').doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();
    
    if (!appointmentDoc.exists) {
      res.status(200).send('OK');
      return;
    }
    
    const now = admin.firestore.Timestamp.now();
    
    if (response.includes('SIM') || response.includes('CONFIRMAR')) {
      await appointmentRef.update({
        status: 'confirmado',
        confirmedAt: now,
        updatedAt: now
      });
      
      await twilioClient.messages.create({
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: From,
        body: '✅ Consulta confirmada com sucesso! Até breve!'
      });
    } else if (response.includes('NÃO') || response.includes('NAO') || response.includes('CANCELAR')) {
      await appointmentRef.update({
        status: 'cancelado',
        cancelledAt: now,
        cancelledBy: 'patient',
        updatedAt: now
      });
      
      await twilioClient.messages.create({
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: From,
        body: '❌ Consulta cancelada. Se precisar reagendar, entre em contato conosco.'
      });
      
      // Disparar fluxo de lista de espera
      await processWaitlistForAppointment(appointmentId);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao processar resposta:', error);
    res.status(500).send('Error');
  }
});

// ============================================================================
// FUNÇÃO 3: Marcar Confirmações Pendentes
// Executar: A cada hora
// ============================================================================
exports.markPendingConfirmations = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const now = new Date();
    const hoursBeforeAppointment = 24;
    const hoursSinceRequest = 12;
    
    const appointmentsSnapshot = await db.collection('appointments')
      .where('status', '==', 'agendado')
      .get();
    
    const promises = appointmentsSnapshot.docs.map(async (doc) => {
      const appointment = doc.data();
      
      if (!appointment.confirmationRequestedAt) return;
      
      const appointmentDate = appointment.date.toDate();
      const confirmationRequested = appointment.confirmationRequestedAt.toDate();
      
      const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
      const hoursSinceRequestTime = (now - confirmationRequested) / (1000 * 60 * 60);
      
      if (hoursUntilAppointment < hoursBeforeAppointment && hoursSinceRequestTime > hoursSinceRequest) {
        await doc.ref.update({
          status: 'aguardando-confirmacao',
          updatedAt: admin.firestore.Timestamp.now()
        });
        console.log(`Agendamento ${doc.id} marcado como aguardando confirmação`);
      }
    });
    
    await Promise.all(promises);
  });

// ============================================================================
// FUNÇÃO 4: Processar Lista de Espera em Cancelamento
// Trigger: Quando appointment.status muda para 'cancelado'
// ============================================================================
exports.onAppointmentCancelled = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Verificar se foi cancelado
    if (before.status !== 'cancelado' && after.status === 'cancelado') {
      await processWaitlistForAppointment(context.params.appointmentId);
    }
  });

async function processWaitlistForAppointment(appointmentId) {
  const appointmentDoc = await db.collection('appointments').doc(appointmentId).get();
  if (!appointmentDoc.exists) return;
  
  const appointment = appointmentDoc.data();
  
  // Buscar médico
  const doctorDoc = await db.collection('doctors').doc(appointment.doctorId).get();
  if (!doctorDoc.exists) return;
  
  const doctor = doctorDoc.data();
  
  // Buscar lista de espera
  const waitlistSnapshot = await db.collection('waitlist')
    .where('clinicId', '==', appointment.clinicId)
    .where('status', '==', 'waiting')
    .orderBy('createdAt', 'asc')
    .limit(10)
    .get();
  
  if (waitlistSnapshot.empty) {
    console.log('Nenhum paciente na lista de espera');
    return;
  }
  
  const appointmentDate = appointment.date.toDate();
  
  // Procurar paciente compatível
  for (const waitlistDoc of waitlistSnapshot.docs) {
    const waitlistEntry = waitlistDoc.data();
    
    // Verificar especialidade
    const isSpecialtyMatch = doctor.specialties.some(
      s => s.toLowerCase() === waitlistEntry.specialty.toLowerCase()
    );
    if (!isSpecialtyMatch) continue;
    
    // Verificar médico (se especificado)
    if (waitlistEntry.doctorId && waitlistEntry.doctorId !== appointment.doctorId) continue;
    
    // Verificar data
    const preferredStart = waitlistEntry.preferredDateRange.start.toDate();
    const preferredEnd = waitlistEntry.preferredDateRange.end.toDate();
    if (appointmentDate < preferredStart || appointmentDate > preferredEnd) continue;
    
    // Paciente compatível encontrado!
    const offerExpiresAt = addHours(new Date(), 0.25); // 15 minutos
    
    await waitlistDoc.ref.update({
      status: 'offered',
      offeredAppointmentId: appointmentId,
      offeredAt: admin.firestore.Timestamp.now(),
      offerExpiresAt: admin.firestore.Timestamp.fromDate(offerExpiresAt),
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    // Enviar WhatsApp
    const patientDoc = await db.collection('patients').doc(waitlistEntry.patientId).get();
    const patient = patientDoc.data();
    
    const formattedDate = format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    await twilioClient.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${patient.phone}`,
      body: `🎉 Boa notícia!\n\nUm horário ficou disponível:\n📅 ${formattedDate}\n👨‍⚕️ Dr(a). ${doctor.name}\n\n⏰ Você tem 15 minutos para responder:\n✅ Responda SIM para aceitar\n❌ Responda NÃO para recusar\n\nID: ${waitlistDoc.id}`
    });
    
    console.log(`Horário oferecido ao paciente ${patient.name}`);
    break; // Ofereceu para o primeiro compatível
  }
}

// ============================================================================
// FUNÇÃO 5: Expirar Ofertas Não Respondidas
// Executar: A cada 5 minutos
// ============================================================================
exports.expireWaitlistOffers = functions.pubsub
  .schedule('*/5 * * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    const waitlistSnapshot = await db.collection('waitlist')
      .where('status', '==', 'offered')
      .where('offerExpiresAt', '<=', now)
      .get();
    
    const promises = waitlistSnapshot.docs.map(async (doc) => {
      const waitlistEntry = doc.data();
      
      await doc.ref.update({
        status: 'expired',
        updatedAt: now
      });
      
      // Processar próximo da fila
      if (waitlistEntry.offeredAppointmentId) {
        await processWaitlistForAppointment(waitlistEntry.offeredAppointmentId);
      }
      
      console.log(`Oferta expirada para waitlist ${doc.id}`);
    });
    
    await Promise.all(promises);
  });

// ============================================================================
// FUNÇÃO AUXILIAR: Extrair ID do Agendamento
// ============================================================================
function extractAppointmentId(message) {
  const match = message.match(/ID:\s*([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}
```

## 4. Deploy

```bash
firebase deploy --only functions
```

## 5. Configurar Webhook do Twilio

1. Acesse o Console do Twilio
2. Vá em WhatsApp > Sandbox Settings
3. Configure o webhook para: `https://YOUR_PROJECT.cloudfunctions.net/processWhatsAppResponse`
4. Método: POST

## 6. Índices Firestore Necessários

Execute no Firebase Console ou via CLI:

```javascript
// appointments
db.collection('appointments').createIndex({
  status: 'ASCENDING',
  date: 'ASCENDING',
  confirmationRequestedAt: 'ASCENDING'
});

// waitlist
db.collection('waitlist').createIndex({
  clinicId: 'ASCENDING',
  status: 'ASCENDING',
  createdAt: 'ASCENDING'
});

db.collection('waitlist').createIndex({
  status: 'ASCENDING',
  offerExpiresAt: 'ASCENDING'
});
```

## 7. Monitoramento

### Logs

```bash
firebase functions:log
```

### Métricas

Acesse Firebase Console > Functions para ver:
- Invocações
- Tempo de execução
- Erros
- Custos

## 8. Testes

### Testar Localmente

```bash
firebase emulators:start --only functions,firestore
```

### Testar Webhook

```bash
curl -X POST https://YOUR_PROJECT.cloudfunctions.net/processWhatsAppResponse \
  -d "Body=SIM ID:APPOINTMENT_ID" \
  -d "From=whatsapp:+5511999999999"
```

## 9. Custos Estimados

### Firebase Functions
- 2M invocações/mês: Grátis
- Acima: $0.40 por 1M invocações

### Twilio WhatsApp
- $0.005 por mensagem enviada
- $0.005 por mensagem recebida

### Estimativa Mensal (1000 pacientes)
- ~2000 mensagens/mês
- Custo: ~$20/mês

## 10. Segurança

### Regras Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /waitlist/{waitlistId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.clinicId == resource.data.clinicId;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'secretary'];
    }
  }
}
```

## 11. Troubleshooting

### Mensagens não estão sendo enviadas
- Verificar credenciais Twilio
- Verificar saldo da conta
- Verificar logs: `firebase functions:log`

### Ofertas não estão expirando
- Verificar se a função está agendada corretamente
- Verificar timezone
- Verificar índices Firestore

### Webhook não está funcionando
- Verificar URL no Twilio
- Verificar logs de erro
- Testar manualmente com curl

## 12. Próximos Passos

- [ ] Implementar retry logic para mensagens falhadas
- [ ] Adicionar analytics de taxa de confirmação
- [ ] Implementar notificações por SMS como fallback
- [ ] Adicionar dashboard de métricas
- [ ] Implementar A/B testing de mensagens
