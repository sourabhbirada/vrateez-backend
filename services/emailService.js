const nodemailer = require("nodemailer");

// Brevo SMTP via nodemailer; uses provided host/port/user/pass
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Log SMTP connection status at startup to surface auth/port issues early
transporter
  .verify()
  .then(() => console.log("SMTP transporter verified successfully"))
  .catch((err) => console.error("SMTP verify failed:", err.message));

const sendEmail = async (to, subject, text, html) => {
  try {
    console.log(`Attempting to send email to ${to} via SMTP...`);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId || info);
  } catch (error) {
    console.log("Email send error:", error);
    throw new Error("Email could not be sent");
  }
};

const sendOTPEmail = async (to, otp) => {
  const subject = "Verification OTP - Vrateez";
  const text = `Your OTP for verification is: ${otp}. It will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #333;">Verification Code</h2>
      <p>Use the following OTP to complete your verification at Vrateez:</p>
      <h1 style="color: #4CAF50; letter-spacing: 5px; text-align: center;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} Vrateez. All rights reserved.</p>
    </div>
  `;
  await sendEmail(to, subject, text, html);
};

module.exports = { sendEmail, sendOTPEmail };
