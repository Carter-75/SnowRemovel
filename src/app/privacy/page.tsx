import styles from "../page.module.css";
import { BUSINESS_EMAIL } from "@/lib/constants";

export const metadata = {
  title: "Privacy Policy | Carter Moyer Snow Removal",
};

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div>
            <h1 className={styles.sectionTitle}>Privacy Policy</h1>
            <p className={styles.sectionSubtitle}>Last updated: January 31, 2026</p>
          </div>
          <div className={styles.card}>
            <h2 className="title is-5">Information We Collect</h2>
            <p className="has-text-grey">
              This website collects the information you submit through the quote form, including your name,
              email (optional), address, timeframe, and service details. This information is used solely to
              provide quotes, schedule snow removal, and communicate with you.
            </p>
            
            <h2 className="title is-5">Address Storage for Discount Tracking</h2>
            <p className="has-text-grey">
              When you request a price estimate, your address is stored in our database (Vercel KV/Upstash) to
              track discount eligibility and prevent duplicate estimates. This storage only occurs after you
              provide explicit consent via checkbox before clicking "Estimate price."
            </p>
            <p className="has-text-grey">
              <strong>What is stored:</strong> Your property address (normalized), a timestamp, and discount
              expiration status.
            </p>
            <p className="has-text-grey">
              <strong>How long it's stored:</strong> Address data related to discount tracking is retained for
              up to 10 minutes of active discount eligibility. Historical address data may be retained for up
              to three years for business records and dispute resolution.
            </p>
            <p className="has-text-grey">
              <strong>Why we store it:</strong> To ensure fair discount application and prevent system abuse.
            </p>

            <h2 className="title is-5">Payment Information Storage</h2>
            <p className="has-text-grey">
              When you complete a payment through Stripe, transaction details including your address and service
              details are stored in Stripe's secure systems and our financial records database. This is required
              for tax compliance, customer service, and legal record-keeping.
            </p>

            <h2 className="title is-5">How We Use Your Information</h2>
            <ul className={styles.list}>
              <li>To provide quotes and schedule snow removal services</li>
              <li>To process payments and maintain financial records</li>
              <li>To communicate with you about your service request</li>
              <li>To prevent fraud and discount abuse</li>
              <li>To comply with tax and legal obligations</li>
            </ul>

            <h2 className="title is-5">Information Sharing</h2>
            <h2 className="title is-5">Information Sharing</h2>
            <ul className={styles.list}>
              <li>I do not sell your information.</li>
              <li>I share information only with service providers needed to operate the website (e.g., hosting, email delivery, payments).</li>
              <li>Quote requests are stored in my email inbox for follow‑up and record keeping.</li>
            </ul>

            <h2 className="title is-5">Your Rights - Data Deletion & Access</h2>
            <p className="has-text-grey">
              You have the right to request deletion of your information stored in our systems. To exercise this
              right, email {BUSINESS_EMAIL} with "Data Deletion Request" in the subject line and include
              your address or email used for service requests.
            </p>
            <p className="has-text-grey">
              <strong>What will be deleted:</strong> Address from discount tracking database, quote history, and
              contact information.
            </p>
            <p className="has-text-grey">
              <strong>What cannot be deleted:</strong> Financial transaction records required for tax compliance
              (retained for 3 years per IRS requirements), and records related to active legal disputes.
            </p>
            <p className="has-text-grey">
              Deletion requests will be processed within 30 days. You can request deletion of your information by emailing me.
            </p>

            <h2 className="title is-5">Electronic Records & Consent</h2>
            <p className="has-text-grey">
              By using this site, you consent to doing business electronically and to the use of electronic
              records and signatures as allowed by Wisconsin Stat. 137.11.
            </p>
            <p className="has-text-grey">
              If you have any questions, contact me at {BUSINESS_EMAIL}.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
