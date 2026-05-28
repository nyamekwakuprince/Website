'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection    = document.getElementById('adminLoginSection');
  const dashboardSection = document.getElementById('adminDashboardSection');
  const loginForm       = document.getElementById('adminLoginForm');
  const loginError      = document.getElementById('loginError');
  const logoutBtn       = document.getElementById('logoutBtn');
  const tableBody       = document.getElementById('bookingsTableBody');

  // Check login state
  function checkSession() {
    const token = sessionStorage.getItem('adminToken');
    if (token === 'secret-admin-token-mock') {
      showDashboard();
    } else {
      loginSection.style.display = 'block';
      dashboardSection.style.display = 'none';
    }
  }

  checkSession();

  // Login handler
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (username === 'admin' && password === 'password123') {
      sessionStorage.setItem('adminToken', 'secret-admin-token-mock');
      showDashboard();
    } else {
      loginError.textContent = 'Invalid username or password.';
      loginError.style.display = 'block';
    }
  });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminToken');
    dashboardSection.style.display = 'none';
    loginSection.style.display     = 'block';
    loginForm.reset();
  });

  // Display bookings from localStorage
  function showDashboard() {
    loginSection.style.display      = 'none';
    dashboardSection.style.display  = 'block';
    
    const bookings = JSON.parse(localStorage.getItem('laraluxe_bookings') || '[]');
    renderTable(bookings);
  }

  // Render bookings in the table
  function renderTable(bookings) {
    if (!bookings || bookings.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #888;">No bookings found yet.</td></tr>';
      return;
    }

    // Sort by created date descending (newest first)
    const sorted = [...bookings].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    let html = '';
    sorted.forEach(b => {
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

      let bookingDateFormatted = b.date;
      try {
        const [y, m, d] = b.date.split('-');
        const months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        bookingDateFormatted = `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
      } catch (_) {}

      html += `
        <tr>
          <td style="font-weight: 500;">${bookingDateFormatted}</td>
          <td>${b.time}</td>
          <td><strong>${b.name}</strong></td>
          <td>${b.service}</td>
          <td>
            <div><a href="mailto:${b.email}" style="color:var(--purple);text-decoration:none;">${b.email}</a></div>
            <div style="font-size:12px;color:#666;margin-top:4px;">${b.phone || 'N/A'}</div>
          </td>
          <td><span class="badge" style="background-color: #fcf6fc; color: var(--purple-dark); border: 1px solid rgba(107,26,110,0.15);">Confirmed</span></td>
          <td style="font-size: 12px; color: #888;">${createdDate}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }
});
