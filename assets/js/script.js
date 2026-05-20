// ===== CONFIGURATION =====
// ⚠️  PAYSTACK KEY — TEST MODE (safe for client review & demo)
// This site is currently configured for Paystack sandbox mode only.
const PAYSTACK_PUBLIC_KEY = 'pk_test_6868ab90def4b6831714a147c2074b011f1231fa'; // 👈 keep this for testing

// EmailJS is disabled because this site is using the backend Resend email flow.
// Email confirmations are handled through /api/send-email on the Flask server.

// ===== HERO IMAGE SLIDER =====
(function() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.slider-dots .dot');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current] && dots[current].classList.remove('active');
    // Reset Ken Burns so it replays when this slide becomes active again
    slides[current].style.animation = 'none';
    current = (index + slides.length) % slides.length;
    // Force reflow so animation restarts
    slides[current].style.animation = '';
    slides[current].classList.add('active');
    dots[current] && dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  // Dot click — manual navigation
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.slide));
      startAuto(); // restart timer on manual click
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

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    const open = navLinks.classList.contains('open');
    spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
    spans[1].style.opacity = open ? '0' : '1';
    spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
    // Make X clearly visible against the dark dropdown on all pages
    spans.forEach(s => s.style.background = open ? '#ffffff' : '');
  });
}

// ===== SCROLL REVEAL =====
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 50);
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.05 });
reveals.forEach(el => revealObserver.observe(el));

// ===== BOOKING LOGIC (Only on booking.html) =====
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
  const dateInput = document.getElementById('bookingDate');
  const timeSelect = document.getElementById('bookingTime');
  const serviceSelect = document.getElementById('serviceType');

  // Set min date to today
  const today = new Date();
  dateInput.min = today.toISOString().split('T')[0];

  // Prefill service if provided in URL query params (e.g. ?service=Installation)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('service')) {
      const svc = decodeURIComponent(params.get('service'));
      const opt = Array.from(serviceSelect.options).find(o => o.value.toLowerCase() === svc.toLowerCase() || o.value === svc);
      if (opt) {
        serviceSelect.value = opt.value;
        setTimeout(() => { bookingForm.scrollIntoView({ behavior: 'smooth' }); }, 250);
      }
    }
  } catch (e) { /* ignore malformed URLs */ }

  function getBookings() {
    return JSON.parse(localStorage.getItem('laraluxe_bookings') || '[]');
  }

  function updateAvailability() {
    const selectedDate = dateInput.value;
    if (!selectedDate) return;
    const bookings = getBookings();
    const dayBookings = bookings.filter(b => b.date === selectedDate);
    Array.from(timeSelect.options).forEach(opt => {
      if (opt.value) { opt.disabled = false; opt.text = opt.value; }
    });
    dayBookings.forEach(b => {
      const opt = Array.from(timeSelect.options).find(o => o.value === b.time);
      if (opt) { opt.disabled = true; opt.text = `${opt.value} (Booked)`; }
    });
    if (dayBookings.length >= 10) { alert("Fully booked for this date."); dateInput.value = ''; }
  }
  
  dateInput.addEventListener('change', updateAvailability);

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [
      { id: 'clientName', errId: 'nameError', msg: 'Name required.' },
      { id: 'clientEmail', errId: 'emailError', msg: 'Email required.' },
      { id: 'clientPhone', errId: 'phoneError', msg: 'Phone required.' },
      { id: 'serviceType', errId: 'serviceError', msg: 'Select service.' },
      { id: 'bookingDate', errId: 'dateError', msg: 'Select date.' },
      { id: 'bookingTime', errId: 'timeError', msg: 'Select time.' },
      { id: 'commitmentCheck', errId: 'commitmentError', msg: 'Agreement required.', type: 'checkbox' }
    ];
    if (!validateForm(fields)) return;

    const btn = document.getElementById('submitBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    if (typeof PaystackPop === 'undefined') {
      alert("Payment system is still loading. Please refresh.");
      btn.classList.remove('loading');
      btn.disabled = false;
      return;
    }

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: document.getElementById('clientEmail').value,
      amount: 10000,
      currency: 'GHS',
      callback: function(response) {
        handlePostPaymentSubmission(response.reference);
      },
      onClose: function() {
        alert('Payment cancelled.');
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    });
    handler.openIframe();
  });
}

