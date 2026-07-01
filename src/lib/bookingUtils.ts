export function getById<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function setText(element: HTMLElement | null, text: string) {
  if (element) {
    element.textContent = text;
  }
}

export function setDisabled(element: HTMLElement | null, disabled: boolean) {
  if (element) {
    element.toggleAttribute('disabled', disabled);
    element.setAttribute('aria-disabled', String(disabled));
  }
}

export function clampNumber(value: number, min: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(min, value) : fallback;
}

export function formatPrice(amount: number) {
  return `GHS ${amount.toFixed(2)}`;
}

export function formatDuration(minutes: number) {
  if (minutes % 60 === 0) {
    return `${minutes / 60} hr${minutes === 60 ? '' : 's'}`;
  }
  return `${minutes} min`;
}

export function getDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getDayName(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

export function parseTimeString(time: string) {
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

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string) {
  const cleaned = value.replace(/[\s\-()]/g, '');
  return /^\+?\d{7,15}$/.test(cleaned);
}
