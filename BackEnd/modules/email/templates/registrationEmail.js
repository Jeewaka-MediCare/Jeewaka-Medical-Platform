export const registrationEmail = (name, role) => {
  const roleText = role === "doctor" ? "Doctor" : "Patient";

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Registration Confirmation</title>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background-color: #f6f9fc;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        background: #ffffff;
        margin: 40px auto;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #4e73df, #1cc88a);
        color: white;
        text-align: center;
        padding: 30px 20px;
      }
      .header h1 {
        margin: 0;
        font-size: 26px;
      }
      .content {
        padding: 30px;
        color: #333;
        line-height: 1.6;
      }
      .content h2 {
        color: #1cc88a;
        font-size: 22px;
      }
      .button {
        display: inline-block;
        margin-top: 25px;
        padding: 12px 24px;
        background-color: #4e73df;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        transition: background 0.3s;
      }
      .button:hover {
        background-color: #375ac3;
      }
      .footer {
        text-align: center;
        font-size: 13px;
        color: #777;
        padding: 15px;
        background: #f1f3f6;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to Our Health Platform!</h1>
      </div>
      <div class="content">
        <h2>Dear ${name},</h2>
        <p>🎉 Congratulations on successfully registering as a <strong>${roleText}</strong>!</p>
        <p>We’re thrilled to have you join our growing community. You can now access your personalized dashboard, manage appointments, and explore our services designed especially for you.</p>
        <p>Click below to get started:</p>  
        <p>Thank you for being part of our mission to make healthcare smarter and more accessible.</p>
        <p>Warm regards,<br><strong>The HealthCare Team</strong></p>
      </div>
      <div class="footer">
        © Jeewaka ${new Date().getFullYear()} HealthCare Platform. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};
