# User Flows - Medical Appointment Scheduling System

## Overview
This document defines all user flows for each role in the medical appointment scheduling system, including MVP features and future enhancements.

---

## Role-Based Access Summary

| Feature | Admin | Secretary | Doctor | Patient |
|---------|-------|-----------|--------|---------|
| View Calendar | ✅ All | ✅ All | ✅ Own | ❌ |
| Create Appointment | ✅ | ✅ | ❌ | ✅ Own |
| Edit Appointment | ✅ | ✅ | ⚠️ Limited | ⚠️ Confirm/Cancel |
| Cancel Appointment | ✅ | ✅ | ❌ | ✅ Own |
| Manage Doctors | ✅ | ❌ | ⚠️ Own Profile | ❌ |
| Manage Patients | ✅ | ✅ | ❌ | ⚠️ Own Profile |
| Manage Convênios | ✅ | ❌ | ❌ | ❌ |
| Extend Agenda | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ❌ | ⚠️ Own Stats | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |

---

## 1. Admin User Flows

### 1.1 Initial Setup Flow

**Goal:** Configure clinic for first use

**Steps:**
1. Admin logs in for the first time
2. System prompts for clinic setup
3. Admin fills clinic information:
   - Name, CNPJ, contact info
   - Address
   - Working hours
   - Default appointment duration
   - Booking window settings
4. Admin adds first doctor:
   - Name, CRM, specialties
   - Availability schedule
   - Accepted payment types
   - Convênios accepted
5. Admin adds convênios:
   - Name and code
   - Activate/deactivate
6. Admin invites secretary (optional)
7. System confirms setup complete
8. Admin redirected to dashboard

**Real-time Behavior:**
- None (initial setup)

**MVP:** ✅ Essential

---

### 1.2 Manage Doctors Flow

**Goal:** Add, edit, or deactivate doctors

**Steps:**
1. Admin navigates to "Médicos" section
2. Views list of all doctors (active and inactive)
3. Clicks "Adicionar Médico"
4. Fills doctor form:
   - Personal info (name, CRM, contact)
   - Specialties (multi-select)
   - Availability schedule (weekly)
   - Appointment duration and buffer time
   - Accepted payment types
   - Convênios accepted (multi-select)
   - Calendar color
5. Saves doctor
6. System creates user account for doctor
7. System sends invitation email
8. Doctor appears in list instantly

**Real-time Behavior:**
- New doctor appears in all users' doctor lists instantly
- Calendar filters update instantly

**MVP:** ✅ Essential

---

### 1.3 Manage Convênios Flow

**Goal:** Add or deactivate health insurance plans

**Steps:**
1. Admin navigates to "Convênios" section
2. Views list of all convênios
3. Clicks "Adicionar Convênio"
4. Fills form:
   - Name (e.g., "Unimed")
   - Internal code (optional)
5. Saves convênio
6. Convênio appears in list instantly
7. To deactivate:
   - Admin toggles "Ativo" switch
   - System confirms deactivation
   - Convênio hidden from booking flows
   - Historical appointments preserved

**Real-time Behavior:**
- New/deactivated convênios update instantly for all users
- Booking forms update instantly

**MVP:** ✅ Essential

---

### 1.4 View Reports Flow

**Goal:** Analyze clinic performance

**Steps:**
1. Admin navigates to "Relatórios" section
2. Selects report type:
   - Monthly summary
   - No-show analysis
   - Doctor performance
   - Convênio breakdown
3. Selects date range
4. System generates report
5. Admin views metrics:
   - Total appointments
   - By status (agendado, confirmado, atendido, falta, cancelado)
   - By type (particular, convênio)
   - By doctor
   - By convênio
   - No-show rate
6. Admin can export to PDF/Excel

**Real-time Behavior:**
- Report data updates as appointments change

**MVP:** ⚠️ Basic version (monthly summary only)
**Future:** Advanced analytics, trends, predictions

---

### 1.5 View Audit Logs Flow

**Goal:** Track all system changes

**Steps:**
1. Admin navigates to "Auditoria" section
2. Views chronological log of all actions
3. Filters by:
   - User
   - Action type
   - Entity type
   - Date range
4. Views details of each action:
   - Who made the change
   - When
   - What changed (before/after)
   - IP address and user agent
5. Can export logs

