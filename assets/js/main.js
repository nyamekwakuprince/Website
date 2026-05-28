'use strict';

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[Service Worker] Registered successfully', reg.scope))
      .catch((err) => console.error('[Service Worker] Registration failed', err));
  });
}

// ===== HERO IMAGE SLIDER =====
(function() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.slider-dots .dot');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(index) {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');
    slides[current].style.animation = 'none';
    current = (index + slides.length) % slides.length;
    // Force reflow
    void slides[current].offsetWidth;
    slides[current].style.animation = '';
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.slide, 10));
      startAuto();
    });
  });

  startAuto();
})();

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) {
    const isScrolled = window.scrollY > 50;
    navbar.classList.toggle('scrolled', isScrolled);
    
    // On home page, navbar should be dark only when not scrolled
    const isHomePage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
    if (isHomePage) {
      if (isScrolled) {
        navbar.classList.remove('theme-dark');
      } else {
        navbar.classList.add('theme-dark');
      }
    }
  }
});

// ===== HAMBURGER & FOCUS TRAPPING FOR MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  const spans = hamburger.querySelectorAll('span');
  
  hamburger.addEventListener('click', toggleMenu);
  
  // Also handle Enter/Space keypresses on hamburger for accessibility
  hamburger.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleMenu();
    }
  });

  function toggleMenu() {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
    
    spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
    spans[1].style.opacity = open ? '0' : '1';
    spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
    spans.forEach(s => s.style.background = open ? '#ffffff' : '');

    if (open) {
      document.addEventListener('keydown', trapMenuFocus);
      // Focus first link in the nav menu
      const firstLink = navLinks.querySelector('a');
      if (firstLink) firstLink.focus();
    } else {
      document.removeEventListener('keydown', trapMenuFocus);
      hamburger.focus();
    }
  }

  function trapMenuFocus(e) {
    if (!navLinks.classList.contains('open')) return;
    
    const focusableElements = [hamburger, ...Array.from(navLinks.querySelectorAll('a'))];
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    } else if (e.key === 'Escape') {
      toggleMenu();
    }
  }
}

// ===== SCROLL REVEAL =====
const reveals = document.querySelectorAll('.reveal');
if (reveals.length > 0) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 50);
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.05 });
  reveals.forEach(el => revealObserver.observe(el));
}

// ===== GALLERY FILTERS =====
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

if (filterBtns.length > 0 && galleryItems.length > 0) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterValue = btn.getAttribute('data-filter');
      
      galleryItems.forEach(item => {
        if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
          item.classList.remove('hide');
          setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'scale(1)'; }, 50);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.8)';
          setTimeout(() => { item.classList.add('hide'); }, 400);
        }
      });
    });
  });
}

// ===== GALLERY LIGHTBOX WITH ACCESSIBILITY =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');

let activeGalleryIndex = -1;
let previouslyFocusedElement = null;

function openLightbox(index) {
  if (!lightbox || !lightboxImg) return;
  
  const currentItems = document.querySelectorAll('.gallery-item:not(.hide)');
  const item = currentItems[index];
  if (!item) return;

  previouslyFocusedElement = document.activeElement;
  activeGalleryIndex = index;
  
  const img = item.querySelector('img');
  const title = item.querySelector('.gallery-item-title').innerText;
  
  lightboxImg.src = img.src;
  lightboxCaption.innerText = title;
  
  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  document.body.style.overflow = 'hidden';

  // Trap focus
  document.addEventListener('keydown', trapLightboxFocus);
  lightbox.querySelector('.close-lightbox').focus();
}
window.openLightbox = openLightbox;

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'auto';
  document.removeEventListener('keydown', trapLightboxFocus);
  
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }
}
window.closeLightbox = closeLightbox;

function trapLightboxFocus(e) {
  if (!lightbox.classList.contains('active')) return;

  const closeBtn = lightbox.querySelector('.close-lightbox');
  const focusable = [closeBtn];
  
  if (e.key === 'Tab') {
    e.preventDefault(); // Trap focus strictly on the close button in this simple view
    closeBtn.focus();
  } else if (e.key === 'Escape') {
    closeLightbox();
  }
}

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('close-lightbox')) {
      closeLightbox();
    }
  });
}

