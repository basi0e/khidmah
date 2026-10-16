import type { Metadata } from "next";
import { ProsePage } from "@/components/Prose";

export const metadata: Metadata = { title: "Terms of use | Khidmah" };

export default function TermsPage() {
  return (
    <ProsePage title="Terms of use" updated="16 October 2026">
      <p>These terms apply when you use the Khidmah website. By creating an account you agree to them.</p>

      <h2>1. What Khidmah is</h2>
      <p>
        Khidmah is a marketplace that connects customers with independent service providers and landlords in Riyadh and
        Dammam. Providers are not employees or agents of Khidmah. The agreement for each job or rental is between the
        customer and the provider.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must give accurate information and keep your password private.</li>
        <li>You are responsible for activity on your account.</li>
        <li>We may suspend accounts that break these terms, give false information, or harm other users.</li>
      </ul>

      <h2>3. For customers</h2>
      <ul>
        <li>Give an accurate address, time and description of the job.</li>
        <li>Be available at the booked time, or cancel in the app while the booking is still Requested or Accepted.</li>
        <li>Pay the provider directly for the labour and parts on the bill.</li>
        <li>Reviews must be honest and about your own experience.</li>
      </ul>

      <h2>4. For providers</h2>
      <ul>
        <li>You must hold the permits, registrations and licences your work requires in Saudi Arabia.</li>
        <li>Upload genuine documents for verification. Verification is a check by Khidmah, not a guarantee of your work.</li>
        <li>Show up for jobs you accept, charge fairly, and bill clearly for labour and parts.</li>
        <li>You are responsible for your work, tools, insurance and any taxes, including VAT where it applies.</li>
      </ul>

      <h2>5. Fees</h2>
      <p>Khidmah is currently free for customers and providers. If this changes we will tell you before any fee applies.</p>

      <h2>6. Things not allowed</h2>
      <ul>
        <li>Fake bookings, fake reviews, or impersonating someone else.</li>
        <li>Harassment, abusive messages, or discrimination.</li>
        <li>Using the site for anything illegal under Saudi law.</li>
      </ul>

      <h2>7. Responsibility</h2>
      <p>
        Khidmah does not perform the services listed and is not responsible for the quality, safety or outcome of a job or
        rental. If something goes wrong, contact support and we will help both sides reach a fair outcome where we can.
      </p>

      <h2>8. Changes</h2>
      <p>We may update these terms. We will show the new date at the top of this page.</p>

      <h2>9. Contact</h2>
      <p>Email <a href="mailto:aykhidmah@gmail.com">aykhidmah@gmail.com</a> or use the contact support page.</p>
    </ProsePage>
  );
}
