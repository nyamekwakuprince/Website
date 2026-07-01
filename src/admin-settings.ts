import { getBookingSettings, updateBookingSettings } from './services/settingsService';
import type { BookingSetting } from './lib/types';

const settingsForm = document.getElementById('settingsForm') as HTMLFormElement | null;
const businessNameInput = document.getElementById('businessName') as HTMLInputElement | null;
const businessPhoneInput = document.getElementById('businessPhone') as HTMLInputElement | null;
const businessEmailInput = document.getElementById('businessEmail') as HTMLInputElement | null;
const businessAddressInput = document.getElementById('businessAddress') as HTMLTextAreaElement | null;
const slotIntervalInput = document.getElementById('slotInterval') as HTMLInputElement | null;
const bookingNoticeInput = document.getElementById('bookingNoticeHours') as HTMLInputElement | null;
const saveStatus = document.getElementById('saveStatus') as HTMLElement | null;

let currentSettingsId: string | null = null;

function displayStatus(message: string, success = true) {
  if (!saveStatus) return;
  saveStatus.textContent = message;
  saveStatus.className = `message ${success ? 'success' : 'error'}`;
  saveStatus.style.display = 'inline-block';
}

function clearStatus() {
  if (!saveStatus) return;
  saveStatus.style.display = 'none';
  saveStatus.textContent = '';
}

function setFormValues(settings: BookingSetting) {
  currentSettingsId = settings.id;
  if (businessNameInput) businessNameInput.value = settings.business_name ?? '';
  if (businessPhoneInput) businessPhoneInput.value = settings.business_phone ?? '';
  if (businessEmailInput) businessEmailInput.value = settings.business_email ?? '';
  if (businessAddressInput) businessAddressInput.value = settings.business_address ?? '';
  if (slotIntervalInput) slotIntervalInput.value = String(settings.slot_interval_minutes ?? 30);
  if (bookingNoticeInput) {
    bookingNoticeInput.value = String(
      settings.minimum_lead_time_minutes != null
        ? Math.round(settings.minimum_lead_time_minutes / 60)
        : 24
    );
  }
}

function getPayload() {
  return {
    business_name: businessNameInput?.value.trim() || null,
    business_phone: businessPhoneInput?.value.trim() || null,
    business_email: businessEmailInput?.value.trim() || null,
    business_address: businessAddressInput?.value.trim() || null,
    slot_interval_minutes: Number(slotIntervalInput?.value ?? 30),
    minimum_lead_time_minutes: Number(bookingNoticeInput?.value ?? 24) * 60,
  };
}

async function loadSettings() {
  if (!settingsForm) return;
  const result = await getBookingSettings();
  if (result.error) {
    displayStatus(`Unable to load settings: ${result.error.message}`, false);
    return;
  }

  const settings = result.data;
  if (!settings) {
    displayStatus('No settings record found. Adjust values and save to create one.');
    return;
  }

  setFormValues(settings);
}

async function onSubmit(event: Event) {
  event.preventDefault();
  clearStatus();
  if (!settingsForm) return;

  const payload = getPayload();
  const trimmedEmail = payload.business_email;
  if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
    displayStatus('Please enter a valid email address.', false);
    return;
  }
  if (payload.slot_interval_minutes <= 0) {
    displayStatus('Slot interval must be greater than zero.', false);
    return;
  }
  if (payload.minimum_lead_time_minutes < 0) {
    displayStatus('Booking notice hours cannot be negative.', false);
    return;
  }

  try {
    const result = await updateBookingSettings(currentSettingsId, payload);
    if (result.error) {
      displayStatus(`Unable to save settings: ${result.error.message}`, false);
      return;
    }
    if (result.data) {
      setFormValues(result.data);
      displayStatus('Booking settings saved successfully.', true);
    }
  } catch (err: any) {
    displayStatus(`Unable to save settings: ${err?.message ?? String(err)}`, false);
  }
}

async function initialize() {
  if (settingsForm) {
    settingsForm.addEventListener('submit', onSubmit);
  }
  await loadSettings();
}

initialize();
