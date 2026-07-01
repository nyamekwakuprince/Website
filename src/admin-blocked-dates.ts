import { createBlockedDate, deleteBlockedDate, getBlockedDates } from './services/blockedDatesService';

const blockedDatesTable = document.getElementById('blockedDatesTableBody') as HTMLElement | null;
const addDateBtn = document.getElementById('addBlockedDateBtn') as HTMLButtonElement | null;
const dateInput = document.getElementById('blockedDateInput') as HTMLInputElement | null;
const reasonInput = document.getElementById('blockedReasonInput') as HTMLInputElement | null;

function escapeHtml(value: string) {
  return String(value || '').replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
}

function formatDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderBlockedDates(blocked: any[]) {
  if (!blockedDatesTable) return;
  if (!blocked.length) {
    blockedDatesTable.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#888;">No blocked dates.</td></tr>';
    return;
  }

  blockedDatesTable.innerHTML = blocked
    .map((item) => `
      <tr>
        <td style="font-weight:500;">${escapeHtml(formatDate(item.date))}</td>
        <td>${escapeHtml(item.reason || '')}</td>
        <td><span class="badge">Blocked</span></td>
        <td><button class="action-button btn-delete" data-id="${item.id}">Delete</button></td>
      </tr>
    `)
    .join('\n');

  blockedDatesTable.querySelectorAll<HTMLButtonElement>('.btn-delete').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id!;
      if (!confirm('Delete this blocked date?')) return;
      const result = await deleteBlockedDate(id);
      if (result.error) {
        alert('Unable to delete blocked date: ' + result.error.message);
        return;
      }
      loadBlockedDates();
    });
  });
}

async function loadBlockedDates() {
  if (!blockedDatesTable) return;
  blockedDatesTable.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#888;">Loading blocked dates…</td></tr>';
  const result = await getBlockedDates();
  if (result.error) {
    blockedDatesTable.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:#d9534f;">Unable to load blocked dates: ${result.error.message}</td></tr>`;
    return;
  }
  renderBlockedDates(result.data ?? []);
}

if (addDateBtn) {
  addDateBtn.addEventListener('click', async () => {
    const date = dateInput?.value ?? '';
    const reason = reasonInput?.value.trim() ?? '';
    if (!date) {
      alert('Please choose a date to block.');
      return;
    }

    const result = await createBlockedDate({ date, reason, is_full_day: true });
    if (result.error) {
      alert('Unable to add blocked date: ' + result.error.message);
      return;
    }

    if (reasonInput) reasonInput.value = '';
    if (dateInput) dateInput.value = '';
    loadBlockedDates();
  });
}

loadBlockedDates();