**Real-time Behavior:**
- New audit entries appear instantly

**MVP:** ✅ Essential (compliance requirement)

---

## 2. Secretary User Flows

### 2.1 Daily Workflow

**Goal:** Manage appointments for the day

**Steps:**
1. Secretary logs in
2. Lands on daily calendar view
3. Sees all appointments for today:
   - Color-coded by doctor
   - Shows patient name, time, type
   - Status indicators
4. Monitors real-time updates:
   - New appointments appear instantly
   - Confirmations update instantly
   - Cancellations update instantly
5. Handles walk-ins and phone calls
6. Creates appointments as needed

**Real-time Behavior:**
- Calendar updates instantly as changes occur
- Multiple secretaries see identical data

**MVP:** ✅ Essential

---

### 2.2 Create Appointment Flow

**Goal:** Schedule appointment for patient

**Steps:**
1. Secretary clicks "Nova Consulta"
2. Searches for existing patient or creates new:
   - If new: fills patient form (name, phone, consent)
   - If existing: selects from list
3. Selects doctor from dropdown
4. Selects date (within booking window)
5. System shows available time slots in real-time:
   - Green = available
   - Red = occupied
   - Slots update as other users book
6. Selects time slot
7. Selects appointment type:
   - Particular
   - Convênio (shows active convênios only)
8. If convênio: fills convênio data
9. Adds notes (optional)
10. Clicks "Agendar"
11. System validates:
    - No conflicts
    - Within booking window
    - Doctor accepts this type
12. Appointment created
13. Confirmation notification sent to patient
14. Appointment appears on calendar instantly

**Real-time Behavior:**
- Available slots update as other users book
- New appointment appears instantly for all users
- If conflict occurs, user sees error immediately

**MVP:** ✅ Essential

---

### 2.3 Extend Agenda Flow

**Goal:** Open booking window for future months

**Steps:**
1. Secretary notices patient wants appointment beyond current window
2. Clicks "Estender Agenda" button
3. Modal opens with options:
   - Extend to: 2, 3, 4, 5, or 6 months
   - Expiration: 30, 60, 90 days, or permanent
   - Reason (optional text field)
4. Secretary selects "3 meses" and "60 dias"
5. Clicks "Confirmar"
6. System validates permission
7. System updates booking window
8. System creates audit log
9. Success message shown
10. Booking window updates instantly for all users
11. Secretary can now book appointments up to 3 months ahead

**Real-time Behavior:**
- Booking window change propagates instantly
- All users can immediately book in extended window
- Calendar date pickers update instantly

**MVP:** ✅ Essential (core requirement)

---

### 2.4 Handle Cancellation Flow

**Goal:** Cancel appointment and notify patient

**Steps:**
1. Secretary receives cancellation request
2. Finds appointment on calendar
3. Clicks appointment card
4. Clicks "Cancelar Consulta"
5. Modal asks for reason
6. Secretary enters reason
7. Clicks "Confirmar Cancelamento"
8. System updates appointment status
9. System creates audit log
10. Cancellation notification sent to patient
11. Appointment marked as "Cancelado" instantly on all calendars
12. Time slot becomes available instantly

**Real-time Behavior:**
- Cancellation updates instantly for all users
- Time slot becomes available instantly
- Doctor sees cancellation instantly

**MVP:** ✅ Essential

---

### 2.5 Manage Patient Data Flow

**Goal:** Update patient information

**Steps:**
1. Secretary navigates to "Pacientes" section
2. Searches for patient
3. Clicks patient name
4. Views patient profile:
   - Personal info
   - Convênio data
   - Appointment history
   - Notes
5. Clicks "Editar"
6. Updates information
7. Saves changes
8. System validates LGPD compliance
9. Changes saved
10. Audit log created

**Real-time Behavior:**
- Patient data updates instantly in all views

**MVP:** ✅ Essential

---

## 3. Doctor User Flows

### 3.1 View Schedule Flow

**Goal:** See own appointments

**Steps:**
1. Doctor logs in
2. Lands on personal schedule view
3. Sees only own appointments:
   - Daily, weekly, or monthly view
   - Patient names
   - Appointment types
   - Status
4. Can switch between views
5. Can navigate dates

**Real-time Behavior:**
- New appointments appear instantly
- Cancellations update instantly
- Status changes update instantly

