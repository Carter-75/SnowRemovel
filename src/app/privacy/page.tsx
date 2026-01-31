import styles from "../page.module.css";

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
            <p className="has-text-grey">
              This website collects the information you submit through the quote form, including your name,
              email (optional), address, timeframe, and service details. This information is used solely to
              provide quotes, schedule snow removal, and communicate with you.
            </p>
            <ul className={styles.list}>
              <li>I do not sell your information.</li>
              <li>I share information only with service providers needed to operate the website (e.g., hosting, email delivery, payments).</li>
              <li>Quote requests are stored in my email inbox for follow‑up and record keeping.</li>
              <li>You can request deletion of your information by emailing me.</li>
            </ul>
            <p className="has-text-grey">
              By using this site, you consent to doing business electronically and to the use of electronic
              records and signatures as allowed by Wisconsin Stat. 137.11.
            </p>
            <p className="has-text-grey">
              If you have any questions, contact me at cartermoyer75@gmail.com.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
