import type { Service } from './types';

const STORAGE_KEY = 'laraluxe_selected_service';

export function getStoredService(): Service | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Service : null;
  } catch {
    return null;
  }
}

export function persistSelectedService(service: Service | null): void {
  if (!service) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(service));
}
