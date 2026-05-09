import AppLayout from "@/components/AppLayout";
import { IonContent, IonPage, IonIcon } from "@ionic/react";
import {
  shieldOutline, lockClosedOutline, eyeOutline,
  documentTextOutline, peopleOutline, mailOutline,
} from "ionicons/icons";

const PRIVACY_SECTIONS = [
  {
    icon: documentTextOutline,
    title: "Information We Collect",
    content: `When you use MintSlip, we may collect certain information to provide our services effectively:

• **Personal Information**: Name, email address, and contact details when you create an account or reach out to our support team.
• **Document Data**: Information you enter into our document generators (pay stubs, accounting mockups, W-2 forms, etc). This data is processed in your browser and is NOT stored on our servers unless you choose to save your documents.
• **PDF Downloads**: If you opt to save your generated documents, we may store your download history to allow you to re-access your files.
• **Payment Information**: Payment details are processed securely through Stripe. We do not store your credit card or bank account information on our servers.
• **Usage Data**: General analytics about how you interact with our website to improve our services.`,
  },
  {
    icon: lockClosedOutline,
    title: "How We Use Your Information",
    content: `We use the information we collect for the following purposes:

• **Service Delivery**: To generate the documents you request and process your payments.
• **Document Storage**: If you choose to save your documents, we store them securely for your future access.
• **Customer Support**: To respond to your inquiries and provide assistance.
• **Service Improvement**: To understand how users interact with our platform and make improvements.
• **Communication**: To send important updates about our services (only when necessary).

We do NOT sell, rent, or share your personal information with third parties for marketing purposes.`,
  },
  {
    icon: shieldOutline,
    title: "Data Security",
    content: `We take the security of your information seriously:

• **Browser-Based Processing**: All document generation happens directly in your browser. Your sensitive data (wages, SSN, etc.) is never transmitted to or stored on our servers unless you explicitly choose to save your documents.
• **Secure Payments**: All payment transactions are processed through Stripe's secure payment system with industry-standard encryption.
• **SSL Encryption**: Our website uses SSL encryption to protect data transmission.
• **Optional Data Retention**: We only retain copies of documents if you choose to save them. Otherwise, once downloaded, the data exists only on your device.`,
  },
  {
    icon: eyeOutline,
    title: "Your Privacy Rights",
    content: `You have the following rights regarding your personal information:

• **Access**: You can request information about what personal data we have about you.
• **Correction**: You can request corrections to any inaccurate information.
• **Deletion**: You can request deletion of your personal information and saved documents from our systems.
• **Opt-Out**: You can opt out of any marketing communications at any time.

To exercise any of these rights, please contact us at support@mintslip.com.`,
  },
  {
    icon: peopleOutline,
    title: "Third-Party Services",
    content: `We use the following third-party services:

• **Stripe**: For secure payment processing. Stripe's privacy policy governs how they handle your payment information.
• **Analytics**: We may use analytics services to understand website usage patterns. These services collect anonymized data only.

We carefully select our partners and require them to maintain appropriate security measures.`,
  },
  {
    icon: mailOutline,
    title: "Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

• **Email**: support@mintslip.com
• **Response Time**: We typically respond within 24 hours

We are committed to resolving any privacy concerns promptly and transparently.`,
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

export default function AppPrivacy() {
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
              maxWidth: 1200,
              margin: "0 auto",
            }}>
              <h1 style={{ color: "var(--ion-text-color)", fontSize: "1.6rem", fontWeight: 700, marginTop: 0, marginBottom: 4 }}>
                Privacy Policy
              </h1>
              <p style={{ color: "var(--ion-color-medium)", fontSize: "0.85rem", marginBottom: 24 }}>
                Last updated: January 2025
              </p>
              <p style={{ color: "var(--ion-color-medium)", lineHeight: 1.7, marginBottom: 32 }}>
                At MintSlip, we are committed to protecting your privacy and ensuring the security of your personal
                information. This Privacy Policy describes how we collect, use, and safeguard your data when you use
                our document generation services. By using our services, you agree to the practices described in this policy.
              </p>

              {PRIVACY_SECTIONS.map((section, index) => (
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
                  {index < PRIVACY_SECTIONS.length - 1 && (
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