// ===== CONTACT FORM VALIDATION & MAILTO FALLBACK =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  const messageInput = document.getElementById('contactMessage');

  const nameError = document.getElementById('contactNameError');
  const emailError = document.getElementById('contactEmailError');
  const messageError = document.getElementById('contactMessageError');

  // Real-time validation
  nameInput.addEventListener('blur', () => validateField(nameInput, nameError, 'Name is required.'));
  emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim()) {
      showError(emailInput, emailError, 'Email is required.');
    } else if (!validateEmail(emailInput.value)) {
      showError(emailInput, emailError, 'Enter a valid email.');
    } else {
      clearError(emailInput, emailError);
    }
  });
  messageInput.addEventListener('blur', () => validateField(messageInput, messageError, 'Message is required.'));

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = validateField(nameInput, nameError, 'Name is required.');
    const isEmailValid = emailInput.value.trim() && validateEmail(emailInput.value);
    const isMessageValid = validateField(messageInput, messageError, 'Message is required.');

    if (!isEmailValid) {
      showError(emailInput, emailError, emailInput.value.trim() ? 'Enter a valid email.' : 'Email is required.');
    }

    if (isNameValid && isEmailValid && isMessageValid) {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const subject = document.getElementById('contactSubject').value.trim() || 'General Inquiry';
      const message = messageInput.value.trim();

      // mailto: fallback link
      const mailtoUrl = `mailto:bookings@laraluxe.studio?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Name: " + name + "\nEmail: " + email + "\n\nMessage:\n" + message)}`;
      
      // Show Inline Success
      const statusDiv = document.createElement('div');
      statusDiv.setAttribute('role', 'alert');
      statusDiv.style.cssText = 'padding: 16px; margin-top: 20px; border-radius: 12px; background: rgba(37, 211, 102, 0.1); border: 1px solid #25D366; color: #2A052B; font-weight: 500; font-size: 14px;';
      statusDiv.innerHTML = `
        <strong>Message Prepared!</strong> If your email client did not open automatically, please 
        <a href="${mailtoUrl}" style="color: var(--purple); text-decoration: underline; font-weight: bold;">click here</a> to send.
      `;
      
      contactForm.appendChild(statusDiv);
      contactForm.reset();

      // Open mailto fallback
      window.location.href = mailtoUrl;

      setTimeout(() => statusDiv.remove(), 10000);
    }
  });
}

