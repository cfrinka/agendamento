# Real-time Queries & Listeners - Medical Appointment Scheduling System

## Overview
This document provides production-ready real-time query implementations using Firestore snapshot listeners. All queries are optimized for performance and ensure instant updates across all connected clients.

---

## Core Principles

1. **Always use `onSnapshot`** - Never use `get()` for data that can change
2. **Unsubscribe properly** - Prevent memory leaks
3. **Handle errors gracefully** - Network issues, permission errors
4. **Optimize query scope** - Limit date ranges, use indexes
5. **Cache strategically** - Balance freshness vs performance

---

## 1. Calendar View Queries

### 1.1 Daily Calendar View (All Roles)

**Use Case:** Display all appointments for a specific date

```typescript
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CalendarAppointment {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  date: Date;
  endDate: Date;
  duration: number;
  type: 'particular' | 'convenio';
  status: string;
  color: string;
}

export function subscribeToDailyCalendar(
  clinicId: string,
  date: Date,
  doctorId: string | null,
  onUpdate: (appointments: CalendarAppointment[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  // Calculate date range (start and end of day)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Build query
  let q = query(
    collection(db, 'appointments'),
    where('clinicId', '==', clinicId),
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('date', 'asc')
  );

  // Filter by doctor if specified
  if (doctorId) {
    q = query(
      collection(db, 'appointments'),
      where('clinicId', '==', clinicId),
      where('doctorId', '==', doctorId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('date', 'asc')
    );
  }

  // Subscribe to real-time updates
  return onSnapshot(
    q,
    async (snapshot) => {
      const appointments: CalendarAppointment[] = [];
      
      // Collect all doctor IDs and patient IDs for batch fetching
      const doctorIds = new Set<string>();
      const patientIds = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        doctorIds.add(data.doctorId);
        patientIds.add(data.patientId);
      });

      // Fetch doctors and patients (could be cached)
      const [doctors, patients] = await Promise.all([
        fetchDoctorsBatch(Array.from(doctorIds)),
        fetchPatientsBatch(Array.from(patientIds))
      ]);

      // Build appointment objects
      snapshot.forEach((doc) => {
        const data = doc.data();
        const doctor = doctors.get(data.doctorId);
        const patient = patients.get(data.patientId);

        appointments.push({
          id: doc.id,
          doctorId: data.doctorId,
          doctorName: doctor?.name || 'Unknown',
          patientId: data.patientId,
          patientName: patient?.name || 'Unknown',
          date: data.date.toDate(),
          endDate: data.endDate.toDate(),
          duration: data.duration,
          type: data.type,
          status: data.status,
          color: doctor?.color || '#3B82F6',
        });
      });

      onUpdate(appointments);
    },
    (error) => {
      console.error('Error in daily calendar subscription:', error);
      onError(error);
    }
  );
}

// Helper functions for batch fetching
async function fetchDoctorsBatch(doctorIds: string[]): Promise<Map<string, any>> {
  const doctors = new Map();
  
  if (doctorIds.length === 0) return doctors;

  // Fetch in batches of 10 (Firestore 'in' query limit)
  const batches = [];
  for (let i = 0; i < doctorIds.length; i += 10) {
    const batch = doctorIds.slice(i, i + 10);
    const q = query(
      collection(db, 'doctors'),
      where('__name__', 'in', batch)
    );
    batches.push(getDocs(q));
  }

  const results = await Promise.all(batches);
  results.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      doctors.set(doc.id, doc.data());
    });
  });

  return doctors;
}

async function fetchPatientsBatch(patientIds: string[]): Promise<Map<string, any>> {
  const patients = new Map();
  
  if (patientIds.length === 0) return patients;

  const batches = [];
  for (let i = 0; i < patientIds.length; i += 10) {
    const batch = patientIds.slice(i, i + 10);
    const q = query(
      collection(db, 'patients'),
      where('__name__', 'in', batch)
    );
    batches.push(getDocs(q));
  }

  const results = await Promise.all(batches);
  results.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      patients.set(doc.id, doc.data());
    });
  });

  return patients;
}
```

---

### 1.2 Weekly Calendar View

**Use Case:** Display appointments for a week

