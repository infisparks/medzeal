// src/app/api/send-email/route.js
import nodemailer from 'nodemailer';

const senderEmail = "mudassirs472@gmail.com"; // Replace with your email
const senderPassword = "jpdx dtbt fvbm gtwf"; // Replace with your password

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: senderEmail,
        pass: senderPassword,
    },
    tls: {
        rejectUnauthorized: false,
    },
});
export async function POST(req) {
    try {
        const { recipientEmail, appointmentDate, appointmentTime, doctor, name } = await req.json(); // Ensure name is being received properly

        console.log('Sending email to:', recipientEmail);
        console.log('Name:', name); // Log the name to verify it's being received correctly

        // Create the HTML email content
        const mailOptions = {
            from: senderEmail,
            to: recipientEmail,
            subject: 'Appointment Approved',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 8px; max-width: 600px; margin: auto;">
                    <div style="text-align: center;">
                        <img src="https://www.medzeal.in/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fmedzeal.c464cc2f.png" alt="MedZeal Logo" style="width: 150px; height: auto;" />
                        <h1 style="color: #2c3e50;">Appointment Confirmation</h1>
                    </div>
                    <p>Dear ${name || ' Customer'},</p> <!-- Default to 'Valued Customer' if name is not provided -->
                    <p>We are pleased to inform you that your appointment has been approved.</p>
                    <p><strong>Appointment Details:</strong></p>
                    <ul>
                        <li><strong>Date:</strong> ${appointmentDate}</li>
                        <li><strong>Time:</strong> ${appointmentTime}</li>
                        <li><strong>Doctor:</strong> Dr. ${doctor}</li>
                    </ul>
                    <p>If you have any questions or need further assistance, feel free to contact us.</p>
                    <p>Thank you for choosing <strong>MedZeal</strong>!</p>
                    <p>Best regards,<br/>The MedZeal Team</p>
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} MedZeal. All rights reserved.</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return new Response(JSON.stringify({ message: 'Email sent successfully!' }), { status: 200 });
    } catch (error) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: 'Error sending email.', details: error.message }), { status: 500 });
    }
}