**MVP:** ✅ Essential

---

### 3.2 Mark Appointment as Attended Flow

**Goal:** Update appointment status after consultation

**Steps:**
1. Doctor views today's schedule
2. After seeing patient, clicks appointment
3. Clicks "Marcar como Atendido"
4. System updates status to "atendido"
5. Status updates instantly on all calendars

**Real-time Behavior:**
- Status change propagates instantly

**MVP:** ✅ Essential

---

### 3.3 Manage Availability Flow

**Goal:** Update weekly schedule

**Steps:**
1. Doctor navigates to "Minha Disponibilidade"
2. Views weekly schedule grid
3. Can add/remove time slots
4. Can set breaks
5. Can block specific dates
6. Saves changes
7. System validates no conflicts with existing appointments
8. Availability updates instantly
9. Booking system reflects new availability

**Real-time Behavior:**
- Availability changes update booking system instantly

**MVP:** ⚠️ Basic version (admin sets availability)
**Future:** Doctor self-service

---

## 4. Patient User Flows

### 4.1 Self-Registration Flow

**Goal:** Create account and book first appointment

**Steps:**
1. Patient receives clinic link or QR code
2. Opens booking page
3. Clicks "Criar Conta"
4. Fills registration form:
   - Name
   - Phone (WhatsApp)
   - Email (optional)
   - Password
5. Accepts terms:
   - Data storage consent
   - WhatsApp notifications consent
6. Clicks "Cadastrar"
7. System creates patient account
8. Patient redirected to booking page

**Real-time Behavior:**
- None (initial registration)

**MVP:** ✅ Essential

---

### 4.2 Book Appointment Flow

**Goal:** Schedule appointment online

**Steps:**
1. Patient logs in
2. Clicks "Agendar Consulta"
3. Selects doctor from list (with photos and specialties)
4. Selects date (within booking window)
5. System shows available slots in real-time:
   - Only available slots shown
   - Slots update as others book
6. Selects time slot
7. Selects appointment type:
   - Particular
   - Convênio (if patient has convênio registered)
8. If convênio: selects from saved convênios
9. Adds notes (optional)
10. Reviews booking details
11. Clicks "Confirmar Agendamento"
12. System validates:
    - No conflicts
    - Within booking window
13. Appointment created
14. Confirmation sent via WhatsApp
15. Patient sees appointment in "Minhas Consultas"

**Real-time Behavior:**
- Available slots update as other patients book
- If slot becomes unavailable, patient sees error
- Appointment appears instantly in patient's list

**MVP:** ✅ Essential

---

### 4.3 Book for Family Member Flow

**Goal:** Schedule appointment for dependent

**Steps:**
1. Patient logs in
2. Clicks "Agendar Consulta"
3. Toggles "Agendar para outra pessoa"
4. Searches for family member or adds new:
   - Name
   - Phone
   - Relationship
5. Continues with normal booking flow
6. Appointment created with:
   - `bookedBy`: patient's ID
   - `bookedFor`: family member's ID
7. Both patient and family member receive notifications

**Real-time Behavior:**
- Same as normal booking

**MVP:** ✅ Essential (requirement)

---

### 4.4 Confirm Appointment via WhatsApp Flow

**Goal:** Confirm attendance via WhatsApp

**Steps:**
1. Patient receives 24h reminder via WhatsApp:
   - "Você tem consulta amanhã às 09:00 com Dr. João. Responda SIM para confirmar ou NÃO para cancelar."
2. Patient replies "SIM"
3. WhatsApp bot processes response
4. System updates appointment status to "confirmado"
5. Patient receives confirmation:
   - "Consulta confirmada! Até amanhã às 09:00."
6. Status updates instantly on all calendars

**Real-time Behavior:**
- Confirmation updates instantly for all users
- Secretary sees confirmation instantly

**MVP:** ⚠️ Basic version (manual confirmation in app)
**Future:** WhatsApp bot integration

---

### 4.5 Cancel Appointment Flow

**Goal:** Cancel appointment online

**Steps:**
1. Patient logs in
2. Navigates to "Minhas Consultas"
3. Sees list of upcoming appointments
4. Clicks appointment to cancel
5. Clicks "Cancelar Consulta"
6. Modal asks for confirmation
7. Patient confirms
8. System updates status
9. Cancellation notification sent
10. Appointment marked as "Cancelado" instantly
11. Time slot becomes available instantly

