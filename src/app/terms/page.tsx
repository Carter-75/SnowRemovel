import styles from "../page.module.css";

export const metadata = {
  title: "Terms & Conditions | Carter Moyer Snow Removal",
};

export default function TermsPage() {
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div>
            <h1 className={styles.sectionTitle}>Terms & Conditions</h1>
            <p className={styles.sectionSubtitle}>Last updated: January 31, 2026</p>
          </div>
          <div className={styles.card}>
            <h2 className="title is-5">Payment & Drive Fee Policy</h2>
            <ul className={styles.list}>
              <li>No travel fee applies when one‑way travel time is 15 minutes or less.</li>
              <li>
                When one‑way travel time exceeds 15 minutes, the travel fee is the higher of:
                (a) round‑trip time × $15/hour, or (b) one‑way miles × $1.50 per mile.
              </li>
            </ul>
            <p className="has-text-grey">
              Payment is required before dispatch. Service will not begin and no travel will occur until payment
              has been received.
            </p>
            <p className="has-text-grey">
              Snow placement: Snow will be moved onto the customer’s yard or designated area. Snow is not pushed
              into public roadways.
            </p>
            <p className="has-text-grey">
              Standard scheduling requires at least 3 business days notice. Requests inside this window are treated
              as urgent and may require an emergency waiver for immediate service.
            </p>
            <p className="has-text-grey">
              Urgency upcharge: A 10% convenience upcharge applies to all services requested to be completed
              within 3 business days of the request date.
            </p>
            <p className="has-text-grey">
              Emergency service waiver: By requesting service for an immediate emergency need (e.g., clearing
              property to prevent city fines or for safety/egress), you expressly waive your three‑day right
              to cancel this transaction to allow for immediate performance of the work.
            </p>

            <h2 className="title is-5">CUSTOMER’S RIGHT TO CANCEL</h2>
            <p className="has-text-grey">
              YOU MAY CANCEL THIS AGREEMENT BY MAILING A WRITTEN NOTICE TO CARTER MOYER SNOW REMOVAL, 401
              GILLETTE ST, LA CROSSE, WI 54603 BEFORE MIDNIGHT OF THE THIRD BUSINESS DAY AFTER YOU SIGNED THIS
              AGREEMENT. IF YOU WISH, YOU MAY USE THIS PAGE AS THAT NOTICE BY WRITING “I HEREBY CANCEL” AND
              ADDING YOUR NAME AND ADDRESS. A DUPLICATE OF THIS PAGE IS PROVIDED BY THE SELLER FOR YOUR RECORDS.
            </p>
            <p className="has-text-grey">
              Cancellation requests may also be sent by email or text as a written notice. The statutory notice
              above is provided verbatim and remains the controlling language. Email or text cancellations must be
              received before the scheduled service day. Email: cartermoyer75@gmail.com. Text: 920-904-2695.
            </p>

            <h2 className="title is-5">Provider Right to Cancel</h2>
            <p className="has-text-grey">
              Carter Moyer Snow Removal reserves the right to cancel or decline any request at any time prior
              to performing the work. If the request is cancelled by the provider before work begins, you will
              receive a full refund.
            </p>

            <p className="has-text-grey">
              This page is provided for transparency and does not constitute legal advice.
            </p>

            <h2 className="title is-5">Electronic Records & Signatures</h2>
            <p className="has-text-grey">
              By submitting a request and checking the agreement box, you consent to do business electronically
              and acknowledge that your electronic signature is legally binding.
            </p>

            <h2 className="title is-5">Record Retention</h2>
            <p className="has-text-grey">
              Records related to your request and service may be retained for up to three years.
            </p>

            <h2 className="title is-5">Copyright</h2>
            <p className="has-text-grey">
              © {new Date().getFullYear()} Carter Moyer Snow Removal. All rights reserved. Content and materials
              on this site may not be copied, reproduced, or distributed without written permission.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
