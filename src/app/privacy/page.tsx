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
              This website collects only the information you submit through the quote form, such as your name,
              email (optional), address, and details about the service you need. I use that information solely
              to respond to your request and schedule snow removal service.
            </p>
            <ul className={styles.list}>
              <li>I do not sell your information.</li>
              <li>I do not share your information with third parties except for email delivery.</li>
              <li>I store quote requests in my email inbox to follow up with you.</li>
              <li>You can request deletion of your information by emailing me.</li>
            </ul>
            <p className="has-text-grey">
              If you have any questions, contact me at cartermoyer75@gmail.com.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
