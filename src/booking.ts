import { getAllActiveServices } from './services/servicesService';
import { getAppointments, createAppointment } from './services/appointmentsService';
import { getBlockedDates } from './services/blockedDatesService';
import { getBusinessHours } from './services/businessHoursService';
import { getBookingSettings } from './services/settingsService';
import { getStoredService, persistSelectedService } from './lib/selectedServiceState';
import type {
  Appointment,
  BlockedDate,
  BookingSetting,
  BusinessHour,
  Service,
} from './lib/types';

const SLOT_DEFAULT_INTERVAL = 30;
const serviceGrid = document.getElementById('serviceGrid');
const serviceFeedback = document.getElementById('serviceFeedback');
const serviceTypeSelect = document.getElementById('serviceType') as HTMLSelectElement | null;
const selectedServiceIdInput = document.getElementById('selectedServiceId') as HTMLInputElement | null;
const selectedServiceNameInput = document.getElementById('selectedServiceName') as HTMLInputElement | null;
const bookingDateInput = document.getElementById('bookingDate') as HTMLInputElement | null;
const bookingTimeSelect = document.getElementById('bookingTime') as HTMLSelectElement | null;
const calendarDays = document.getElementById('calendarDays');
const slotGrid = document.getElementById('slotGrid');
const serviceError = document.getElementById('serviceError');
const dateError = document.getElementById('dateError');
const timeError = document.getElementById('timeError');
const nameInput = document.getElementById('clientName') as HTMLInputElement | null;
const emailInput = document.getElementById('clientEmail') as HTMLInputElement | null;
const phoneInput = document.getElementById('clientPhone') as HTMLInputElement | null;
const notesInput = document.getElementById('clientNotes') as HTMLTextAreaElement | null;
const nameError = document.getElementById('nameError');
const emailErrorEl = document.getElementById('emailError');
const phoneErrorEl = document.getElementById('phoneError');
const summaryService = document.getElementById('summaryService');
const summaryDate = document.getElementById('summaryDate');
const summaryTime = document.getElementById('summaryTime');
const summaryDuration = document.getElementById('summaryDuration');
const summaryPrice = document.getElementById('summaryPrice');
const editServiceBtn = document.getElementById('editServiceBtn');
const editDateTimeBtn = document.getElementById('editDateTimeBtn');
const reviewButton = document.getElementById('submitBtn');

let businessHours: BusinessHour[] = [];
let blockedDates: BlockedDate[] = [];
let appointments: Appointment[] = [];
let bookingSettings: BookingSetting | null = null;
let selectedService: Service | null = null;
let selectedDate = '';
let selectedTime = '';
let bookingDataLoaded = false;

function formatPrice(amount: number) {
  return `GHS ${amount.toFixed(2)}`;
}

function formatDuration(minutes: number) {
  if (minutes % 60 === 0) {
    return `${minutes / 60} hr${minutes === 60 ? '' : 's'}`;
  }
  return `${minutes} min`;
}

function setBookingStepEnabled(enabled: boolean) {
  if (bookingDateInput) bookingDateInput.disabled = !enabled;
  if (bookingTimeSelect) bookingTimeSelect.disabled = !enabled;
}

function getDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseTimeString(time: string) {
  const normalized = time.trim().toLowerCase();
  const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const minute = Number(ampmMatch[2]);
    const period = ampmMatch[3];
    if (hour === 12) hour = 0;
    if (period === 'pm') hour += 12;
    return { hour, minute };
  }

  const parts = normalized.split(':');
  return {
    hour: Number(parts[0] ?? 0),
    minute: Number(parts[1] ?? 0),
  };
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDayName(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function getBusinessHourForDate(date: Date) {
  const dayName = getDayName(date);
  return businessHours.find((hour) => hour.day_of_week === dayName) ?? null;
}

function isDateBlocked(date: Date) {
  const key = getDayKey(date);
  return blockedDates.some((blocked) => blocked.date === key);
}

function getAppointmentsForDate(date: Date) {
  const key = getDayKey(date);
  return appointments.filter((appointment) => {
    const apptDate = new Date(appointment.scheduled_at);
    return getDayKey(apptDate) === key;
  });
}

function getEarliestBookingTime(date: Date) {
  const now = new Date();
  const leadMinutes = bookingSettings?.minimum_lead_time_minutes ?? 60;
  const earliest = new Date(now.getTime() + leadMinutes * 60_000);

  if (getDayKey(date) !== getDayKey(now)) {
    return date;
  }

  return earliest;
}

function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

function buildSlotDates(date: Date, service: Service, businessHour: BusinessHour) {
  const intervalMinutes = bookingSettings?.slot_interval_minutes ?? SLOT_DEFAULT_INTERVAL;
  const { hour: startHour, minute: startMinute } = parseTimeString(businessHour.opens_at);
  const { hour: endHour, minute: endMinute } = parseTimeString(businessHour.closes_at);

  const startDateTime = new Date(date);
  startDateTime.setHours(startHour, startMinute, 0, 0);

  const endDateTime = new Date(date);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  const appointmentIntervals = getAppointmentsForDate(date).map((appointment) => {
    const start = new Date(appointment.scheduled_at);
    const end = new Date(start.getTime() + appointment.duration_minutes * 60_000);
    return { start, end };
  });

  const earliestTime = getEarliestBookingTime(date);
  const now = new Date();
  const slots: string[] = [];
  const lastPossibleStart = new Date(endDateTime.getTime() - service.duration_minutes * 60_000);

  for (let current = new Date(startDateTime); current <= lastPossibleStart; current.setMinutes(current.getMinutes() + intervalMinutes)) {
    const slotStart = new Date(current);
    const slotEnd = new Date(slotStart.getTime() + service.duration_minutes * 60_000);

    if (slotStart < now) {
      continue;
    }

    if (slotStart < earliestTime && getDayKey(date) === getDayKey(now)) {
      continue;
    }

    const overlaps = appointmentIntervals.some((interval) =>
      intervalsOverlap(slotStart, slotEnd, interval.start, interval.end)
    );

    if (overlaps) {
      continue;
    }

    slots.push(formatTimeLabel(slotStart));
  }

  return slots;
}

function updateHiddenServiceFields(service: Service | null) {
  if (!serviceTypeSelect || !selectedServiceIdInput || !selectedServiceNameInput) {
    return;
  }

  if (!service) {
    serviceTypeSelect.value = '';
    selectedServiceIdInput.value = '';
    selectedServiceNameInput.value = '';
    return;
  }

  let option = Array.from(serviceTypeSelect.options).find((opt) => opt.value === service.name);
  if (!option) {
    option = document.createElement('option');
    option.value = service.name;
    option.textContent = service.name;
    serviceTypeSelect.appendChild(option);
  }

  serviceTypeSelect.value = service.name;
  selectedServiceIdInput.value = service.id;
  selectedServiceNameInput.value = service.name;
  selectedService = service;
  updateSummary();
}

function updateHiddenDateField(date: string) {
  if (!bookingDateInput) return;
  bookingDateInput.value = date;
  bookingDateInput.dispatchEvent(new Event('change', { bubbles: true }));
}

function updateHiddenTimeField(time: string) {
  if (!bookingTimeSelect) return;
  let option = Array.from(bookingTimeSelect.options).find((opt) => opt.value === time);
  if (!option) {
    option = new Option(time, time, true, true);
    bookingTimeSelect.appendChild(option);
  } else {
    option.selected = true;
  }
  bookingTimeSelect.value = time;
}

function clearSlotSelection() {
  selectedTime = '';
  if (bookingTimeSelect) bookingTimeSelect.value = '';
  const buttons = slotGrid?.querySelectorAll('.slot-button');
  buttons?.forEach((button) => button.classList.remove('active'));
}

function setError(input: HTMLInputElement | HTMLTextAreaElement | null, errorEl: HTMLElement | null, message: string) {
  if (input) input.style.borderColor = '#ff6b8a';
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.setAttribute('role', 'alert');
  }
}

function clearError(input: HTMLInputElement | HTMLTextAreaElement | null, errorEl: HTMLElement | null) {
  if (input) input.style.borderColor = '';
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.removeAttribute('role');
  }
}