async function handlePostPaymentSubmission(paymentRef) {
  const btn = document.getElementById('submitBtn');
  
  try {
    const name = document.getElementById('clientName').value.trim();
    const service = document.getElementById('serviceType').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const email = document.getElementById('clientEmail').value.trim();

    // 1. Generate jsPDF Receipt immediately
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Receipt styling and branding
    doc.setFontSize(22);
    doc.setTextColor(107, 26, 110); // var(--purple)
    doc.text("Lara LuxeStudio", 20, 30);
    
    doc.setFontSize(16);
    doc.setTextColor(42, 5, 43);
    doc.text("Booking Receipt", 20, 45);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 20, 55);
    doc.text(`Reference: ${paymentRef}`, 20, 62);
    
    doc.line(20, 70, 190, 70); // horizontal line
    
    doc.setTextColor(0, 0, 0);
    doc.text(`Client Name: ${name}`, 20, 85);
    doc.text(`Service: ${service}`, 20, 95);
    doc.text(`Appointment Date: ${date}`, 20, 105);
    doc.text(`Appointment Time: ${time}`, 20, 115);
    doc.text(`Amount Paid (Deposit): GHC 100.00`, 20, 125);
    
    doc.line(20, 135, 190, 135);
    doc.setFontSize(10);
    doc.text("Thank you for booking with Lara LuxeStudio!", 20, 145);
    doc.text("Please note: The deposit is non-refundable.", 20, 152);
    
    // Save PDF as Blob
    const pdfBlob = doc.output('blob');

    // 2. Send Email Confirmation with PDF to Client via Resend Backend Server
    const formData = new FormData(bookingForm);
    formData.append('receipt_attachment', pdfBlob, `LaraLuxe_Receipt_${paymentRef}.pdf`);

    fetch('/api/send-email', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => console.log("Email confirmation successfully sent via Resend API!", data))
    .catch(err => console.log("Resend backend skipped/failed (server not running or email failed):", err));

    // Save to local storage for availability logic
    const bookings = getBookings();
    bookings.push({ date, time, service, name, email, ref: paymentRef });
    localStorage.setItem('laraluxe_bookings', JSON.stringify(bookings));

    // Populate Success Modal Summary
    document.getElementById('modalSummary').innerHTML = `
      <strong>👤 Name:</strong> ${name}<br/>
      <strong>💎 Service:</strong> ${service}<br/>
      <strong>📅 Date:</strong> ${date}<br/>
      <strong>🕐 Time:</strong> ${time}<br/>
      <strong>🧾 Ref:</strong> ${paymentRef}
    `;

    // Show modal and reset booking form
    showModal();
    bookingForm.reset();
    updateAvailability(); // Refresh available times

    // Enable direct download of PDF from the modal button
    const downloadBtn = document.getElementById('downloadReceiptBtn');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        doc.save(`LaraLuxe_Receipt_${paymentRef}.pdf`);
      };
    }

  } catch (error) {
    alert("An error occurred while processing the booking.");
  } finally {
    if (btn) {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }
}

function validateForm(fields) {
  let valid = true;
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    const err = document.getElementById(f.errId);
    if (!el) return;
    const isInvalid = f.type === 'checkbox' ? !el.checked : !el.value.trim();
    if (isInvalid) {
      if (err) err.textContent = f.msg;
      if (f.type !== 'checkbox') el.style.borderColor = '#ff6b8a';
      valid = false;
    } else {
      if (err) err.textContent = '';
      if (f.type !== 'checkbox') el.style.borderColor = '';
    }
  });
  return valid;
}

// ===== CONTACT FORM LOGIC =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = [
      { id: 'contactName', errId: 'contactNameError', msg: 'Name is required.' },
      { id: 'contactEmail', errId: 'contactEmailError', msg: 'Email is required.' },
      { id: 'contactMessage', errId: 'contactMessageError', msg: 'Message is required.' }
    ];

    if (!validateForm(fields)) return;

    const btn = document.getElementById('contactSubmitBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        alert("Message sent successfully! We will get back to you soon.");
        contactForm.reset();
      } else {
        alert("Oops! There was a problem sending your message.");
      }
    } catch (error) {
      alert("Error submitting the form. Please try again.");
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}


function showModal() { document.getElementById('successModal').classList.add('active'); }
function closeModal() { document.getElementById('successModal').classList.remove('active'); }
window.closeModal = closeModal;

// ===== GALLERY FILTERS =====
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

if (filterBtns.length > 0 && galleryItems.length > 0) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      const filterValue = btn.getAttribute('data-filter');
      
      galleryItems.forEach(item => {
        if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
          item.classList.remove('hide');
          setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'scale(1)'; }, 50);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.8)';
          setTimeout(() => { item.classList.add('hide'); }, 400); // Wait for transition
        }
      });
    });
  });
}

// ===== GALLERY LIGHTBOX =====
function openLightbox(index) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const currentItems = document.querySelectorAll('.gallery-item');
  
  if (currentItems[index]) {
    const img = currentItems[index].querySelector('img');
    const title = currentItems[index].querySelector('.gallery-item-title').innerText;
    
    lightboxImg.src = img.src;
    lightboxCaption.innerText = title;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; 
  }
}
window.openLightbox = openLightbox;

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if(lightbox) lightbox.classList.remove('active');
  document.body.style.overflow = 'auto'; 
}
window.closeLightbox = closeLightbox;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

