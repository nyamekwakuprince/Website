# Lara LuxeStudio Website

## Overview
This project is a static multipage site for Lara LuxeStudio with a Flask backend to handle booking confirmation emails via Resend.

## Current Phase 3 Status
- Booking flow uses Paystack **test mode** only.
- Email confirmations are sent through `/api/send-email` using the Resend API.
- EmailJS has been removed from the booking flow.
- The booking form no longer sends directly to Formspree.
- Contact form still uses Formspree for simple message delivery.

## Files of Note
- `index.html`, `services.html`, `gallery.html`, `contact.html`, `booking.html`
- `assets/css/styles.css`
- `assets/js/script.js`
- `server.py`
- `.env.example`
- `.gitignore`
- `requirements.txt`

## Local Setup
1. Create your Python environment and activate it.
2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Copy the environment template:

```powershell
copy .env.example .env
```

4. Add your Resend API key to `.env`:

```text
RESEND_API_KEY=your_resend_api_key_here
```

5. Run the server:

```powershell
python server.py
```

6. Open the site in your browser:

```text
http://localhost:7700
```

## Booking Flow
1. The customer fills the booking form.
2. Paystack opens for a GHC 100 test deposit.
3. After payment approval, a PDF receipt is generated in the browser.
4. The receipt is sent as an attachment to the backend `/api/send-email` endpoint.
5. The backend sends the confirmation email through Resend.

## Notes
- The backend uses `onboarding@resend.dev` as the sender for testing.
- When the client verifies their domain in Resend, update the `from` value in `server.py`.
- Paystack is intentionally configured for test mode with `pk_test_...`.

## Next Steps
- Add a live Paystack public key once the client account is ready.
- Confirm Resend email delivery by testing the booking flow end-to-end.
- Optional: add a real booking persistence layer if needed.

## Optional Tests
- The repository includes `test_site.py` for automated Playwright smoke tests.
- If you want to run this, install the Playwright browser dependencies and run:

```powershell
python -m playwright install chromium
python test_site.py
```
