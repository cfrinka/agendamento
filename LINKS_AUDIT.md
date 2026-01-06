# Auditoria de Links do Sistema

## ✅ Páginas Existentes
- `/` - Dashboard principal
- `/login` - Login
- `/register` - Registro
- `/calendar` - Calendário
- `/doctors` - Lista de médicos
- `/doctors/new` - Novo médico
- `/patients` - Lista de pacientes
- `/patients/new` - Novo paciente
- `/convenios` - Lista de convênios
- `/convenios/new` - Novo convênio
- `/appointments` - Lista de consultas
- `/book` - Agendar consulta
- `/reports` - Relatórios
- `/dashboard/calendar` - Calendário (dashboard antigo)
- `/dashboard/page` - Dashboard antigo

## ❌ Páginas Referenciadas mas NÃO Existem

### 1. `/settings` - Configurações
**Referenciado em:**
- `app/page.tsx` linha 156 (Admin Dashboard)

### 2. `/agenda-settings` - Estender Agenda
**Referenciado em:**
- `app/page.tsx` linha 195 (Secretary Dashboard)

### 3. `/availability` - Disponibilidade do Médico
**Referenciado em:**
- `app/page.tsx` linha 227 (Doctor Dashboard)

### 4. `/dashboard/doctors` - Médicos (dashboard antigo)
**Referenciado em:**
- `app/dashboard/page.tsx` linha 106

### 5. `/dashboard/patients` - Pacientes (dashboard antigo)
**Referenciado em:**
- `app/dashboard/page.tsx` linhas 113, 166

### 6. `/dashboard/convenios` - Convênios (dashboard antigo)
**Referenciado em:**
- `app/dashboard/page.tsx` linha 120

### 7. `/dashboard/reports` - Relatórios (dashboard antigo)
**Referenciado em:**
- `app/dashboard/page.tsx` linha 127

### 8. `/dashboard/settings` - Configurações (dashboard antigo)
**Referenciado em:**
- `app/dashboard/page.tsx` linha 134

### 9. Páginas de Detalhes (não existem)
- `/doctors/[id]` - Detalhes do médico
- `/patients/[id]` - Detalhes do paciente
- `/convenios/[id]` - Detalhes do convênio

## 🔧 Ações Necessárias

### Opção 1: Corrigir Links no Dashboard Principal
Atualizar `app/page.tsx` para remover ou criar as páginas faltantes:
- `/settings` → Criar ou remover do dashboard
- `/agenda-settings` → Criar ou remover do dashboard
- `/availability` → Criar ou remover do dashboard

### Opção 2: Remover Dashboard Antigo
O `app/dashboard/page.tsx` parece ser uma versão antiga. Considerar:
- Deletar a pasta `/dashboard` completa
- Ou atualizar todos os links para apontar para as páginas corretas

## ✅ Recomendação Imediata

Atualizar todos os links no dashboard principal (`app/page.tsx`) para apontar apenas para páginas que existem ou criar páginas placeholder para as funcionalidades futuras.
