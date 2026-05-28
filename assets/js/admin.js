// ===== ADMIN DASHBOARD — Flask Backend Integrated =====
// Uses Flask API for authentication and sqlite bookings database.

document.addEventListener('DOMContentLoaded', () => {
  const loginSection    = document.getElementById('adminLoginSection');
  const dashboardSection = document.getElementById('adminDashboardSection');
  const loginForm       = document.getElementById('adminLoginForm');
  const loginError      = document.getElementById('loginError');
  const logoutBtn       = document.getElementById('logoutBtn');
  const tableBody       = document.getElementById('bookingsTableBody');

  // ── Session Check on Page Load ────────────────────────────────────────────
  function checkSession() {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      showDashboard();
    } else {
      loginSection.style.display = 'block';
      dashboardSection.style.display = 'none';
    }
  }

  checkSession();

  // ── Handle Login ──────────────────────────────────────────────────────────
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const btn      = loginForm.querySelector('button');

    btn.textContent = 'Logging in...';
    btn.disabled    = true;

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        sessionStorage.setItem('adminToken', result.token);
        showDashboard();
      } else {
        loginError.textContent = result.message || 'Invalid username or password.';
        loginError.style.display = 'block';
      }
    } catch (err) {
      console.error(err);
      loginError.textContent = 'Connection error. Please check if the backend server is running.';
      loginError.style.display = 'block';
    } finally {
      btn.textContent = 'Login to Dashboard';
      btn.disabled    = false;
    }
  });

  // ── Handle Logout ─────────────────────────────────────────────────────────
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminToken');
    dashboardSection.style.display = 'none';
    loginSection.style.display     = 'block';
    loginForm.reset();
  });

  // ── Fetch and Display Bookings ────────────────────────────────────────────
  async function showDashboard() {
    loginSection.style.display      = 'none';
    dashboardSection.style.display  = 'block';
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #888;">Loading bookings...</td></tr>';

    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      sessionStorage.removeItem('adminToken');
      loginSection.style.display = 'block';
      dashboardSection.style.display = 'none';
      return;
    }

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('adminToken');
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        loginError.textContent = 'Session expired. Please log in again.';
        loginError.style.display = 'block';
        return;
      }

      const result = await response.json();

      if (response.ok && result.success) {
        renderTable(result.data);
      } else {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red; padding: 20px;">Error loading bookings: ${result.message || 'Unknown error'}</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red; padding: 20px;">Unexpected error fetching bookings. Please check the backend.</td></tr>';
    }
  }

  // ── Render Bookings Table ─────────────────────────────────────────────────
  function renderTable(bookings) {
    if (!bookings || bookings.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #888;">No bookings found yet.</td></tr>';
      return;
    }

    let html = '';
    bookings.forEach(b => {
      let createdDate = 'N/A';
      if (b.created_at) {
        try {
          createdDate = new Date(b.created_at).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          });
        } catch (_) {
          createdDate = b.created_at;
        }
      }

      // Format the booking date nicely if stored as ISO date
      let bookingDateFormatted = b.booking_date;
      try {
        // booking_date stored as 'YYYY-MM-DD'
        const [y, m, d] = b.booking_date.split('-');
        const months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        bookingDateFormatted = `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
      } catch (_) { /* keep original */ }

      html += `
        <tr>
          <td style="font-weight: 500;">${bookingDateFormatted}</td>
          <td>${b.booking_time}</td>
          <td><strong>${b.client_name}</strong></td>
          <td>${b.service_type}</td>
          <td>
            <div><a href="mailto:${b.client_email}" style="color:var(--primary-color);text-decoration:none;">${b.client_email}</a></div>
            <div style="font-size:12px;color:#666;margin-top:4px;">${b.client_phone || 'N/A'}</div>
          </td>
          <td><span class="badge">Paid (${b.deposit_paid || 'GHC 100.00'})</span></td>
          <td style="font-size: 12px; color: #888;">${createdDate}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }
});
