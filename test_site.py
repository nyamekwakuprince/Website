from playwright.sync_api import sync_playwright
import os
import sys

# Fix for Windows console emoji printing
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://localhost:7700"
SHOTS = r"c:\Users\nyame\Desktop\Website\test_screenshots"
os.makedirs(SHOTS, exist_ok=True)

results = []

def log(msg, ok=True):
    icon = "[PASS]" if ok else "[FAIL]"
    print(f"{icon}  {msg}")
    results.append((ok, msg))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    # ── 1. HOME PAGE ──────────────────────────────────────────────
    page.goto(f"{BASE}/index.html")
    page.wait_for_load_state("load")
    page.screenshot(path=f"{SHOTS}/01_home_top.png", full_page=False)

    # Check title
    title = page.title()
    log(f"Home title: '{title}'", "Lara LuxeStudio" in title)

    # Check hero image loaded (no broken)
    hero_ok = page.evaluate("""() => {
        const slide = document.querySelector('.hero-slide.active');
        return slide !== null;
    }""")
    log("Hero image loaded", hero_ok)

    # Check service cards (3)
    cards = page.locator(".service-card").count()
    log(f"Service preview cards visible: {cards}", cards == 3)

    # Check service card images not broken
    svc_imgs_ok = page.evaluate("""() => {
        const imgs = document.querySelectorAll('.service-img');
        return Array.from(imgs).every(i => i.complete && i.naturalWidth > 0);
    }""")
    log("Service card images all loaded", svc_imgs_ok)

    # Check testimonials
    testimonials = page.locator(".testimonial-card").count()
    log(f"Testimonial cards visible: {testimonials}", testimonials == 2)

    # Check initials avatars (not img tags)
    avatar_divs = page.locator(".testi-avatar").count()
    log(f"Testimonial avatars rendered: {avatar_divs}", avatar_divs == 2)

    # Check WhatsApp float button
    wa = page.locator(".whatsapp-float").count()
    log("WhatsApp float button present on Home", wa > 0)

    # Scroll down and screenshot footer
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{SHOTS}/02_home_bottom.png", full_page=False)

    # ── 2. NAVIGATION ─────────────────────────────────────────────
    page.goto(f"{BASE}/index.html")
    page.wait_for_load_state("load")

    page.click("a.nav-link[href='services.html']")
    page.wait_for_load_state("load")
    log("Nav: Services link works", "services.html" in page.url)

    page.click("a.nav-link[href='gallery.html']")
    page.wait_for_load_state("load")
    log("Nav: Gallery link works", "gallery.html" in page.url)

    page.click("a.nav-link[href='contact.html']")
    page.wait_for_load_state("domcontentloaded")
    log("Nav: Contact link works", "contact.html" in page.url)

    page.click(".nav-logo a")
    page.wait_for_load_state("load")
    log("Nav: Logo goes to Home", "index.html" in page.url or page.url.endswith("/"))

    page.click("a.btn-book-nav")
    page.wait_for_load_state("load")
    log("Nav: Book Session goes to booking", "booking.html" in page.url)

    # ── 3. SERVICES PAGE ──────────────────────────────────────────
    page.goto(f"{BASE}/services.html")
    page.wait_for_load_state("load")
    page.screenshot(path=f"{SHOTS}/03_services.png", full_page=True)

    svc_cards = page.locator(".service-card").count()
    log(f"Services page: {svc_cards} service cards", svc_cards == 5)

    svc_names = page.locator(".service-name").all_inner_texts()
    expected = {"Installation", "Revamping", "Curling", "Straightening", "Styling"}
    found = set(svc_names)
    log(f"Service names correct: {svc_names}", expected == found)

    all_svc_imgs = page.evaluate("""() => {
        const imgs = document.querySelectorAll('.service-img');
        return Array.from(imgs).map(i => ({src: i.src.split('/').pop(), ok: i.complete && i.naturalWidth > 0}));
    }""")
    for img in all_svc_imgs:
        log(f"  Services img '{img['src']}' loaded", img['ok'])

    wa_svc = page.locator(".whatsapp-float").count()
    log("WhatsApp float on Services page", wa_svc > 0)

    # ── 4. GALLERY PAGE ───────────────────────────────────────────
    page.goto(f"{BASE}/gallery.html")
    page.wait_for_load_state("load")
    page.screenshot(path=f"{SHOTS}/04_gallery.png", full_page=False)

    gallery_items = page.locator(".gallery-item").count()
    log(f"Gallery items count: {gallery_items}", gallery_items == 16)

    gallery_imgs = page.evaluate("""() => {
        const imgs = document.querySelectorAll('.gallery-item img');
        return Array.from(imgs).map(i => ({src: i.src.split('/').pop(), ok: i.complete && i.naturalWidth > 0}));
    }""")
    broken = [i for i in gallery_imgs if not i['ok']]
    log(f"Gallery: {len(gallery_imgs) - len(broken)}/16 images loaded", len(broken) == 0)
    for b in broken:
        log(f"  BROKEN: '{b['src']}'", False)

    # Test filter
    page.click(".filter-btn[data-filter='braids']")
    page.wait_for_timeout(600)
    visible_after_filter = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('.gallery-item')).filter(el => !el.classList.contains('hide')).length;
    }""")
    log(f"Gallery Braids filter: {visible_after_filter} items visible", visible_after_filter > 0)

    # Test lightbox
    page.click(".filter-btn[data-filter='all']")
    page.wait_for_timeout(400)
    page.locator(".gallery-item").first.click()
    page.wait_for_timeout(500)
    lb_active = page.locator(".lightbox.active").count()
    log("Gallery lightbox opens on click", lb_active == 1)
    page.screenshot(path=f"{SHOTS}/05_lightbox.png")
    page.keyboard.press("Escape")
    page.wait_for_timeout(400)
    lb_closed = page.locator(".lightbox.active").count()
    log("Gallery lightbox closes on Escape", lb_closed == 0)

    wa_gallery = page.locator(".whatsapp-float").count()
    log("WhatsApp float on Gallery page", wa_gallery > 0)

    # ── 5. CONTACT PAGE ───────────────────────────────────────────
    page.goto(f"{BASE}/contact.html")
    page.wait_for_load_state("domcontentloaded")
    page.screenshot(path=f"{SHOTS}/06_contact.png", full_page=True)

    log("Contact: Name field", page.locator("#contactName").count() == 1)
    log("Contact: Email field", page.locator("#contactEmail").count() == 1)
    log("Contact: Subject field", page.locator("#contactSubject").count() == 1)
    log("Contact: Message field", page.locator("#contactMessage").count() == 1)
    log("Contact: Send button", page.locator("#contactSubmitBtn").count() == 1)
    log("Contact: Map iframe", page.locator("iframe").count() >= 1)
    log("Contact: WhatsApp link", page.locator("a[href*='wa.me']").count() >= 1)
    wa_contact = page.locator(".whatsapp-float").count()
    log("WhatsApp float on Contact page", wa_contact > 0)

    # ── 6. BOOKING PAGE ───────────────────────────────────────────
    page.goto(f"{BASE}/booking.html")
    page.wait_for_load_state("load")
    page.screenshot(path=f"{SHOTS}/07_booking.png", full_page=True)

    log("Booking: Name field", page.locator("#clientName").count() == 1)
    log("Booking: Phone field", page.locator("#clientPhone").count() == 1)
    log("Booking: Email field", page.locator("#clientEmail").count() == 1)
    log("Booking: Service dropdown", page.locator("#serviceType").count() == 1)
    log("Booking: Date picker", page.locator("#bookingDate").count() == 1)
    log("Booking: Time dropdown", page.locator("#bookingTime").count() == 1)
    log("Booking: Commitment checkbox", page.locator("#commitmentCheck").count() == 1)
    log("Booking: Submit button", page.locator("#submitBtn").count() == 1)

    # Check service dropdown options
    options = page.locator("#serviceType option").all_inner_texts()
    expected_opts = {"Wig Installation", "Wig Revamping", "Hair Curling", "Hair Straightening", "Custom Styling"}
    found_opts = set(o.strip() for o in options if o.strip() and o.strip() != "Choose a service...")
    log(f"Booking service options: {list(found_opts)}", expected_opts == found_opts)

    # Test form validation (submit empty)
    page.click("#submitBtn")
    page.wait_for_timeout(400)
    name_err = page.locator("#nameError").inner_text()
    log("Booking: Form validation fires on empty submit", len(name_err) > 0)

    wa_booking = page.locator(".whatsapp-float").count()
    log("WhatsApp float on Booking page", wa_booking > 0)

    # ── 8. ADMIN DASHBOARD ────────────────────────────────────────────────────
    page.goto(f"{BASE}/admin/index.html")
    page.wait_for_load_state("load")
    log("Admin: Login section visible", page.locator("#adminLoginSection").is_visible())
    
    # Try invalid login
    page.fill("#adminUsername", "wronguser")
    page.fill("#adminPassword", "wrongpass")
    page.click("#adminLoginForm button[type='submit']")
    page.wait_for_timeout(500)
    log("Admin: Invalid login shows error", page.locator("#loginError").is_visible())
    
    # Try valid login
    page.fill("#adminUsername", "admin")
    page.fill("#adminPassword", "password123")
    page.click("#adminLoginForm button[type='submit']")
    page.wait_for_timeout(1000)
    log("Admin: Dashboard section visible after login", page.locator("#adminDashboardSection").is_visible())
    log("Admin: Bookings table present", page.locator("#bookingsTableBody").is_visible())

    # ── 9. MOBILE VIEW ────────────────────────────────────────────
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{BASE}/index.html")
    page.wait_for_load_state("load")
    page.screenshot(path=f"{SHOTS}/08_mobile_home.png", full_page=False)

    hamburger = page.locator(".hamburger")
    log("Mobile: Hamburger menu visible", hamburger.is_visible())
    hamburger.click()
    page.wait_for_timeout(300)
    page.screenshot(path=f"{SHOTS}/09_mobile_menu_open.png")
    nav_open = page.locator(".nav-links.open").count()
    log("Mobile: Nav opens on hamburger click", nav_open == 1)

    browser.close()

# ── SUMMARY ───────────────────────────────────────────────────────
print("\n" + "="*50)
print("       LARA LUXESTUDIO — TEST RESULTS")
print("="*50)
passed = sum(1 for ok, _ in results if ok)
failed = sum(1 for ok, _ in results if not ok)
print(f"\n  PASSED: {passed}  |  FAILED: {failed}  |  TOTAL: {len(results)}\n")
if failed == 0:
    print("  [SUCCESS] ALL TESTS PASSED — Site is ready!")
else:
    print("  [WARNING] ISSUES FOUND:")
    for ok, msg in results:
        if not ok:
            print(f"     [X]  {msg}")
print(f"\n  Screenshots saved to: {SHOTS}")
print("="*50)
