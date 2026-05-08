import AppLayout from "@/components/AppLayout";
import { IonContent, IonPage, IonIcon } from "@ionic/react";
import {
  documentTextOutline, alertCircleOutline, scaleOutline,
  cardOutline, refreshOutline, banOutline, mailOutline,
} from "ionicons/icons";

const TERMS_SECTIONS = [
  {
    icon: documentTextOutline,
    title: "Acceptance of Terms",
    content: `By accessing and using MintSlip's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.

• These terms constitute a legally binding agreement between you and MintSlip.
• If you do not agree to these terms, please do not use our services.
• We reserve the right to update these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.
• You must be at least 18 years old to use our services.`,
  },
  {
    icon: alertCircleOutline,
    title: "Service Description",
    content: `MintSlip provides online document generation services including:

• **Pay Stub Generator**: Create professional pay stubs for employees and contractors.
• **Accounting Mockups Generator**: Generate detailed accounting mockups statements.
• **W-2 Form Generator**: Create W-2 tax forms with accurate calculations.

All documents are generated directly in your browser. We do not store your personal or financial information on our servers.`,
  },
  {
    icon: scaleOutline,
    title: "Acceptable Use",
    content: `You agree to use MintSlip's services only for lawful purposes. Specifically, you agree NOT to:

• Use our services for any fraudulent, illegal, or deceptive purposes.
• Create documents containing false or misleading information.
• Use generated documents to misrepresent your income, employment status, or financial situation.
• Attempt to circumvent any security features of our platform.
• Use our services in any way that could harm MintSlip or other users.

**Important**: Documents generated through MintSlip should only be used for legitimate purposes. You are solely responsible for the accuracy of information you enter and how you use the generated documents.`,
  },
  {
    icon: cardOutline,
    title: "Payment Terms",
    content: `Our payment terms are as follows:

• **Pricing**: Pay stubs are $10 each, accounting mockups are $50-$70, and W-2 forms are $15 each.
• **Payment Processing**: All payments are processed securely through PayPal.
• **Immediate Delivery**: Documents are generated and available for download immediately upon successful payment.
• **Currency**: All prices are in US Dollars (USD).
• **No Hidden Fees**: The price shown is the total price you pay.`,
  },
  {
    icon: refreshOutline,
    title: "Refund Policy",
    content: `Due to the digital nature of our products:

• **General Policy**: We do not offer refunds for completed document generations, as the service is delivered immediately upon payment.
• **Exceptions**: If you experience technical issues that prevent you from downloading your document, please contact us within 24 hours of purchase.
• **Duplicate Purchases**: If you accidentally made a duplicate purchase, contact us with your transaction details for review.
• **Quality Issues**: If there's a genuine error in our calculations or document generation, we will work with you to resolve the issue.

To request assistance, contact us at support@mintslip.com with your PayPal transaction ID.`,
  },
  {
    icon: banOutline,
    title: "Limitation of Liability",
    content: `To the fullest extent permitted by law:

• MintSlip provides services "as is" without warranties of any kind.
• We are not liable for any indirect, incidental, or consequential damages arising from your use of our services.
• We are not responsible for how you use the documents generated through our platform.
• Our total liability is limited to the amount you paid for the specific service in question.
• We do not guarantee that our services will be uninterrupted or error-free.

You agree to use our services at your own risk and to verify all information in generated documents.`,
  },
  {
    icon: mailOutline,
    title: "Contact Information",
    content: `For questions about these Terms of Service or our services:

• **Email**: support@mintslip.com
• **Response Time**: Within 24 hours
• **Support Hours**: 24/7 email support

We are committed to addressing your concerns promptly and professionally.`,
  },
];

function renderContent(text) {
  return text.split("\n\n").map((paragraph, pIndex) => (
    <p key={pIndex} style={{ color: "var(--ion-color-medium)", lineHeight: 1.7, marginBottom: 12, whiteSpace: "pre-line" }}>
      {paragraph.split("**").map((part, i) =>
        i % 2 === 1 ? <strong key={i} style={{ color: "var(--ion-text-color)" }}>{part}</strong> : part
      )}
    </p>
  ));
}

export default function AppTerms() {
  return (
    <AppLayout>
      <IonPage>
        <IonContent>
          <div style={{ padding: "16px 16px 40px" }}>
            <div style={{
              background: "var(--ion-card-background)",
              borderRadius: 12,
              padding: "28px 28px 32px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
              maxWidth: 780,
              margin: "0 auto",
            }}>
              <h1 style={{ color: "var(--ion-text-color)", fontSize: "1.6rem", fontWeight: 700, marginTop: 0, marginBottom: 4 }}>
                Terms of Service
              </h1>
              <p style={{ color: "var(--ion-color-medium)", fontSize: "0.85rem", marginBottom: 24 }}>
                Last updated: January 2025
              </p>
              <p style={{ color: "var(--ion-color-medium)", lineHeight: 1.7, marginBottom: 32 }}>
                Welcome to MintSlip. These Terms of Service ("Terms") govern your use of our website and document
                generation services. By using our services, you agree to comply with and be bound by these Terms.
                Please review them carefully before using our platform.
              </p>

              {TERMS_SECTIONS.map((section, index) => (
                <div key={index}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
                    <div style={{
                      flexShrink: 0,
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "var(--ion-color-step-100)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <IonIcon icon={section.icon} style={{ fontSize: "1.3rem", color: "var(--ion-color-primary)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ color: "var(--ion-text-color)", fontSize: "1.1rem", fontWeight: 600, marginTop: 0, marginBottom: 10 }}>
                        {section.title}
                      </h2>
                      {renderContent(section.content)}
                    </div>
                  </div>
                  {index < TERMS_SECTIONS.length - 1 && (
                    <div style={{ borderBottom: "1px solid var(--app-divider)", marginBottom: 24 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </IonContent>
      </IonPage>
    </AppLayout>
  );
}
