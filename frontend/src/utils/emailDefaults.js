// Built-in bodies and subjects for the transactional email templates —
// mirrors backend email_service defaults. Shared by the email templates page
// and the broadcast section's template editor (which seeds its editor and
// rendered preview from these when no custom override exists).
export const DEFAULT_BODIES = {
  welcome:
`<h1>Welcome to MintSlip! 🎉</h1>
<p>Hi {user_name},</p>
<p>Thank you for creating an account with MintSlip. We're excited to have you on board!</p>
<p>With MintSlip, you can generate professional documents in seconds:</p>
<ul style="color: #374151; line-height: 2;">
    <li>✅ Pay Stubs &amp; Canadian Pay Stubs</li>
    <li>✅ W-2 Forms &amp; 1099 Forms</li>
    <li>✅ AI-Powered Resumes</li>
    <li>✅ And much more!</li>
</ul>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/user/dashboard" class="button">Go to Dashboard</a>
</p>
<p class="text-muted">If you have any questions, reach us through the support chat at mintslip.com. We're here to help!</p>`,

  email_verification:
`<h1>Verify Your Email Address</h1>
<p>Hi {user_name},</p>
<p>Please verify your email address to complete your registration and unlock all features.</p>
<div class="highlight" style="text-align: center;">
    <p style="margin: 0; font-size: 14px; color: #6b7280;">Your verification code:</p>
    <p style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 4px; margin: 10px 0;">{verification_code}</p>
</div>
<p style="text-align: center; margin: 20px 0;">Or click the button below:</p>
<p style="text-align: center;">
    <a href="{verification_link}" class="button">Verify Email</a>
</p>
<p class="text-muted" style="font-size: 12px;">This code expires in 24 hours. If you didn't create an account, please ignore this email.</p>`,

  getting_started:
`<h1>Getting Started with MintSlip 🚀</h1>
<p>Hi {user_name},</p>
<p>Now that you've created your account, here's how to make the most of MintSlip:</p>
<div class="highlight" style="margin: 20px 0;">
    <h3 style="margin-top: 0; color: #059669;">Step 1: Choose Your Document</h3>
    <p style="margin-bottom: 0;">Browse our collection of professional document generators - from pay stubs to tax forms.</p>
</div>
<div class="highlight" style="margin: 20px 0;">
    <h3 style="margin-top: 0; color: #059669;">Step 2: Fill in the Details</h3>
    <p style="margin-bottom: 0;">Enter your information using our easy-to-use forms. Preview before you download!</p>
</div>
<div class="highlight" style="margin: 20px 0;">
    <h3 style="margin-top: 0; color: #059669;">Step 3: Download Instantly</h3>
    <p style="margin-bottom: 0;">Get your professional PDF document immediately. It's that simple!</p>
</div>
<h3>💡 Pro Tips:</h3>
<ul style="color: #374151; line-height: 2;">
    <li><strong>Subscribe &amp; Save:</strong> Get unlimited downloads with our business subscription plan</li>
    <li><strong>Save Your Documents:</strong> Registered users can save documents for 30 days</li>
</ul>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/generators" class="button">Start Creating Documents</a>
</p>`,

  subscription_thank_you:
`<h1>Thank You for Subscribing! 🎉</h1>
<p>Hi {user_name},</p>
<p>Welcome to the <strong>{plan_name}</strong> plan! Your subscription is now active.</p>
<div class="highlight">
    <h3 style="margin-top: 0;">Your Plan Details:</h3>
    <table style="width: 100%; color: #374151;">
        <tr>
            <td style="padding: 8px 0;"><strong>Plan:</strong></td>
            <td style="padding: 8px 0;">{plan_name}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0;"><strong>Price:</strong></td>
            <td style="padding: 8px 0;">\${plan_price}/month</td>
        </tr>
        <tr>
            <td style="padding: 8px 0;"><strong>Downloads:</strong></td>
            <td style="padding: 8px 0;">{downloads_per_month} per month</td>
        </tr>
    </table>
</div>
<h3>What's Included:</h3>
<ul style="color: #374151; line-height: 2;">
    <li>✅ {downloads_per_month} document downloads per month</li>
    <li>✅ All document types included</li>
    <li>✅ Priority support</li>
    <li>✅ Save documents for 30 days</li>
</ul>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/user/dashboard" class="button">Go to Dashboard</a>
</p>
<p class="text-muted">Need help? Reply to this email and we'll get back to you within 24 hours.</p>`,

  download_confirmation:
`<h1>Your Document is Ready! 📄</h1>
<p>Hi {user_name},</p>
<p>Great news! Your <strong>{doc_name}</strong> has been successfully generated and is ready for download.</p>
<div class="highlight">
    <p style="margin: 0;"><strong>Document:</strong> {doc_name}</p>
</div>
<p>Your document should have downloaded automatically. If not, you can access it from your <a href="{SITE_URL}/user/downloads" style="color: #10b981;">Downloads page</a>.</p>
<p class="text-muted">Need to make changes? You can generate a new document anytime from your dashboard.</p>`,

  signup_no_purchase:
`<h1>Still Thinking It Over? 🤔</h1>
<p>Hi {user_name},</p>
<p>We noticed you created a MintSlip account but haven't generated any documents yet.</p>
<p>Need professional documents? We've got you covered:</p>
<div class="highlight">
    <h3 style="margin-top: 0;">Why Choose MintSlip?</h3>
    <ul style="margin-bottom: 0; color: #374151; line-height: 2;">
        <li>⚡ Generate documents in under 2 minutes</li>
        <li>📄 Professional, print-ready PDFs</li>
        <li>🔒 Secure and confidential</li>
        <li>💰 Affordable pricing starting at $9.99</li>
    </ul>
</div>
<h3>Popular Documents:</h3>
<ul style="color: #374151; line-height: 2;">
    <li>💼 Pay Stubs - Perfect for proof of income</li>
    <li>📋 W-2 &amp; 1099 Forms - Tax season essentials</li>
    <li>📝 AI Resumes - Stand out from the crowd</li>
</ul>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/generators" class="button">Browse Documents</a>
</p>
<p class="text-muted">Have questions? Reach us through the support chat at mintslip.com - we're happy to help!</p>`,

  abandoned_checkout:
`<h1>Did Something Go Wrong? 🛒</h1>
<p>Hi {user_name},</p>
<p>We noticed you started creating a <strong>{doc_name}</strong> but didn't complete your purchase.</p>
<p>No worries - your progress might still be saved! You can pick up right where you left off.</p>
<div class="highlight">
    <p style="margin: 0;"><strong>Your document:</strong> {doc_name}</p>
</div>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}" class="button">Complete Your Purchase</a>
</p>
<h3>Need Help?</h3>
<p>If you encountered any issues during checkout, please let us know. Common solutions:</p>
<ul style="color: #374151; line-height: 2;">
    <li>Try a different payment method</li>
    <li>Clear your browser cache and try again</li>
    <li>Contact us for assistance</li>
</ul>
<p class="text-muted">Reach us through the support chat at mintslip.com if you need any help!</p>`,

  review_request:
`<h1>How Did We Do? ⭐</h1>
<p>Hi {user_name},</p>
<p>Thank you for using MintSlip to create your <strong>{doc_name}</strong>!</p>
<p>We'd love to hear about your experience. Your feedback helps us improve and helps others discover MintSlip.</p>
<div class="highlight" style="text-align: center;">
    <p style="margin: 0 0 15px 0;">Would you take 30 seconds to leave us a review?</p>
    <a href="{TRUSTPILOT_URL}" class="button" style="background-color: #00b67a;">Leave a Review on Trustpilot ⭐</a>
</div>
<p style="margin-top: 30px;">Your review makes a real difference:</p>
<ul style="color: #374151; line-height: 2;">
    <li>⭐ Helps other customers find us</li>
    <li>💡 Gives us feedback to improve</li>
    <li>🙏 Shows your support for small businesses</li>
</ul>
<p class="text-muted">Thank you for being a valued customer!</p>`,

  password_changed:
`<h1>Password Changed Successfully 🔐</h1>
<p>Hi {user_name},</p>
<p>Your MintSlip password has been successfully changed.</p>
<p><strong>Didn't make this change?</strong></p>
<p>If you didn't change your password, please take these steps immediately:</p>
<ol style="color: #374151; line-height: 2;">
    <li>Reset your password using the "Forgot Password" link</li>
    <li>Contact us at support@mintslip.com</li>
</ol>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/login" class="button">Go to Login</a>
</p>
<p class="text-muted">This is an automated security notification.</p>`,

  password_reset:
`<h1>Reset Your Password 🔐</h1>
<p>Hi {user_name},</p>
<p>We received a request to reset your MintSlip password. Click the button below to create a new password:</p>
<p style="text-align: center; margin: 30px 0;">
    <a href="{reset_link}" class="button">Reset Password</a>
</p>
<p>Or use this code on the reset page:</p>
<div class="highlight" style="text-align: center;">
    <p style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 4px; margin: 10px 0;">{reset_code}</p>
</div>
<p class="text-muted" style="margin-top: 30px;"><strong>Didn't request this?</strong></p>
<p class="text-muted">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
<p class="text-muted" style="font-size: 12px;">This link expires in 1 hour for security reasons.</p>`,
};

export const DEFAULT_SUBJECTS = {
  welcome: "Welcome to MintSlip! 🎉",
  email_verification: "Verify your email address - MintSlip",
  getting_started: "Getting Started with MintSlip - Quick Guide",
  subscription_thank_you: "Welcome to {plan_name}! Your MintSlip subscription is active",
  download_confirmation: "Your {doc_name} is Ready - MintSlip",
  signup_no_purchase: "Your MintSlip documents are waiting for you",
  abandoned_checkout: "Complete your {doc_name} purchase - MintSlip",
  review_request: "How was your MintSlip experience? ⭐",
  password_changed: "Your password has been changed - MintSlip",
  password_reset: "Reset your password - MintSlip",
};