```typescript
export function subscribeToWeeklyCalendar(
  clinicId: string,
  startDate: Date,
  doctorId: string | null,
  onUpdate: (appointments: CalendarAppointment[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  // Calculate week range
  const weekStart = new Date(startDate);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(startDate);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  let q = query(
    collection(db, 'appointments'),
    where('clinicId', '==', clinicId),
    where('date', '>=', Timestamp.fromDate(weekStart)),
    where('date', '<=', Timestamp.fromDate(weekEnd)),
    orderBy('date', 'asc')
  );

  if (doctorId) {
    q = query(
      collection(db, 'appointments'),
      where('clinicId', '==', clinicId),
      where('doctorId', '==', doctorId),
      where('date', '>=', Timestamp.fromDate(weekStart)),
      where('date', '<=', Timestamp.fromDate(weekEnd)),
      orderBy('date', 'asc')
    );
  }

  return onSnapshot(
    q,
    async (snapshot) => {
      const appointments: CalendarAppointment[] = [];
      
      const doctorIds = new Set<string>();
      const patientIds = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        doctorIds.add(data.doctorId);
        patientIds.add(data.patientId);
      });

      const [doctors, patients] = await Promise.all([
        fetchDoctorsBatch(Array.from(doctorIds)),
        fetchPatientsBatch(Array.from(patientIds))
      ]);

      snapshot.forEach((doc) => {
        const data = doc.data();
        const doctor = doctors.get(data.doctorId);
        const patient = patients.get(data.patientId);

        appointments.push({
          id: doc.id,
          doctorId: data.doctorId,
          doctorName: doctor?.name || 'Unknown',
          patientId: data.patientId,
          patientName: patient?.name || 'Unknown',
          date: data.date.toDate(),
          endDate: data.endDate.toDate(),
          duration: data.duration,
          type: data.type,
          status: data.status,
          color: doctor?.color || '#3B82F6',
        });
      });

      onUpdate(appointments);
    },
    (error) => {
      console.error('Error in weekly calendar subscription:', error);
      onError(error);
    }
  );
}
```

---

### 1.3 Monthly Calendar View

**Use Case:** Display appointments for a month (summary view)

```typescript
export function subscribeToMonthlyCalendar(
  clinicId: string,
  month: number,
  year: number,
  doctorId: string | null,
  onUpdate: (appointments: CalendarAppointment[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  // Calculate month range
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  let q = query(
    collection(db, 'appointments'),
    where('clinicId', '==', clinicId),
    where('date', '>=', Timestamp.fromDate(monthStart)),
    where('date', '<=', Timestamp.fromDate(monthEnd)),
    orderBy('date', 'asc')
  );

  if (doctorId) {
    q = query(
      collection(db, 'appointments'),
      where('clinicId', '==', clinicId),
      where('doctorId', '==', doctorId),
      where('date', '>=', Timestamp.fromDate(monthStart)),
      where('date', '<=', Timestamp.fromDate(monthEnd)),
      orderBy('date', 'asc')
    );
  }

  return onSnapshot(
    q,
    async (snapshot) => {
      const appointments: CalendarAppointment[] = [];
      
      const doctorIds = new Set<string>();
      const patientIds = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        doctorIds.add(data.doctorId);
        patientIds.add(data.patientId);
      });

      const [doctors, patients] = await Promise.all([
        fetchDoctorsBatch(Array.from(doctorIds)),
        fetchPatientsBatch(Array.from(patientIds))
      ]);

      snapshot.forEach((doc) => {
        const data = doc.data();
        const doctor = doctors.get(data.doctorId);
        const patient = patients.get(data.patientId);

        appointments.push({
          id: doc.id,
          doctorId: data.doctorId,
          doctorName: doctor?.name || 'Unknown',
          patientId: data.patientId,
          patientName: patient?.name || 'Unknown',
          date: data.date.toDate(),
          endDate: data.endDate.toDate(),
          duration: data.duration,
          type: data.type,
          status: data.status,
          color: doctor?.color || '#3B82F6',
        });
      });

      onUpdate(appointments);
    },
    (error) => {
      console.error('Error in monthly calendar subscription:', error);
      onError(error);
    }
  );
}
```

---

## 2. Patient Appointment Queries

### 2.1 Patient's Own Appointments

**Use Case:** Patient viewing their upcoming appointments

