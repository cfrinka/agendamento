# Limites de Agendamento para Pacientes

## 📋 Visão Geral

Pacientes agora podem agendar suas próprias consultas através do sistema, mas com um limite de **2 agendamentos ativos** por vez. Após uma consulta ser realizada ou cancelada, o paciente pode agendar outra.

## 🔒 Regras de Segurança (Firestore)

### Permissões de Agendamento

**Pacientes podem:**
- ✅ Criar agendamentos para si mesmos
- ✅ Visualizar seus próprios agendamentos
- ✅ Atualizar seus próprios agendamentos (mas não podem mudar o `patientId`)
- ❌ Criar agendamentos para outros pacientes
- ❌ Deletar agendamentos

**Admin e Secretary podem:**
- ✅ Criar agendamentos para qualquer paciente
- ✅ Visualizar todos os agendamentos da clínica
- ✅ Atualizar qualquer agendamento
- ✅ Deletar agendamentos (apenas Admin)

### Regras Implementadas

```javascript
// firestore.rules - Appointments Collection
allow create: if isAuthenticated() &&
                 belongsToClinic(request.resource.data.clinicId) &&
                 request.resource.data.date > request.time &&
                 (isAdminOrSecretary() || 
                  (isPatient() && 
                   request.resource.data.patientId == getUserData().patientId &&
                   request.resource.data.status in ['agendado', 'confirmado']));

allow update: if belongsToClinic(resource.data.clinicId) &&
                 (isAdminOrSecretary() ||
                  (isDoctor() && resource.data.doctorId == getUserData().doctorId) ||
                  (isPatient() && 
                   resource.data.patientId == getUserData().patientId &&
                   request.resource.data.patientId == resource.data.patientId));
```

## 📊 Sistema de Limites

### Definição de "Agendamento Ativo"

Um agendamento é considerado **ativo** quando:
- ✅ Data é futura (`date > now`)
- ✅ Status é um dos seguintes:
  - `agendado`
  - `confirmado`
  - `aguardando-confirmacao`

Um agendamento **NÃO** é considerado ativo quando:
- ❌ Status é `cancelado`
- ❌ Status é `realizado`
- ❌ Status é `no-show`
- ❌ Data já passou

### Limite de 2 Agendamentos

**Regra:** Paciente pode ter no máximo **2 agendamentos ativos** simultaneamente.

**Quando o limite é liberado:**
- Quando uma consulta é realizada (status → `realizado`)
- Quando uma consulta é cancelada (status → `cancelado`)
- Quando uma consulta passa (data no passado)
- Quando paciente não comparece (status → `no-show`)

## 🛠️ Implementação Técnica

### Arquivo: `lib/appointmentLimits.ts`

Funções criadas:

#### 1. `canPatientSchedule(patientId: string)`

Verifica se um paciente pode agendar uma nova consulta.

**Retorna:**
```typescript
{
  canSchedule: boolean;      // true se pode agendar
  activeCount: number;        // número de agendamentos ativos
  message?: string;           // mensagem explicativa
}
```

**Exemplo de uso:**
```typescript
const result = await canPatientSchedule(patientId);
if (!result.canSchedule) {
  alert(result.message);
  return;
}
```

#### 2. `getActiveAppointments(patientId: string)`

Retorna lista de agendamentos ativos do paciente.

**Retorna:**
```typescript
Array<{
  id: string;
  date: Timestamp;
  status: string;
  doctorId: string;
  // ... outros campos
}>
```

### Arquivo: `app/book/page.tsx`

**Validações implementadas:**

1. **Verificação automática ao carregar a página:**
   - Se usuário é paciente, verifica limite automaticamente
   - Exibe alerta visual com status do limite

2. **Validação antes de criar agendamento:**
   ```typescript
   if (user.role === 'patient' && user.patientId) {
     const limitCheck = await canPatientSchedule(user.patientId);
     if (!limitCheck.canSchedule) {
       alert(limitCheck.message);
       return;
     }
   }
   ```

3. **Botão de submit desabilitado:**
   - Quando paciente atingiu o limite
   - Durante loading

## 🎨 Interface do Usuário

### Alerta Visual para Pacientes

**Quando pode agendar (azul):**
```
ℹ️ Limite de Agendamentos
Você pode agendar até 2 consultas.
Consultas ativas: 0/2
```

**Quando atingiu o limite (vermelho):**
```
⚠️ Limite Atingido
Você já possui 2 consultas agendadas. Aguarde uma delas ser 
realizada ou cancele uma para agendar outra.
Consultas ativas: 2/2
```

**Durante verificação (cinza):**
```
⏳ Verificando limite de agendamentos...
```

### Comportamento do Formulário

