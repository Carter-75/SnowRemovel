import styles from "../page.module.css";
import { BUSINESS_ADDRESS, BUSINESS_EMAIL, BUSINESS_PHONE } from "@/lib/constants";

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
            <h2 className="title is-5">Property Access Consent</h2>
            <p className="has-text-grey">
              By purchasing this service, you explicitly grant Carter Moyer Snow Removal permission to enter
              your property at the address provided to perform snow removal services. You represent and warrant
              that you have full authority to grant such permission and that you will ensure reasonable access
              to the property is available at the scheduled service time.
            </p>
            <p className="has-text-grey">
              If you are not the property owner, you confirm that you have obtained permission from the property
              owner to authorize snow removal services and property access.
            </p>

            <h2 className="title is-5">Liability Waiver & Insurance Disclosure</h2>
            <p className="has-text-grey">
              <strong>Insurance Status:</strong> Carter Moyer Snow Removal currently operates without commercial
              general liability insurance or professional liability coverage. By booking this service, you
              acknowledge this disclosure.
            </p>
            <p className="has-text-grey">
              <strong>Assumption of Risk:</strong> Customer acknowledges and accepts that snow removal involves
              inherent risks including but not limited to: damage from hidden obstacles under snow cover, damage
              to landscaping or property features not visible due to snow accumulation, damage to underground
              utilities or irrigation systems, and property damage from snow placement.
            </p>
            <p className="has-text-grey">
              <strong>Limitation of Liability:</strong> Provider's liability for any property damage is limited
              to the amount paid for the service. Provider is not liable for pre-existing damage, damage from
              hidden obstacles, or damage resulting from conditions beyond the provider's reasonable control.
            </p>
            <p className="has-text-grey">
              <strong>Customer Responsibilities:</strong> Customer is responsible for marking or disclosing any
              hidden obstacles, decorations, irrigation systems, or sensitive areas before service. Failure to
              disclose such hazards releases Provider from liability for related damage.
            </p>

            <h2 className="title is-5">Indemnification</h2>
            <p className="has-text-grey">
              Customer agrees to indemnify, defend, and hold harmless Carter Moyer Snow Removal from any and all
              claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees)
              arising from or related to: (a) injuries to persons or damage to property occurring on customer's
              premises during or as a result of the service, except where caused by Provider's gross negligence
              or willful misconduct; (b) any breach of customer's representations regarding authority to grant
              property access; (c) customer's failure to disclose known hazards or obstacles.
            </p>

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
            <p className="has-text-grey">
              Access policy: If we arrive and are unable to access the property after reasonable attempts to
              contact you by text, phone, and email, and the one‑way travel time exceeds 30 minutes, the
              service will be treated as completed and payment is non‑refundable.
            </p>

            <h2 className="title is-5">CUSTOMER’S RIGHT TO CANCEL</h2>
            <p className="has-text-grey">
              YOU MAY CANCEL THIS AGREEMENT BY MAILING A WRITTEN NOTICE TO CARTER MOYER SNOW REMOVAL, {BUSINESS_ADDRESS} BEFORE MIDNIGHT OF THE THIRD BUSINESS DAY AFTER YOU SIGNED THIS
              AGREEMENT. IF YOU WISH, YOU MAY USE THIS PAGE AS THAT NOTICE BY WRITING "I HEREBY CANCEL" AND
              ADDING YOUR NAME AND ADDRESS. A DUPLICATE OF THIS PAGE IS PROVIDED BY THE SELLER FOR YOUR RECORDS.
            </p>
            <p className="has-text-grey">
              Cancellation requests may also be sent by email or text as a written notice. The statutory notice
              above is provided verbatim and remains the controlling language. Email or text cancellations must be
              received before the scheduled service day. Email: {BUSINESS_EMAIL}. Text: {BUSINESS_PHONE}.
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
