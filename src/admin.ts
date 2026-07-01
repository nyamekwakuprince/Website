import { supabase } from './lib/supabase';

// Admin page script: protects dashboard routes and handles login via Supabase

const loginSection = document.getElementById('adminLoginSection') as HTMLElement | null;
const dashboardSection = document.getElementById('adminDashboardSection') as HTMLElement | null;
const loginForm = document.getElementById('adminLoginForm') as HTMLFormElement | null;
const loginError = document.getElementById('loginError') as HTMLElement | null;
const logoutBtn = document.getElementById('logoutBtn') as HTMLElement | null;
const tableBody = document.getElementById('bookingsTableBody') as HTMLElement | null;
const adminUsername = document.getElementById('adminUsername') as HTMLInputElement | null;
const adminPassword = document.getElementById('adminPassword') as HTMLInputElement | null;

function showLoading(message = 'Checking authentication…') {
  if (!loginSection) return;
  loginSection.innerHTML = `<div style="padding:30px;text-align:center;color:var(--muted);">${message}</div>`;
}

function showLogin() {
  if (!loginSection || !dashboardSection) return;
  loginSection.style.display = 'block';
  dashboardSection.style.display = 'none';
}

function showUnauthorized(message = 'You are not authorized to access this page.') {
  if (!loginSection || !dashboardSection) return;
  loginSection.innerHTML = `
    <div style="max-width:480px;margin:40px auto;padding:30px;background:#fff;border-radius:12px;text-align:center;">
      <h3 style="margin-bottom:8px;">Access Denied</h3>
      <p style="color:var(--muted);margin-bottom:16px;">${message}</p>
      <a href="../index.html" class="btn-outline">Return Home</a>
    </div>
  `;
  dashboardSection.style.display = 'none';
}

function showDashboard() {
  if (!loginSection || !dashboardSection) return;
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
}

let allBookings: any[] = [];
let servicesMap: Record<string, string> = {};
const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement | null;
const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;

async function fetchBookingsAndRender() {
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">Loading bookings…</td></tr>';

  const [{ data: appointments, error: apptError }, { data: services, error: svcError }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, scheduled_at, duration_minutes, customer_name, customer_email, phone_number, notes, status, created_at, service_id')
      .order('scheduled_at', { ascending: false }),
    supabase.from('services').select('id,name'),
  ]);

  if (apptError) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:20px;color:#d9534f;">Unable to load bookings: ${apptError.message}</td></tr>`;
    return;
  }

  if (svcError) {
    // keep going, service names will show as —
    console.warn('Unable to load services map', svcError.message);
  }

  allBookings = appointments ?? [];
  servicesMap = {};
  (services ?? []).forEach((s: any) => { servicesMap[s.id] = s.name; });

  applyFiltersAndRender();
}

function formatDateParts(dt?: string) {
  if (!dt) return { date: '—', time: '—' };
  const d = new Date(dt);
  return {
    date: d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

function applyFiltersAndRender() {
  if (!tableBody) return;
  const status = statusFilter?.value ?? 'all';
  const q = (searchInput?.value || '').trim().toLowerCase();

  let filtered = allBookings.slice();
  if (status !== 'all') {
    filtered = filtered.filter((b) => (b.status || '').toLowerCase() === status.toLowerCase());
  }
  if (q) {
    filtered = filtered.filter((b) => (b.customer_name || '').toLowerCase().includes(q));
  }

  if (!filtered.length) {
    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#888;">No bookings found.</td></tr>';
    return;
  }

  const rows = filtered.map((b: any) => {
    const parts = formatDateParts(b.scheduled_at);
    const created = b.created_at ? new Date(b.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const serviceName = servicesMap[b.service_id] ?? '—';
    const safeName = escapeHtml(b.customer_name || '—');
    const safeEmail = escapeHtml(b.customer_email || '—');
    const safePhone = escapeHtml(b.phone_number || 'N/A');
    const safeNotes = escapeHtml(b.notes || '');
    const status = escapeHtml(b.status || 'pending');

    // status select
    const statusSelect = `
      <select data-id="${b.id}" class="status-select" style="padding:6px;border-radius:6px;border:1px solid #eee;">
        <option value="pending" ${b.status==='pending'?'selected':''}>Pending</option>
        <option value="confirmed" ${b.status==='confirmed'?'selected':''}>Confirmed</option>
        <option value="completed" ${b.status==='completed'?'selected':''}>Completed</option>
        <option value="cancelled" ${b.status==='cancelled'?'selected':''}>Cancelled</option>
      </select>
    `;

    return `
      <tr>
        <td style="font-weight:500;">${parts.date}</td>
        <td>${parts.time}</td>
        <td><strong>${safeName}</strong></td>
        <td>${escapeHtml(serviceName)}</td>
        <td>${safePhone}</td>
        <td><a href="mailto:${safeEmail}" style="color:var(--purple);text-decoration:none;">${safeEmail}</a></td>
        <td style="max-width:240px;white-space:pre-wrap;word-break:break-word;">${safeNotes}</td>
        <td>${statusSelect}</td>
        <td style="font-size:12px;color:#888;">${created}</td>
      </tr>
    `;
  });

  tableBody.innerHTML = rows.join('\n');

  // attach listeners to status selects
  const selects = Array.from(document.querySelectorAll('.status-select')) as HTMLSelectElement[];
  selects.forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const target = e.currentTarget as HTMLSelectElement;
      const id = target.dataset.id;
      const newStatus = target.value;
      try {
        target.disabled = true;
        await updateAppointmentStatus(id!, newStatus);
      } catch (err) {
        // revert selection on error
        const original = allBookings.find((b) => String(b.id) === String(id))?.status ?? 'pending';
        target.value = original;
        alert('Unable to update status: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        target.disabled = false;
      }
    });
  });
}