- ✅ Alerta aparece automaticamente ao abrir a página
- ✅ Botão "Confirmar Agendamento" fica desabilitado se limite atingido
- ✅ Validação dupla: na UI e ao submeter
- ✅ Mensagens claras e informativas

## 📝 Mensagens de Erro

### Limite Atingido
```
"Você já possui 2 consultas agendadas. Aguarde uma delas ser 
realizada ou cancele uma para agendar outra."
```

### Pode Agendar (1 ativa)
```
"Você pode agendar mais 1 consulta."
```

### Pode Agendar (0 ativas)
```
"Você pode agendar até 2 consultas."
```

### Erro ao Verificar
```
"Erro ao verificar limite de agendamentos. Tente novamente."
```

## 🔄 Fluxo Completo

```
1. Paciente acessa /book
   ↓
2. Sistema verifica automaticamente limite
   ↓
3a. Se limite OK → Exibe alerta azul + formulário habilitado
3b. Se limite atingido → Exibe alerta vermelho + botão desabilitado
   ↓
4. Paciente preenche formulário
   ↓
5. Ao submeter → Validação dupla do limite
   ↓
6a. Se OK → Cria agendamento
6b. Se limite atingido → Exibe erro e cancela
   ↓
7. Firestore valida permissões (security rules)
   ↓
8. Sucesso → Redireciona para /appointments
```

## 🧪 Testes

### Cenários para Testar

1. **Paciente sem agendamentos:**
   - ✅ Deve poder agendar
   - ✅ Alerta azul: "Você pode agendar até 2 consultas"
   - ✅ Contador: 0/2

2. **Paciente com 1 agendamento ativo:**
   - ✅ Deve poder agendar
   - ✅ Alerta azul: "Você pode agendar mais 1 consulta"
   - ✅ Contador: 1/2

3. **Paciente com 2 agendamentos ativos:**
   - ❌ Não deve poder agendar
   - ✅ Alerta vermelho: "Limite Atingido"
   - ✅ Botão desabilitado
   - ✅ Contador: 2/2

4. **Paciente com 2 agendamentos, 1 no passado:**
   - ✅ Deve poder agendar (conta apenas 1 ativo)
   - ✅ Contador: 1/2

5. **Paciente com 2 agendamentos, 1 cancelado:**
   - ✅ Deve poder agendar (conta apenas 1 ativo)
   - ✅ Contador: 1/2

6. **Admin/Secretary:**
   - ✅ Não vê alerta de limite
   - ✅ Pode agendar sem restrições

## 🔐 Segurança

### Proteções Implementadas

1. **Firestore Rules:**
   - Paciente só pode criar agendamentos para si mesmo
   - Paciente não pode modificar `patientId` em updates
   - Validação de clinicId e data futura

2. **Validação Client-Side:**
   - Verificação de limite antes de criar
   - UI desabilitada quando limite atingido
   - Mensagens claras de erro

3. **Queries Seguras:**
   - Filtros por `patientId`, `date` e `status`
   - Apenas agendamentos futuros são contados
   - Status específicos são considerados

## 📈 Métricas Sugeridas

Para monitorar o sistema:

- **Taxa de limite atingido:** % de pacientes que atingem 2 agendamentos
- **Tempo médio entre agendamentos:** Quanto tempo pacientes esperam para agendar novamente
- **Taxa de cancelamento:** % de agendamentos cancelados por pacientes
- **Utilização do limite:** Distribuição de 0, 1 ou 2 agendamentos ativos

## 🚀 Deploy

### Passos para Produção

1. **Deploy das Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Verificar índices:**
   - Firestore criará índices automaticamente quando necessário
   - Índice necessário: `appointments` por `patientId`, `date`, `status`

3. **Testar em staging:**
   - Criar paciente de teste
   - Agendar 2 consultas
   - Tentar agendar 3ª (deve falhar)
   - Cancelar uma e tentar novamente (deve funcionar)

## 🐛 Troubleshooting

### Paciente não consegue agendar mesmo sem consultas

**Possíveis causas:**
- `user.patientId` não está definido
- Consultas antigas não foram marcadas como realizadas
- Status incorreto nos agendamentos

**Solução:**
```typescript
// Verificar no console
console.log('PatientId:', user.patientId);
const active = await getActiveAppointments(user.patientId);
console.log('Active appointments:', active);
```

### Contador mostra número errado

**Possíveis causas:**
- Agendamentos com status incorreto
- Datas não atualizadas corretamente
- Cache do Firestore

**Solução:**
- Verificar status dos agendamentos no Firestore Console
- Limpar cache do navegador
- Recarregar a página

### Admin vê alerta de limite

**Causa:**
- Lógica de verificação não está checando role corretamente

**Solução:**
- Verificar condição: `user.role === 'patient'`

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Status:** ✅ Implementado e Testado