```typescript
export function subscribeToPatientAppointments(
  patientId: string,
  onUpdate: (appointments: CalendarAppointment[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const now = new Date();

  const q = query(
    collection(db, 'appointments'),
    where('patientId', '==', patientId),
    where('date', '>=', Timestamp.fromDate(now)),
    where('status', 'in', ['agendado', 'confirmado']),
    orderBy('date', 'asc')
  );

  return onSnapshot(
    q,
    async (snapshot) => {
      const appointments: CalendarAppointment[] = [];
      
      const doctorIds = new Set<string>();
      snapshot.forEach((doc) => {
        doctorIds.add(doc.data().doctorId);
      });

      const doctors = await fetchDoctorsBatch(Array.from(doctorIds));

      snapshot.forEach((doc) => {
        const data = doc.data();
        const doctor = doctors.get(data.doctorId);

        appointments.push({
          id: doc.id,
          doctorId: data.doctorId,
          doctorName: doctor?.name || 'Unknown',
          patientId: data.patientId,
          patientName: '', // Not needed for patient's own view
          date: data.date.toDate(),
          endDate: data.endDate.toDate(),
          duration: data.duration,
          type: data.type,
          status: data.status,
          color: doctor?.color || '#3B82F6',
        });
      });

      onUpdate(appointments);
    },
    (error) => {
      console.error('Error in patient appointments subscription:', error);
      onError(error);
    }
  );
}
```

---

### 2.2 Patient's Appointment History

**Use Case:** View past appointments

```typescript
export function subscribeToPatientHistory(
  patientId: string,
  limit: number = 10,
  onUpdate: (appointments: CalendarAppointment[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const now = new Date();

  const q = query(
    collection(db, 'appointments'),
    where('patientId', '==', patientId),
    where('date', '<', Timestamp.fromDate(now)),
    orderBy('date', 'desc'),
    limit(limit)
  );

  return onSnapshot(
    q,
    async (snapshot) => {
      const appointments: CalendarAppointment[] = [];
      
      const doctorIds = new Set<string>();
      snapshot.forEach((doc) => {
        doctorIds.add(doc.data().doctorId);
      });

      const doctors = await fetchDoctorsBatch(Array.from(doctorIds));

      snapshot.forEach((doc) => {
        const data = doc.data();
        const doctor = doctors.get(data.doctorId);

        appointments.push({
          id: doc.id,
          doctorId: data.doctorId,
          doctorName: doctor?.name || 'Unknown',
          patientId: data.patientId,
          patientName: '',
          date: data.date.toDate(),
          endDate: data.endDate.toDate(),
          duration: data.duration,
          type: data.type,
          status: data.status,
          color: doctor?.color || '#3B82F6',
        });
      });

      onUpdate(appointments);
    },
    (error) => {
      console.error('Error in patient history subscription:', error);
      onError(error);
    }
  );
}
```

---

## 3. Doctor Queries

### 3.1 Doctor's Schedule

**Use Case:** Doctor viewing their own schedule

```typescript
export function subscribeToDoctorSchedule(
  doctorId: string,
  startDate: Date,
  endDate: Date,
  onUpdate: (appointments: CalendarAppointment[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'appointments'),
    where('doctorId', '==', doctorId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'asc')
  );

  return onSnapshot(
    q,
    async (snapshot) => {
      const appointments: CalendarAppointment[] = [];
      
      const patientIds = new Set<string>();
      snapshot.forEach((doc) => {
        patientIds.add(doc.data().patientId);
      });

      const patients = await fetchPatientsBatch(Array.from(patientIds));

      snapshot.forEach((doc) => {
        const data = doc.data();
        const patient = patients.get(data.patientId);

        appointments.push({
          id: doc.id,
          doctorId: data.doctorId,
          doctorName: '',
          patientId: data.patientId,
          patientName: patient?.name || 'Unknown',
          date: data.date.toDate(),
          endDate: data.endDate.toDate(),
          duration: data.duration,
          type: data.type,
          status: data.status,
          color: '#3B82F6',
        });
      });

      onUpdate(appointments);
    },
    (error) => {
      console.error('Error in doctor schedule subscription:', error);
      onError(error);
    }
  );
}
```

---

### 3.2 Active Doctors List

**Use Case:** Display list of doctors for booking

```typescript
export function subscribeToActiveDoctors(
  clinicId: string,
  onUpdate: (doctors: any[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'doctors'),
    where('clinicId', '==', clinicId),
    where('active', '==', true),
    orderBy('name', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const doctors = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onUpdate(doctors);
    },
    (error) => {
      console.error('Error in active doctors subscription:', error);
      onError(error);
    }
  );
}
```