**Real-time Behavior:**
- Cancellation propagates instantly
- Slot becomes available instantly for other patients

**MVP:** ✅ Essential

---

### 4.6 View Appointment History Flow

**Goal:** See past appointments

**Steps:**
1. Patient logs in
2. Navigates to "Histórico"
3. Sees list of past appointments:
   - Date, time
   - Doctor name
   - Status (atendido, falta, cancelado)
4. Can filter by date range
5. Can view details

**Real-time Behavior:**
- None (historical data)

**MVP:** ⚠️ Nice to have
**Future:** Full history with notes

---

## 5. Real-time Collaboration Scenarios

### 5.1 Concurrent Booking Scenario

**Situation:** Two secretaries try to book the same time slot

**Flow:**
1. Secretary A opens booking form at 10:00
2. Secretary B opens booking form at 10:00
3. Both see slot "09:00 tomorrow" as available (green)
4. Secretary A selects "09:00 tomorrow" at 10:01
5. Secretary A fills patient info
6. **Secretary B's view updates instantly** - slot turns red
7. Secretary A clicks "Agendar" at 10:02
8. Appointment created successfully
9. Secretary B tries to select same slot
10. **System shows error:** "Este horário foi reservado por outro usuário"
11. Secretary B selects different slot

**Real-time Behavior:**
- Slot availability updates instantly
- Prevents double-booking
- Clear error messages

**MVP:** ✅ Essential (core requirement)

---

### 5.2 Multi-User Calendar Scenario

**Situation:** Admin, secretary, and doctor viewing same calendar

**Flow:**
1. All three users open calendar for "January 15, 2025"
2. All see identical appointments
3. Secretary creates new appointment at 14:00
4. **Admin's calendar updates instantly** - new appointment appears
5. **Doctor's calendar updates instantly** - new appointment appears
6. Patient cancels appointment at 10:00
7. **All three users see cancellation instantly**
8. Secretary reschedules appointment from 14:00 to 15:00
9. **All three users see move instantly**

**Real-time Behavior:**
- All users always see identical data
- No refresh needed
- No polling
- Pure real-time via Firestore listeners

**MVP:** ✅ Essential (core requirement)

---

### 5.3 Agenda Extension Scenario

**Situation:** Secretary extends booking window while patient is booking

**Flow:**
1. Patient opens booking page
2. Patient sees calendar limited to current + next month (2 months)
3. Patient wants appointment in 3 months - dates are disabled
4. **Meanwhile:** Secretary extends agenda to 3 months
5. **Patient's calendar updates instantly** - 3rd month becomes enabled
6. Patient selects date in 3rd month
7. Patient completes booking successfully

**Real-time Behavior:**
- Booking window changes propagate instantly
- No page refresh needed
- Seamless user experience

**MVP:** ✅ Essential (core requirement)

---

## 6. Error Handling Flows

### 6.1 Network Disconnection Flow

**Situation:** User loses internet connection

**Flow:**
1. User is viewing calendar
2. Internet connection drops
3. System detects offline status
4. **Banner appears:** "Você está offline. Reconectando..."
5. Calendar shows last known state
6. User cannot make changes
7. Internet reconnects
8. System resyncs automatically
9. **Banner updates:** "Conectado"
10. Calendar updates with any missed changes
11. User can make changes again

**Real-time Behavior:**
- Graceful offline handling
- Automatic reconnection
- Data sync on reconnect

**MVP:** ✅ Essential

---

### 6.2 Conflict Detection Flow

**Situation:** User tries to book conflicting appointment

**Flow:**
1. User selects time slot
2. User fills form slowly
3. **Meanwhile:** Another user books same slot
4. First user clicks "Agendar"
5. **System detects conflict**
6. **Error message:** "Este horário não está mais disponível. Por favor, selecione outro horário."
7. Available slots refresh
8. User selects different slot
9. Booking succeeds

**Real-time Behavior:**
- Server-side conflict detection
- Clear error messages
- Automatic slot refresh

**MVP:** ✅ Essential

---

## 7. MVP vs Future Features

### MVP Features (Must Have)

