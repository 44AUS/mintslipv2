// Mirror of backend email_service.get_base_template so admin previews show
// exactly what recipients receive: the whodat-style frame in MintSlip emerald.
// Shared by the email templates page and the broadcast section's template
// editor modal.
export const BASE_PREVIEW_STYLES = `
  body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}
  .button{display:inline-block;box-sizing:border-box;padding:14px 30px;background-color:#059669;background-image:linear-gradient(135deg,#10b981,#059669 60%,#047857);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(5,150,105,0.32);}
  .highlight{background-color:#ecfdf5;padding:16px;border-radius:10px;border-left:4px solid #059669;}
  h1{color:#0f172a;margin:0 0 12px;font-size:22px;font-weight:800;letter-spacing:-0.01em;}
  h2{color:#0f172a;margin:0 0 12px;font-size:19px;font-weight:700;}
  p{color:#334155;line-height:1.65;font-size:15px;}
  ul{color:#334155;line-height:1.8;font-size:15px;}
  a{color:#059669;}
  .text-muted{color:#64748b;}
`;

export function buildPreviewHtml(htmlBody) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_PREVIEW_STYLES}</style></head><body style="margin:0;padding:0;background:#ecfdf5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;"><tr><td align="center" style="padding:36px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
      <tr><td style="background-color:#059669;background-image:linear-gradient(135deg,#10b981 0%,#059669 55%,#047857 100%);padding:28px 32px;text-align:center;">
        <span style="display:inline-block;background:#fff;border-radius:12px;padding:10px 18px;"><img src="/mintslip-logo.png" alt="MintSlip" style="height:30px;width:auto;display:block;" /></span>
      </td></tr>
      <tr><td style="padding:36px 32px 34px;color:#0f172a;">${htmlBody}</td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="padding:20px 12px 0;text-align:center;color:#94a3b8;font-size:12px;line-height:1.6;">
      © ${new Date().getFullYear()} MintSlip · You're receiving this because you have a MintSlip account.<br><a href="#" style="color:#94a3b8;text-decoration:underline;">mintslip.com</a>
    </td></tr></table>
  </td></tr></table>
  </body></html>`;
}

// Sample values for {placeholder} tokens so previews read like a real email.
const SAMPLE_VARS = {
  user_name: "Jane Doe",
  user_email: "jane@example.com",
  doc_name: "Pay Stub",
  plan_name: "Professional",
  plan_price: "19.99",
  downloads_per_month: "30",
  verification_code: "482913",
  verification_link: "https://mintslip.com/verify",
  reset_link: "https://mintslip.com/reset",
  reset_code: "915262",
  code: "SAVE20",
  discount_percent: "20",
  custom_message: "Thanks for being with us — enjoy this one!",
  expiry_date: "September 30th, 2026",
  admin_name: "MintSlip Support",
  message_text: "Thanks for reaching out — happy to help!",
  guest_name: "Jane Doe",
  guest_email: "jane@example.com",
  reason: "General Question",
  file_names: "paystub-jane-doe.pdf",
  SITE_URL: "https://mintslip.com",
  TRUSTPILOT_URL: "https://www.trustpilot.com/review/mintslip.com",
};

export function fillSampleVars(html) {
  return String(html || "").replace(/\{([A-Za-z_]+)\}/g, (m, key) =>
    SAMPLE_VARS[key] !== undefined ? SAMPLE_VARS[key] : m
  );
}
