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

// ===== HAMBURGER & FOCUS TRAPPING FOR MOBILE MENU =====nconst hamburger = document.getElementById('hamburger');
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

// ===== SCROLL REVEAL =====nconst reveals = document.querySelectorAll('.reveal');
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

// ===== GALLERY FILTERS =====nconst filterBtns = document.querySelectorAll('.filter-btn');
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

// ===== GALLERY LIGHTBOX WITH ACCESSIBILITY =====nconst lightbox = document.getElementById('lightbox');
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

// ===== CONTACT FORM VALIDATION & MAILTO FALLBACK =====nconst contactForm = document.getElementById('contactForm');
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

// ===== BOOKING LOGIC & REAL-TIME VALIDATION (booking.html) =====nconst bookingForm = document.getElementById('bookingForm');
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

*** End Patch