async function updateAppointmentStatus(id: string, status: string) {
  const { data, error } = await supabase.from('appointments').update({ status }).eq('id', id).select().maybeSingle();
  if (error) throw error;
  // update local cache
  const idx = allBookings.findIndex((b) => String(b.id) === String(id));
  if (idx >= 0) {
    allBookings[idx] = { ...allBookings[idx], ...data };
  }
  applyFiltersAndRender();
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"]+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
}

// Wire search and filter inputs
if (statusFilter) {
  statusFilter.addEventListener('change', () => applyFiltersAndRender());
}

let searchTimeout: any = null;
if (searchInput) {
  searchInput.addEventListener('input', () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => applyFiltersAndRender(), 300);
  });
}

async function isUserAdmin(userId: string) {
  // check admin_users table for either id or user_id matching the Supabase user id
  const orFilter = `id.eq.${userId},user_id.eq.${userId}`;
  const { data, error } = await supabase.from('admin_users').select('id,user_id').or(orFilter).limit(1).maybeSingle();
  if (error) return false;
  return Boolean(data);
}

async function checkAuthOnLoad() {
  if (!loginSection) return;
  showLoading();

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session ?? null;
  if (!session) {
    // not logged in
    showLogin();
    return;
  }

  const user = session.user;
  if (!user || !user.id) {
    showLogin();
    return;
  }

  const admin = await isUserAdmin(user.id);
  if (!admin) {
    showUnauthorized('Your account is not authorized to access this dashboard.');
    return;
  }

  showDashboard();
  fetchBookingsAndRender();
}

// Form submit - sign in with Supabase
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginError) { loginError.style.display = 'none'; loginError.textContent = ''; }

    const identifier = adminUsername?.value.trim() ?? '';
    const password = adminPassword?.value ?? '';

    if (!identifier || !password) {
      if (loginError) { loginError.textContent = 'Please enter your email and password.'; loginError.style.display = 'block'; }
      return;
    }

    // show a minimal loading state
    if (loginForm) {
      const submitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      const spinner = document.getElementById('loginSpinner') as HTMLElement | null;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in…'; }
      if (spinner) spinner.style.display = 'inline-block';
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error('No user returned from authentication.');

      const authorized = await isUserAdmin(user.id);
      if (!authorized) {
        await supabase.auth.signOut();
        showUnauthorized('Your account is not an administrator.');
        return;
      }

      // show dashboard and load bookings
      showDashboard();
      await fetchBookingsAndRender();

    } catch (err: any) {
      if (loginError) {
        loginError.textContent = err?.message ?? 'Unable to sign in. Please check your credentials.';
        loginError.style.display = 'block';
      }
    } finally {
      if (loginForm) {
        const submitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        const spinner = document.getElementById('loginSpinner') as HTMLElement | null;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign in'; }
        if (spinner) spinner.style.display = 'none';
      }
    }
  });
}

// logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLogin();
    if (loginForm) loginForm.reset();
  });
}

// Protect route on initial load
checkAuthOnLoad();

// Also respond to auth changes (e.g., sign out elsewhere)
supabase.auth.onAuthStateChange((event, session) => {
  if (!session || !session.user) {
    showLogin();
  }
});