// ===== BOOKING LOGIC & REAL-TIME VALIDATION (booking.html) =====
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
  const clientName = document.getElementById('clientName');
  const clientPhone = document.getElementById('clientPhone');
  const clientEmail = document.getElementById('clientEmail');
  const serviceType = document.getElementById('serviceType');
  const bookingDate = document.getElementById('bookingDate');
  const bookingTime = document.getElementById('bookingTime');
  const commitmentCheck = document.getElementById('commitmentCheck');

  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const emailError = document.getElementById('emailError');
  const serviceError = document.getElementById('serviceError');
  const dateError = document.getElementById('dateError');
  const timeError = document.getElementById('timeError');
  const commitmentError = document.getElementById('commitmentError');

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  bookingDate.min = tomorrow.toISOString().split('T')[0];

  // Pre-select service from URL query parameter
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('service')) {
      const svc = decodeURIComponent(params.get('service'));
      const opt = Array.from(serviceType.options).find(o => o.value.toLowerCase() === svc.toLowerCase() || o.value === svc);
      if (opt) {
        serviceType.value = opt.value;
        setTimeout(() => { bookingForm.scrollIntoView({ behavior: 'smooth' }); }, 250);
      }
    }
  } catch (e) { /* ignore URL errors */ }

  function getBookings() {
    return JSON.parse(localStorage.getItem('laraluxe_bookings') || '[]');
  }

  function updateAvailability() {
    const selectedDate = bookingDate.value;
    if (!selectedDate) return;
    const bookings = getBookings();
    const dayBookings = bookings.filter(b => b.date === selectedDate);
    
    Array.from(bookingTime.options).forEach(opt => {
      if (opt.value) {
        opt.disabled = false;
        opt.text = opt.value;
      }
    });

    dayBookings.forEach(b => {
      const opt = Array.from(bookingTime.options).find(o => o.value === b.time);
      if (opt) {
        opt.disabled = true;
        opt.text = `${opt.value} (Booked)`;
      }
    });

    if (dayBookings.length >= 10) {
      showError(bookingDate, dateError, "Fully booked for this date.");
      bookingDate.value = '';
    } else {
      clearError(bookingDate, dateError);
    }
  }

  bookingDate.addEventListener('change', updateAvailability);

  // Real-time validations
  clientName.addEventListener('blur', () => validateField(clientName, nameError, 'Name is required.'));
  clientPhone.addEventListener('blur', () => {
    if (!clientPhone.value.trim()) {
      showError(clientPhone, phoneError, 'Phone number is required.');
    } else if (!/^0\d{9}$/.test(clientPhone.value.trim())) {
      showError(clientPhone, phoneError, 'Format must be 024XXXXXXX (10 digits starting with 0).');
    } else {
      clearError(clientPhone, phoneError);
    }
  });
  clientEmail.addEventListener('blur', () => {
    if (!clientEmail.value.trim()) {
      showError(clientEmail, emailError, 'Email is required.');
    } else if (!validateEmail(clientEmail.value)) {
      showError(clientEmail, emailError, 'Enter a valid email.');
    } else {
      clearError(clientEmail, emailError);
    }
  });
  serviceType.addEventListener('change', () => validateField(serviceType, serviceError, 'Please select a service.'));
  bookingDate.addEventListener('change', () => validateField(bookingDate, dateError, 'Please select a date.'));
  bookingTime.addEventListener('change', () => validateField(bookingTime, timeError, 'Please select a time.'));
  commitmentCheck.addEventListener('change', () => {
    if (!commitmentCheck.checked) {
      showError(commitmentCheck, commitmentError, 'You must agree to proceed.');
    } else {
      clearError(commitmentCheck, commitmentError);
    }
  });

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = validateField(clientName, nameError, 'Name is required.');
    const isPhoneValid = clientPhone.value.trim() && /^0\d{9}$/.test(clientPhone.value.trim());
    const isEmailValid = clientEmail.value.trim() && validateEmail(clientEmail.value);
    const isServiceValid = validateField(serviceType, serviceError, 'Please select a service.');
    const isDateValid = validateField(bookingDate, dateError, 'Please select a date.');
    const isTimeValid = validateField(bookingTime, timeError, 'Please select a time.');
    const isCommitmentValid = commitmentCheck.checked;

    if (!isPhoneValid && clientPhone.value.trim()) {
      showError(clientPhone, phoneError, 'Format must be 024XXXXXXX (10 digits starting with 0).');
    } else if (!isPhoneValid) {
      showError(clientPhone, phoneError, 'Phone number is required.');
    }

    if (!isEmailValid && clientEmail.value.trim()) {
      showError(clientEmail, emailError, 'Enter a valid email.');
    } else if (!isEmailValid) {
      showError(clientEmail, emailError, 'Email is required.');
    }

    if (!isCommitmentValid) {
      showError(commitmentCheck, commitmentError, 'You must agree to proceed.');
    }

    if (isNameValid && isPhoneValid && isEmailValid && isServiceValid && isDateValid && isTimeValid && isCommitmentValid) {
      const name = clientName.value.trim();
      const phone = clientPhone.value.trim();
      const email = clientEmail.value.trim();
      const service = serviceType.value;
      const date = bookingDate.value;
      const time = bookingTime.value;
      const ref = 'LL-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Store locally
      const bookings = getBookings();
      bookings.push({ date, time, service, name, email, phone, ref, created_at: new Date().toISOString() });
      localStorage.setItem('laraluxe_bookings', JSON.stringify(bookings));

      // Construct mailto link
      const mailtoUrl = `mailto:bookings@laraluxe.studio?subject=${encodeURIComponent("Booking Fallback Request: " + service)}&body=${encodeURIComponent(
        "Hello Lara LuxeStudio,\n\n" +
        "Here is my booking fallback request details:\n" +
        "- Name: " + name + "\n" +
        "- Phone: " + phone + "\n" +
        "- Email: " + email + "\n" +
        "- Service: " + service + "\n" +
        "- Date: " + date + "\n" +
        "- Time: " + time + "\n" +
        "- Temporary Ref: " + ref + "\n\n" +
        "Note: Online payment integration is pending connection."
      )}`;

      // Populate print-only receipt container (if present)
      let printContainer = document.getElementById('printReceipt');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'printReceipt';
        printContainer.className = 'print-only-receipt';
        document.body.appendChild(printContainer);
      }

      printContainer.innerHTML = `
        <div class="receipt-header">
          <h1>Lara LuxeStudio</h1>
          <p>Where Beauty Meets Luxury</p>
        </div>
        <div class="receipt-body">
          <div class="receipt-col">
            <h3>Billing Address</h3>
            <p><strong>${name}</strong></p>
            <p>${email}</p>
            <p>${phone}</p>
          </div>
          <div class="receipt-col" style="text-align: right;">
            <h3>Receipt Details</h3>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
            <p><strong>Temporary Reference:</strong> ${ref}</p>
            <p><strong>Payment Status:</strong> Pending (Mock Validation)</p>
          </div>
        </div>
        <table class="receipt-table">
          <thead>
            <tr>
              <th>Service Item</th>
              <th>Unit Price</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${service} Deposit (Placeholder)</td>
              <td>GHS 100.00</td>
              <td>1</td>
              <td>GHS 100.00</td>
            </tr>
          </tbody>
        </table>
        <div class="receipt-totals">
          <table>
            <tr class="grand-total">
              <td>Total Deposit Value:</td>
              <td style="text-align: right;">GHS 100.00</td>
            </tr>
          </table>
        </div>
        <div class="receipt-footer">
          <p>Thank you for choosing Lara LuxeStudio!</p>
          <p>Contact: +233 59 569 9259 | Location: Kisseman - Westland, Accra</p>
        </div>
      `;

      // Populate Success Modal
      document.getElementById('modalSummary').innerHTML = `
        <strong>👤 Name:</strong> ${name}<br/>
        <strong>💎 Service:</strong> ${service}<br/>
        <strong>📅 Date:</strong> ${date}<br/>
        <strong>🕐 Time:</strong> ${time}<br/>
        <strong>🧾 Ref:</strong> ${ref}<br/>
        <div style="margin-top: 10px; padding: 10px; background: rgba(107, 26, 110, 0.08); border-radius: 8px; font-size: 12px; color: var(--purple-dark);">
          ℹ️ Booking confirmed. A confirmation email will be sent once the live booking backend is connected.
        </div>
      `;

      // Show modal
      showModal();
      bookingForm.reset();
      updateAvailability();

      // Configure Modal Actions
      const closeModalBtn = document.getElementById('closeModalBtn');
      if (closeModalBtn) {
        closeModalBtn.onclick = () => {
          closeModal();
        };
      }

      const downloadBtn = document.getElementById('downloadReceiptBtn');
      if (downloadBtn) {
        // PDF Receipt Generation TODO Note placeholder & print fallback
        // TODO: Re-integrate jsPDF once real live deployment setup supports CDN dependencies.
        // Falls back to window.print() targeting our print media query.
        downloadBtn.onclick = () => {
          window.print();
        };
      }

      // Open mailto link as fallback
      window.location.href = mailtoUrl;
    }
  });
}

// ===== VALIDATION UTILITIES =====
function validateField(input, errorEl, msg) {
  if (!input.value.trim()) {
    showError(input, errorEl, msg);
    return false;
  }
  clearError(input, errorEl);
  return true;
}

function showError(input, errorEl, msg) {
  input.style.borderColor = '#ff6b8a';
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.setAttribute('role', 'alert');
  }
}

function clearError(input, errorEl) {
  input.style.borderColor = '';
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.removeAttribute('role');
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

function showModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
}
window.closeModal = closeModal;
