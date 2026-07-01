import { getAllServices, createService, updateService } from './services/servicesService';
import { supabase } from './lib/supabase';

const servicesTable = document.getElementById('servicesTableBody') as HTMLElement | null;
const addServiceBtn = document.getElementById('addServiceBtn') as HTMLButtonElement | null;
const serviceModal = document.getElementById('serviceModal') as HTMLElement | null;
const modalTitle = document.getElementById('modalTitle') as HTMLElement | null;
const serviceForm = document.getElementById('serviceForm') as HTMLFormElement | null;
const serviceIdInput = document.getElementById('serviceId') as HTMLInputElement | null;
const nameInput = document.getElementById('serviceName') as HTMLInputElement | null;
const descInput = document.getElementById('serviceDesc') as HTMLTextAreaElement | null;
const durationInput = document.getElementById('serviceDuration') as HTMLInputElement | null;
const priceInput = document.getElementById('servicePrice') as HTMLInputElement | null;
const activeSelect = document.getElementById('serviceActive') as HTMLSelectElement | null;
const cancelBtn = document.getElementById('cancelService') as HTMLButtonElement | null;

let servicesCache: any[] = [];

function showModal(edit = false) {
  if (!serviceModal) return;
  serviceModal.style.display = 'block';
  if (modalTitle) modalTitle.textContent = edit ? 'Edit Service' : 'Add Service';
}

function hideModal() {
  if (!serviceModal) return;
  serviceModal.style.display = 'none';
  if (serviceForm) serviceForm.reset();
  if (serviceIdInput) serviceIdInput.value = '';
}

async function loadServices() {
  if (servicesTable) servicesTable.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:16px;color:#888;">Loading…</td></tr>';
  const res = await getAllServices();
  if (res.error) {
    if (servicesTable) servicesTable.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:16px;color:#d9534f;">Unable to load services: ${res.error.message}</td></tr>`;
    return;
  }
  servicesCache = res.data ?? [];
  renderServices();
}

function renderServices() {
  if (!servicesTable) return;
  if (!servicesCache.length) {
    servicesTable.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">No services yet.</td></tr>';
    return;
  }

  const rows = servicesCache.map((s) => {
    const active = s.is_active ? 'Yes' : 'No';
    return `
      <tr>
        <td style="font-weight:500;">${escapeHtml(s.name)}</td>
        <td style="max-width:320px;white-space:pre-wrap;word-break:break-word;">${escapeHtml(s.description || '')}</td>
        <td>${s.duration_minutes ?? '—'}</td>
        <td>GHS ${Number(s.price ?? 0).toFixed(2)}</td>
        <td>${active}</td>
        <td>
          <button class="btn-ghost btn-edit" data-id="${s.id}">Edit</button>
          <button class="btn-ghost btn-toggle" data-id="${s.id}">${s.is_active ? 'Deactivate' : 'Activate'}</button>
        </td>
      </tr>
    `;
  }).join('\n');

  servicesTable.innerHTML = rows;

  // Attach listeners
  document.querySelectorAll('.btn-edit').forEach((btn) => {
    (btn as HTMLElement).addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id')!;
      openEditService(id);
    });
  });

  document.querySelectorAll('.btn-toggle').forEach((btn) => {
    (btn as HTMLElement).addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id')!;
      await toggleServiceActive(id);
    });
  });
}

function openEditService(id: string) {
  const s = servicesCache.find((x) => String(x.id) === String(id));
  if (!s) return;
  if (serviceIdInput) serviceIdInput.value = s.id;
  if (nameInput) nameInput.value = s.name ?? '';
  if (descInput) descInput.value = s.description ?? '';
  if (durationInput) durationInput.value = String(s.duration_minutes ?? '');
  if (priceInput) priceInput.value = String(s.price ?? '');
  if (activeSelect) activeSelect.value = s.is_active ? 'true' : 'false';
  showModal(true);
}

async function toggleServiceActive(id: string) {
  const s = servicesCache.find((x) => String(x.id) === String(id));
  if (!s) return;
  const newState = !s.is_active;
  // update via service
  const res = await updateService(id, { is_active: newState });
  if (res.error) {
    alert('Unable to update service: ' + res.error.message);
    return;
  }
  // update cache and re-render
  const idx = servicesCache.findIndex((x) => String(x.id) === String(id));
  if (idx >= 0) servicesCache[idx] = res.data ?? servicesCache[idx];
  renderServices();
}

function escapeHtml(s: string) {
  return String(s || '').replace(/[&<>\"]+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
}

// Handle add button
if (addServiceBtn) {
  addServiceBtn.addEventListener('click', () => {
    if (serviceForm) serviceForm.reset();
    if (serviceIdInput) serviceIdInput.value = '';
    if (activeSelect) activeSelect.value = 'true';
    showModal(false);
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal();
  });
}

if (serviceForm) {
  serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = serviceIdInput?.value ?? '';
    const payload: any = {
      name: nameInput?.value.trim() ?? '',
      description: descInput?.value.trim() ?? null,
      duration_minutes: Number(durationInput?.value ?? 0),
      price: Number(priceInput?.value ?? 0),
      is_active: (activeSelect?.value === 'true'),
    };

    if (!payload.name) {
      alert('Name is required');
      return;
    }

    try {
      if (id) {
        const res = await updateService(id, payload);
        if (res.error) throw res.error;
        // update cache
        const idx = servicesCache.findIndex((x) => String(x.id) === String(id));
        if (idx >= 0) servicesCache[idx] = res.data ?? servicesCache[idx];
      } else {
        const res = await createService(payload);
        if (res.error) throw res.error;
        servicesCache.push(res.data);
      }
      renderServices();
      hideModal();
    } catch (err: any) {
      alert('Unable to save service: ' + (err.message ?? String(err)));
    }
  });
}

// initial load
loadServices();

// allow closing modal by clicking backdrop
if (serviceModal) {
  serviceModal.addEventListener('click', (e) => {
    if (e.target === serviceModal) hideModal();
  });
}
