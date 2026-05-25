import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import resend
from dotenv import load_dotenv

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app) # Enable CORS for development ease

# Load .env file automatically if present
load_dotenv()

# Configure Resend API Key
resend.api_key = os.environ.get('RESEND_API_KEY')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/send-email', methods=['POST'])
def send_email():
    try:
        # 1. Parse booking details from FormData
        client_name = request.form.get('clientName', 'Valued Customer')
        client_email = request.form.get('clientEmail')
        service_type = request.form.get('serviceType', 'Hair Styling Session')
        booking_date = request.form.get('bookingDate', '')
        booking_time = request.form.get('bookingTime', '')
        
        if not client_email:
            return jsonify({'success': False, 'message': 'Client email is required'}), 400

        # 2. Get the uploaded PDF receipt file
        pdf_file = request.files.get('receipt_attachment')
        attachments = []
        
        if pdf_file:
            pdf_content = pdf_file.read()
            attachments.append({
                'filename': pdf_file.filename or 'LaraLuxe_Receipt.pdf',
                'content': list(pdf_content) # Resend Python SDK accepts bytes/list
            })

        # 3. Create a beautiful HTML body for the email confirmation
        html_content = f"""
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0e0f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-family: 'Playfair Display', serif; color: #6b1a6e; margin: 0;">Lara LuxeStudio</h1>
                <p style="font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Where Beauty Meets Luxury</p>
            </div>
            
            <h2 style="color: #2a052b; font-size: 20px; border-bottom: 1px solid #f0e0f0; padding-bottom: 10px; margin-bottom: 20px;">Booking Confirmed! 🎉</h2>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">Dear {client_name},</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">Thank you for reserving a session with Lara LuxeStudio. Your booking and deposit have been successfully confirmed. Please find your appointment details below and your official PDF receipt attached to this email.</p>
            
            <div style="background-color: #fcf6fc; border: 1px solid #f0e0f0; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <table style="width: 100%; font-size: 14px; color: #333; border-collapse: collapse;">
                    <tr style="height: 35px;">
                        <td style="font-weight: 600; width: 120px;">👤 Customer:</td>
                        <td>{client_name}</td>
                    </tr>
                    <tr style="height: 35px;">
                        <td style="font-weight: 600;">💎 Service:</td>
                        <td>{service_type}</td>
                    </tr>
                    <tr style="height: 35px;">
                        <td style="font-weight: 600;">📅 Date:</td>
                        <td>{booking_date}</td>
                    </tr>
                    <tr style="height: 35px;">
                        <td style="font-weight: 600;">🕐 Time:</td>
                        <td>{booking_time}</td>
                    </tr>
                    <tr style="height: 35px;">
                        <td style="font-weight: 600;">💳 Paid Deposit:</td>
                        <td style="color: #6b1a6e; font-weight: 600;">GHC 100.00</td>
                    </tr>
                </table>
            </div>
            
            <p style="font-size: 14px; color: #888; line-height: 1.6; font-style: italic; margin-top: 30px;">Important Note: All deposits are non-refundable. If you need to reschedule, please contact us at least 24 hours prior to your slot.</p>
            
            <div style="text-align: center; border-top: 1px solid #f0e0f0; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #aaa;">
                <p>&copy; 2026 Lara LuxeStudio. All rights reserved.</p>
                <p>Contact: +233 59 569 9259 | Location: Accra, Ghana</p>
            </div>
        </div>
        """

        # 4. Trigger Resend API call
        # Note: Resend requires domain verification to send from custom domains (like bookings@laraluxe.studio).
        # We use Resend's default sender 'onboarding@resend.dev' for immediate testing.
        # Once the client verifies their domain 'laraluxe.studio' in the Resend dashboard, change this to:
        # "Lara LuxeStudio <bookings@laraluxe.studio>"
        params = {
            "from": "Lara LuxeStudio <onboarding@resend.dev>",
            "to": [client_email],
            "subject": "Booking Confirmation & Deposit Receipt — Lara LuxeStudio",
            "html": html_content
        }

        if attachments:
            params["attachments"] = attachments

        email_response = resend.Emails.send(params)
        return jsonify({'success': True, 'data': email_response}), 200

    except Exception as e:
        print("Resend Error:", e)
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Default to port 7700 to match the user's dev environment setup
    app.run(host='0.0.0.0', port=7700, debug=True)
