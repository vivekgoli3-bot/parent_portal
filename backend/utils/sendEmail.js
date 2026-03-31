import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOTP = async (email, otp) => {
  try {
    console.log("📧 Sending OTP to:", email);

    const msg = {
      to: email,
      from: process.env.EMAIL_USER, // must be verified in SendGrid
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`
    };

    await sgMail.send(msg);

    console.log("✅ Email sent successfully");

  } catch (error) {
    console.error("❌ SENDGRID ERROR:", error.response?.body || error);
    throw error;
  }
};