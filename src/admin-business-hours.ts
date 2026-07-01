import { getBusinessHours, updateBusinessHour } from './services/businessHoursService';

const hoursTableBody = document.getElementById('hoursTableBody') as HTMLElement | null;

function escapeHtml(value: string) {
  return String(value || '').replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
}

function formatTime(value: string) {
  return value || '—';
}

function renderHours(hours: any[]) {
  if (!hoursTableBody) return;
  if (!hours.length) {
    hoursTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#888;">No business hours configured.</td></tr>';
    return;
  }

  hoursTableBody.innerHTML = hours
    .map((hour) => {
      const checked = hour.is_open ? 'checked' : '';
      return `
        <tr>
          <td style="font-weight:500;">${escapeHtml(hour.day_of_week)}</td>
          <td>
            <label class="status-toggle">
              <input type="checkbox" data-id="${hour.id}" ${checked} />
              <span>${hour.is_open ? 'Open' : 'Closed'}</span>
            </label>
          </td>
          <td>
            <input type="time" data-id="${hour.id}" data-field="opens_at" value="${escapeHtml(hour.opens_at)}" ${hour.is_open ? '' : 'disabled'} />
          </td>
          <td>
            <input type="time" data-id="${hour.id}" data-field="closes_at" value="${escapeHtml(hour.closes_at)}" ${hour.is_open ? '' : 'disabled'} />
          </td>
          <td>
            <button class="btn-ghost btn-save" data-id="${hour.id}">Save</button>
          </td>
        </tr>
      `;
    })
    .join('\n');

  attachRowHandlers();
}

function attachRowHandlers() {
  if (!hoursTableBody) return;

  hoursTableBody.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLInputElement;
      const id = target.dataset.id!;
      const row = target.closest('tr');
      const inputs = row?.querySelectorAll<HTMLInputElement>('input[type="time"]');
      inputs?.forEach((input) => {
        input.disabled = !target.checked;
      });
    });
  });

  hoursTableBody.querySelectorAll<HTMLInputElement>('input[type="time"]').forEach((input) => {
    input.addEventListener('change', () => {
      const checkbox = input.closest('tr')?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        const inputs = input.closest('tr')?.querySelectorAll<HTMLInputElement>('input[type="time"]');
        inputs?.forEach((item) => (item.disabled = false));
      }
    });
  });

  hoursTableBody.querySelectorAll<HTMLButtonElement>('.btn-save').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id!;
      const row = button.closest('tr');
      const isOpen = row?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked ?? false;
      const opensAt = row?.querySelector<HTMLInputElement>('input[data-field="opens_at"]')?.value ?? '';
      const closesAt = row?.querySelector<HTMLInputElement>('input[data-field="closes_at"]')?.value ?? '';

      if (isOpen && (!opensAt || !closesAt)) {
        alert('Please set both opening and closing times for open days.');
        return;
      }

      const result = await updateBusinessHour(id, {
        is_open: isOpen,
        opens_at: opensAt,
        closes_at: closesAt,
      });

      if (result.error) {
        alert('Unable to save business hours: ' + result.error.message);
        return;
      }

      alert('Business hours updated. Booking slots will refresh automatically.');
    });
  });
}

async function loadBusinessHours() {
  if (!hoursTableBody) return;
  hoursTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#888;">Loading business hours…</td></tr>';
  const result = await getBusinessHours();
  if (result.error) {
    hoursTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#d9534f;">Unable to load business hours: ${result.error.message}</td></tr>`;
    return;
  }
  renderHours(result.data ?? []);
}

loadBusinessHours();