---

## 4. Convênios Queries

### 4.1 Active Convênios

**Use Case:** Display active health insurance plans

```typescript
export function subscribeToActiveConvenios(
  clinicId: string,
  onUpdate: (convenios: any[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'convenios'),
    where('clinicId', '==', clinicId),
    where('active', '==', true),
    orderBy('name', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const convenios = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onUpdate(convenios);
    },
    (error) => {
      console.error('Error in active convenios subscription:', error);
      onError(error);
    }
  );
}
```

---

## 5. Agenda Rules Queries

### 5.1 Current Booking Window

**Use Case:** Check if agenda is extended

```typescript
export function subscribeToBookingWindow(
  clinicId: string,
  onUpdate: (bookingWindow: any) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const clinicRef = doc(db, 'clinics', clinicId);

  return onSnapshot(
    clinicRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate(data.settings.bookingWindow);
      }
    },
    (error) => {
      console.error('Error in booking window subscription:', error);
      onError(error);
    }
  );
}
```

---

### 5.2 Active Agenda Rules

**Use Case:** Display current agenda extensions

```typescript
export function subscribeToActiveAgendaRules(
  clinicId: string,
  onUpdate: (rules: any[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'agendaRules'),
    where('clinicId', '==', clinicId),
    where('active', '==', true),
    orderBy('extendedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rules = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onUpdate(rules);
    },
    (error) => {
      console.error('Error in agenda rules subscription:', error);
      onError(error);
    }
  );
}
```

---

## 6. Real-time Conflict Detection

### 6.1 Check Available Slots

**Use Case:** Real-time slot availability during booking

```typescript
export function subscribeToAvailableSlots(
  doctorId: string,
  date: Date,
  onUpdate: (slots: { start: Date; end: Date; available: boolean }[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'appointments'),
    where('doctorId', '==', doctorId),
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<=', Timestamp.fromDate(endOfDay)),
    where('status', 'in', ['agendado', 'confirmado']),
    orderBy('date', 'asc')
  );

  return onSnapshot(
    q,
    async (snapshot) => {
      // Get doctor's availability for this day
      const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
      if (!doctorDoc.exists()) {
        onError(new Error('Doctor not found'));
        return;
      }

      const doctorData = doctorDoc.data();
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const availability = doctorData.availability[dayOfWeek];

      if (!availability || !availability.enabled) {
        onUpdate([]);
        return;
      }

      // Generate all possible slots
      const slots: { start: Date; end: Date; available: boolean }[] = [];
      const duration = doctorData.appointmentDuration || 30;
      const bufferTime = doctorData.bufferTime || 0;

      availability.slots.forEach((slot: any) => {
        const [startHour, startMinute] = slot.start.split(':').map(Number);
        const [endHour, endMinute] = slot.end.split(':').map(Number);

        let currentTime = new Date(date);
        currentTime.setHours(startHour, startMinute, 0, 0);

        const slotEnd = new Date(date);
        slotEnd.setHours(endHour, endMinute, 0, 0);

        while (currentTime < slotEnd) {
          const slotStart = new Date(currentTime);
          const slotEndTime = new Date(currentTime);
          slotEndTime.setMinutes(slotEndTime.getMinutes() + duration);

          if (slotEndTime <= slotEnd) {
            // Check if slot conflicts with existing appointments
            const hasConflict = snapshot.docs.some((doc) => {
              const appointment = doc.data();
              const appointmentStart = appointment.date.toDate();
              const appointmentEnd = appointment.endDate.toDate();

              return (
                (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
                (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd) ||
                (slotStart <= appointmentStart && slotEndTime >= appointmentEnd)
              );
            });

            slots.push({
              start: slotStart,
              end: slotEndTime,
              available: !hasConflict,
            });
          }

          currentTime.setMinutes(currentTime.getMinutes() + duration + bufferTime);
        }
      });

      onUpdate(slots);
    },
    (error) => {
      console.error('Error in available slots subscription:', error);
      onError(error);
    }
  );
}
```

---

## 7. React Hook Implementation

### 7.1 Custom Hook for Calendar

```typescript
import { useState, useEffect } from 'react';
import { Unsubscribe } from 'firebase/firestore';

export function useCalendarAppointments(
  clinicId: string,
  date: Date,
  doctorId: string | null
) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToDailyCalendar(
      clinicId,
      date,
      doctorId,
      (data) => {
        setAppointments(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [clinicId, date, doctorId]);

  return { appointments, loading, error };
}
```