**Authentication & Users:**
- ✅ Email/password login
- ✅ Role-based access (admin, secretary, doctor, patient)
- ✅ User management

**Appointments:**
- ✅ Create, edit, cancel, reschedule
- ✅ Real-time calendar (daily, weekly views)
- ✅ Status management
- ✅ Particular and convênio types
- ✅ Conflict detection

**Doctors:**
- ✅ Doctor profiles
- ✅ Availability schedules
- ✅ Convênio acceptance

**Patients:**
- ✅ Patient registration
- ✅ LGPD consent
- ✅ Book for self and family

**Convênios:**
- ✅ Convênio management
- ✅ Active/inactive status

**Agenda Rules:**
- ✅ Booking window (default + extended)
- ✅ Secretary can extend agenda
- ✅ Real-time propagation

**Notifications:**
- ✅ WhatsApp confirmation (basic)
- ✅ Email fallback

**Audit:**
- ✅ Full audit logs
- ✅ LGPD compliance

**Real-time:**
- ✅ All calendar views
- ✅ Appointment changes
- ✅ Agenda extensions
- ✅ Convênio changes

---

### Future Features (Phase 2+)

**Advanced Notifications:**
- 📅 WhatsApp bot with two-way communication
- 📅 SMS reminders
- 📅 Customizable reminder times
- 📅 Automated no-show follow-up

**Advanced Scheduling:**
- 📅 Recurring appointments
- 📅 Waitlist management
- 📅 Appointment templates
- 📅 Bulk scheduling

**Doctor Features:**
- 📅 Doctor self-service availability
- 📅 Block dates for vacation
- 📅 Personal dashboard with stats

**Patient Features:**
- 📅 Patient portal with full history
- 📅 Document upload
- 📅 Telemedicine integration
- 📅 Rating system

**Analytics:**
- 📅 Advanced reports
- 📅 Trend analysis
- 📅 Predictive analytics
- 📅 Revenue forecasting

**Integrations:**
- 📅 Google Calendar sync
- 📅 Payment gateway
- 📅 Electronic medical records
- 📅 Insurance verification API

**Mobile:**
- 📅 Native iOS app
- 📅 Native Android app
- 📅 Push notifications

**Multi-clinic:**
- 📅 Franchise management
- 📅 Multi-location support
- 📅 Centralized reporting

---

## 8. Acceptance Criteria

### Real-time Test

**Test Case:** Two users viewing same calendar

**Steps:**
1. Open two browser windows
2. Log in as Secretary in Window 1
3. Log in as Admin in Window 2
4. Both navigate to calendar for same date
5. Secretary creates appointment in Window 1
6. **Expected:** Appointment appears in Window 2 **instantly without refresh**
7. Admin cancels appointment in Window 2
8. **Expected:** Cancellation appears in Window 1 **instantly without refresh**

**Result:** ✅ PASS = Real-time working correctly

---

### Conflict Prevention Test

**Test Case:** Concurrent booking attempt

**Steps:**
1. Open two browser windows
2. Log in as Secretary A in Window 1
3. Log in as Secretary B in Window 2
4. Both open booking form for same doctor and date
5. Both see same available slot
6. Secretary A books slot first
7. **Expected:** Slot disappears from Secretary B's view **instantly**
8. Secretary B tries to book same slot
9. **Expected:** Error message shown

**Result:** ✅ PASS = Conflict prevention working correctly

---

### Agenda Extension Test

**Test Case:** Real-time booking window update

**Steps:**
1. Open two browser windows
2. Log in as Secretary in Window 1
3. Log in as Patient in Window 2
4. Patient sees booking limited to 2 months
5. Secretary extends agenda to 3 months in Window 1
6. **Expected:** Patient's calendar in Window 2 updates **instantly**
7. Patient can now book in 3rd month

**Result:** ✅ PASS = Agenda extension working correctly

---

## Summary

This medical appointment scheduling system is designed with **real-time collaboration** as its core principle. Every user action propagates instantly to all connected clients, ensuring that:

1. **No double-bookings** occur
2. **All users see identical data** at all times
3. **No manual refreshes** are ever needed
4. **Changes propagate instantly** across all devices
5. **Conflicts are prevented** server-side

The MVP focuses on essential features that enable clinics to manage appointments efficiently while maintaining strict real-time behavior and LGPD compliance.