function updateSummary() {
  if (summaryService) {
    summaryService.textContent = selectedService?.name ?? 'Not selected';
  }

  if (summaryDate) {
    summaryDate.textContent = selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not selected';
  }

  if (summaryTime) {
    summaryTime.textContent = selectedTime || 'Not selected';
  }

  if (summaryDuration) {
    summaryDuration.textContent = selectedService ? formatDuration(selectedService.duration_minutes) : '—';
  }

  if (summaryPrice) {
    summaryPrice.textContent = selectedService ? formatPrice(selectedService.price) : '—';
  }
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePhone(value: string) {
  const cleaned = value.replace(/[\s\-]/g, '');
  return /^\+?\d{7,15}$/.test(cleaned);
}

function validateCustomerInfo() {
  let valid = true;

  if (nameInput) {
    if (!nameInput.value.trim()) {
      setError(nameInput, nameError, 'Full name is required.');
      valid = false;
    } else {
      clearError(nameInput, nameError);
    }
  }

  if (emailInput) {
    const email = emailInput.value.trim();
    if (!email) {
      setError(emailInput, emailErrorEl, 'Email address is required.');
      valid = false;
    } else if (!validateEmail(email)) {
      setError(emailInput, emailErrorEl, 'Enter a valid email address.');
      valid = false;
    } else {
      clearError(emailInput, emailErrorEl);
    }
  }

  if (phoneInput) {
    const phone = phoneInput.value.trim();
    if (!phone) {
      setError(phoneInput, phoneErrorEl, 'Phone number is required.');
      valid = false;
    } else if (!validatePhone(phone)) {
      setError(phoneInput, phoneErrorEl, 'Enter a valid phone number.');
      valid = false;
    } else {
      clearError(phoneInput, phoneErrorEl);
    }
  }

  updateSummary();
  return valid;
}

function scrollToElement(element: HTMLElement | null) {
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearDateSelection() {
  selectedDate = '';
  updateHiddenDateField('');
  const buttons = calendarDays?.querySelectorAll('.calendar-day');
  buttons?.forEach((button) => button.classList.remove('active'));
  if (dateError) dateError.textContent = '';
}


function renderTimeSlots(date: Date, slots: string[]) {
  if (!slotGrid) return;
  slotGrid.innerHTML = '';
  clearSlotSelection();

  if (!slots.length) {
    slotGrid.innerHTML = '<div class="calendar-instructions">No available slots for this date. Please choose another day.</div>';
    updateSummary();
    return;
  }

  slots.forEach((time) => {
    const slotButton = document.createElement('button');
    slotButton.type = 'button';
    slotButton.className = 'slot-button';
    slotButton.textContent = time;
    slotButton.addEventListener('click', () => {
      selectedTime = time;
      updateHiddenTimeField(time);
      slotGrid?.querySelectorAll('.slot-button').forEach((btn) => btn.classList.remove('active'));
      slotButton.classList.add('active');
      if (timeError) timeError.textContent = '';
      updateSummary();
    });
    slotGrid.appendChild(slotButton);
  });
  updateSummary();
}

function renderCalendarDays(service: Service | null) {
  if (!calendarDays) return;

  calendarDays.innerHTML = '';
  if (!service || !bookingDataLoaded) {
    calendarDays.innerHTML = '<div class="calendar-instructions">Select a service to unlock the booking calendar.</div>';
    if (slotGrid) slotGrid.innerHTML = '';
    return;
  }

  const today = toLocalDate(new Date());
  const windowDays = bookingSettings?.booking_window_days ?? 30;
  const showToday = bookingSettings?.allow_same_day_booking ?? false;
  const startDate = showToday ? today : addDays(today, 1);
  const availableDates = Array.from({ length: windowDays }, (_, idx) => addDays(startDate, idx));

  availableDates.forEach((date) => {
    const key = getDayKey(date);
    const blocked = isDateBlocked(date);
    const businessHour = getBusinessHourForDate(date);
    const hasBusinessHours = Boolean(businessHour && businessHour.is_open && businessHour.opens_at && businessHour.closes_at);
    let slots: string[] = [];

    if (hasBusinessHours && !blocked) {
      slots = buildSlotDates(date, service, businessHour!);
    }

    const dayButton = document.createElement('button');
    dayButton.type = 'button';
    dayButton.className = 'calendar-day';
    const dayLabel = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const statusLabel = blocked
      ? 'Blocked'
      : !hasBusinessHours
      ? 'Closed'
      : slots.length
      ? `${slots.length} slots`
      : 'Unavailable';

    dayButton.innerHTML = `
      <span class="day-label">${dayLabel}</span>
      <span class="day-date">${dateLabel}</span>
      <span class="day-status">${statusLabel}</span>
    `;

    if (!slots.length) {
      dayButton.classList.add('disabled');
      dayButton.disabled = true;
    }

    if (selectedDate === key) {
      dayButton.classList.add('active');
    }

    dayButton.addEventListener('click', () => {
      if (!slots.length) return;
      selectedDate = key;
      updateHiddenDateField(key);
      renderTimeSlots(date, slots);
      calendarDays.querySelectorAll('.calendar-day').forEach((button) => button.classList.remove('active'));
      dayButton.classList.add('active');
      if (dateError) dateError.textContent = '';
    });

    calendarDays.appendChild(dayButton);
  });
}

function clearCurrentSelections() {
  clearDateSelection();
  clearSlotSelection();
  updateSummary();
}

function selectService(service: Service, cardElement: HTMLElement) {
  const cards = serviceGrid?.querySelectorAll('.booking-service-card');
  cards?.forEach((card) => card.classList.remove('active'));
  cardElement.classList.add('active');

  updateHiddenServiceFields(service);
  persistSelectedService(service);
  clearCurrentSelections();
  if (serviceError) serviceError.textContent = '';
  renderCalendarDays(service);
  updateSummary();
}

function renderServices(services: Service[]) {
  if (!serviceGrid) return;
  serviceGrid.innerHTML = '';

  if (!services.length) {
    serviceFeedback?.removeAttribute('hidden');
    if (serviceFeedback) serviceFeedback.textContent = 'No services are available for booking at the moment.';
    return;
  }

  serviceFeedback?.removeAttribute('hidden');
  if (serviceFeedback) serviceFeedback.textContent = 'Tap a service card to choose it and continue with booking.';

  const storedService = getStoredService();
  services.forEach((service) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'booking-service-card';
    card.setAttribute('aria-pressed', 'false');
    card.innerHTML = `
      <div>
        <h4>${service.name}</h4>
        <p>${service.description ?? 'No description available.'}</p>
      </div>
      <div class="booking-service-card-meta">
        <span>${formatDuration(service.duration_minutes)}</span>
        <span>${formatPrice(service.price)}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      selectService(service, card);
      card.setAttribute('aria-pressed', 'true');
    });

    if (storedService?.id === service.id) {
      card.classList.add('active');
      card.setAttribute('aria-pressed', 'true');
      updateHiddenServiceFields(service);
      renderCalendarDays(service);
    }

    serviceGrid.appendChild(card);
  });
}

function showLoadingState() {
  if (!serviceGrid) return;
  serviceGrid.innerHTML = '<div class="booking-service-card" style="opacity:.6;pointer-events:none;">Loading services...</div>';
}

async function initializeServiceSelection() {
  if (!serviceGrid) return;

  setBookingStepEnabled(false);
  showLoadingState();

  const result = await getAllActiveServices();
  if (result.error || !result.data) {
    serviceGrid.innerHTML = '';
    if (serviceFeedback) {
      serviceFeedback.textContent = result.error?.message ?? 'Unable to load services. Please refresh the page.';
    }
    return;
  }

  renderServices(result.data);
}

function observeServiceChange() {
  const hiddenSelect = serviceTypeSelect;
  if (!hiddenSelect) return;

  hiddenSelect.addEventListener('change', () => {
    const value = hiddenSelect.value;
    if (value && serviceError) {
      serviceError.textContent = '';
    }
  });
}


function renderCalendarNotice() {
  if (!calendarDays) return;
  if (!bookingDataLoaded) {
    calendarDays.innerHTML = '<div class="calendar-instructions">Loading calendar details...</div>';
    return;
  }
}

async function initializeBookingData() {
  bookingDataLoaded = false;
  renderCalendarNotice();

  const [hoursResult, blockedResult, appointmentsResult, settingsResult] = await Promise.all([
    getBusinessHours(),
    getBlockedDates(),
    getAppointments(),
    getBookingSettings(),
  ]);

  if (hoursResult.error || blockedResult.error || appointmentsResult.error || settingsResult.error) {
    const message = hoursResult.error?.message || blockedResult.error?.message || appointmentsResult.error?.message || settingsResult.error?.message;
    if (serviceFeedback) {
      serviceFeedback.textContent = `Unable to load booking availability: ${message}`;
    }
    return;
  }

  businessHours = hoursResult.data ?? [];
  blockedDates = blockedResult.data ?? [];
  appointments = appointmentsResult.data ?? [];
  bookingSettings = settingsResult.data ?? null;
  bookingDataLoaded = true;

  const storedService = getStoredService();
  if (storedService) {
    renderCalendarDays(storedService);
  }
}

if (serviceGrid) {
  initializeServiceSelection();
}

initializeBookingData();
observeServiceChange();
updateSummary();

const storedService = getStoredService();
if (!storedService) {
  setBookingStepEnabled(false);
}

if (editServiceBtn) {
  editServiceBtn.addEventListener('click', () => {
    scrollToElement(serviceGrid);
  });
}

if (editDateTimeBtn) {
  editDateTimeBtn.addEventListener('click', () => {
    scrollToElement(calendarDays);
  });
}

if (reviewButton) {
  let isSubmitting = false;

  async function combineDateAndTimeISO(dateStr: string, timeStr: string) {
    // dateStr expected in YYYY-MM-DD
    const dateParts = dateStr.split('-').map((p) => Number(p));
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const t = parseTimeString(timeStr);
    date.setHours(t.hour, t.minute, 0, 0);
    return date.toISOString();
  }

  function slotStillAvailableForSubmission(dateStr: string, timeStr: string, durationMinutes: number) {
    const start = new Date(dateStr + 'T' + '00:00:00');
    const t = parseTimeString(timeStr);
    start.setHours(t.hour, t.minute, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    const appts = appointments || [];
    for (const appt of appts) {
      const aStart = new Date(appt.scheduled_at);
      const aEnd = new Date(aStart.getTime() + appt.duration_minutes * 60_000);
      if (intervalsOverlap(start, end, aStart, aEnd)) return false;
    }
    return true;
  }

  reviewButton.addEventListener('click', async () => {
    if (isSubmitting) return;

    const customerValid = validateCustomerInfo();
    const hasService = Boolean(selectedService);
    const hasDate = Boolean(selectedDate);
    const hasTime = Boolean(selectedTime);

    if (!hasService) {
      if (serviceError) serviceError.textContent = 'Please select a service to continue.';
    }
    if (!hasDate) {
      if (dateError) dateError.textContent = 'Please select a date.';
    }
    if (!hasTime) {
      if (timeError) timeError.textContent = 'Please select a time.';
    }

    if (!customerValid || !hasService || !hasDate || !hasTime) return;

    isSubmitting = true;
    reviewButton.setAttribute('disabled', 'true');
    reviewButton.classList.add('loading');

    try {
      // Refresh appointments to have up-to-date availability
      const fresh = await getAppointments();
      if (fresh.error) {
        throw fresh.error;
      }
      appointments = fresh.data ?? [];

      // Recompute availability for this slot
      const duration = selectedService!.duration_minutes;
      const available = slotStillAvailableForSubmission(selectedDate, selectedTime, duration);

      if (!available) {
        if (timeError) timeError.textContent = 'Selected time was just booked. Please choose another slot.';
        scrollToElement(slotGrid as HTMLElement);
        // reset submitting UI before returning
        isSubmitting = false;
        reviewButton.removeAttribute('disabled');
        reviewButton.classList.remove('loading');
        return;
      }

      const scheduledAtISO = await combineDateAndTimeISO(selectedDate, selectedTime);
      const payload = {
        service_id: selectedService!.id,
        customer_name: nameInput?.value.trim() ?? '',
        customer_email: emailInput?.value.trim() ?? '',
        phone_number: phoneInput?.value.trim() ?? null,
        scheduled_at: scheduledAtISO,
        duration_minutes: duration,
        status: 'pending',
        notes: notesInput?.value.trim() ?? null,
      };

      const result = await createAppointment(payload as any);
      if (result.error) {
        throw result.error;
      }

      // Append to local cache
      appointments.push(result.data!);

      // Prepare confirmation payload for next page
      const bookingSummary = {
        id: result.data?.id ?? null,
        customer_name: payload.customer_name,
        service: selectedService!.name,
        date: selectedDate,
        time: selectedTime,
        duration_minutes: duration,
      };

      // Persist minimal transient state to sessionStorage and clear selected service
      try {
        sessionStorage.setItem('latest_booking', JSON.stringify(bookingSummary));
        persistSelectedService(null);
      } catch (e) {}

      // Redirect to confirmation page
      window.location.href = 'booking-success.html';
      // If legacy local storage booking list is used, append for compatibility
      try {
        const current = JSON.parse(localStorage.getItem('laraluxe_bookings') || '[]');
        current.push({ date: selectedDate, time: selectedTime, service: selectedService!.name, name: nameInput?.value.trim(), email: emailInput?.value.trim(), ref: result.data?.id });
        localStorage.setItem('laraluxe_bookings', JSON.stringify(current));
      } catch (e) {
        // ignore storage errors
      }

      // Trigger existing success modal if available
      try { (window as any).showModal && (window as any).showModal(); } catch (e) {}

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert('Unable to create booking: ' + message);
    } finally {
      isSubmitting = false;
      reviewButton.removeAttribute('disabled');
      reviewButton.classList.remove('loading');
    }
  });
}