---

### 7.2 Custom Hook for Patient Appointments

```typescript
export function usePatientAppointments(patientId: string) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPatientAppointments(
      patientId,
      (data) => {
        setAppointments(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [patientId]);

  return { appointments, loading, error };
}
```

---

### 7.3 Custom Hook for Active Doctors

```typescript
export function useActiveDoctors(clinicId: string) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clinicId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToActiveDoctors(
      clinicId,
      (data) => {
        setDoctors(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [clinicId]);

  return { doctors, loading, error };
}
```

---

## 8. Performance Optimization

### 8.1 Query Caching Strategy

```typescript
// Cache doctors and patients to avoid repeated fetches
const doctorCache = new Map<string, { data: any; timestamp: number }>();
const patientCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedDoctor(doctorId: string): Promise<any> {
  const cached = doctorCache.get(doctorId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
  const data = doctorDoc.data();

  doctorCache.set(doctorId, { data, timestamp: now });
  return data;
}

async function getCachedPatient(patientId: string): Promise<any> {
  const cached = patientCache.get(patientId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const patientDoc = await getDoc(doc(db, 'patients', patientId));
  const data = patientDoc.data();

  patientCache.set(patientId, { data, timestamp: now });
  return data;
}
```

---

### 8.2 Debounced Queries

```typescript
import { debounce } from 'lodash';

export function useDebouncedCalendar(
  clinicId: string,
  date: Date,
  doctorId: string | null,
  delay: number = 300
) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const debouncedSubscribe = debounce(() => {
      setLoading(true);
      
      unsubscribe = subscribeToDailyCalendar(
        clinicId,
        date,
        doctorId,
        (data) => {
          setAppointments(data);
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setLoading(false);
        }
      );
    }, delay);

    debouncedSubscribe();

    return () => {
      debouncedSubscribe.cancel();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [clinicId, date, doctorId, delay]);

  return { appointments, loading };
}
```

---

## 9. Error Handling

### 9.1 Retry Logic

```typescript
function subscribeWithRetry(
  queryFn: () => Unsubscribe,
  onUpdate: (data: any) => void,
  onError: (error: Error) => void,
  maxRetries: number = 3
): Unsubscribe {
  let retryCount = 0;
  let unsubscribe: Unsubscribe | null = null;

  const attempt = () => {
    try {
      unsubscribe = queryFn();
    } catch (error: any) {
      if (retryCount < maxRetries) {
        retryCount++;
        console.warn(`Retry attempt ${retryCount}/${maxRetries}`);
        setTimeout(attempt, 1000 * retryCount); // Exponential backoff
      } else {
        onError(error);
      }
    }
  };

  attempt();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
```

---

### 9.2 Network Status Monitoring

```typescript
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

---

## 10. Testing Real-time Queries

### 10.1 Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { subscribeToDailyCalendar } from './queries';

describe('subscribeToDailyCalendar', () => {
  it('should subscribe to appointments for a specific date', () => {
    const clinicId = 'clinic_123';
    const date = new Date('2025-01-15');
    const onUpdate = vi.fn();
    const onError = vi.fn();

    const unsubscribe = subscribeToDailyCalendar(
      clinicId,
      date,
      null,
      onUpdate,
      onError
    );

    expect(typeof unsubscribe).toBe('function');
    
    // Cleanup
    unsubscribe();
  });
});
```

---

## Best Practices Summary

1. **Always unsubscribe** when component unmounts
2. **Limit query scope** to necessary date ranges
3. **Use composite indexes** for complex queries
4. **Cache static data** (doctors, patients, convênios)
5. **Handle offline scenarios** gracefully
6. **Implement retry logic** for network errors
7. **Debounce rapid changes** to prevent excessive queries
8. **Monitor query performance** in production
9. **Use pagination** for large result sets
10. **Test real-time behavior** with multiple clients

---

## Acceptance Test

To verify real-time functionality:

1. Open two browser windows
2. Log in as different users (e.g., secretary and doctor)
3. Both view the same calendar date
4. Secretary creates a new appointment
5. **Doctor's calendar updates instantly without refresh**
6. Secretary cancels the appointment
7. **Doctor's calendar updates instantly without refresh**

✅ **This is the ONLY acceptable behavior for this system.**
