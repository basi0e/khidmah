import type { Metadata } from "next";
import { ProsePage } from "@/components/Prose";

export const metadata: Metadata = { title: "Privacy policy | Khidmah" };

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy policy" updated="16 October 2026">
      <p>
        This explains what personal data Khidmah collects, why, and your rights. We aim to follow Saudi Arabia&apos;s
        Personal Data Protection Law (PDPL).
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> email, password (stored encrypted), name, city and account type.</li>
        <li><strong>Bookings:</strong> service, district, address, visit time, notes, phone number, payment method, bills and status history.</li>
        <li><strong>Messages and reviews</strong> you send in the app.</li>
        <li><strong>Saved addresses and saved providers</strong>, if you add them.</li>
        <li><strong>Providers:</strong> services, prices, districts, working hours, contact phone and verification documents.</li>
      </ul>
      <p>We don&apos;t collect card numbers. Payment happens directly between you and the provider.</p>

      <h2>Why we use it</h2>
      <ul>
        <li>To run your account and bookings, and show the right providers in your area.</li>
        <li>To let customers and providers contact each other about a booking.</li>
        <li>To verify providers and keep the marketplace safe.</li>
        <li>To answer support requests.</li>
      </ul>

      <h2>Who can see it</h2>
      <ul>
        <li>Your provider or customer sees what they need for the job, such as your name, address and booking details. Phone numbers are shared only after a booking is accepted.</li>
        <li>Your public profile (providers only) shows your name, services, prices, areas and reviews.</li>
        <li>Verification documents are seen only by Khidmah admins.</li>
        <li>We don&apos;t sell your data or share it for advertising.</li>
      </ul>

      <h2>Where it&apos;s stored</h2>
      <p>
        Data is stored with our database provider, Supabase, in their Singapore data centre, and the website is hosted by
        Vercel. Both protect data in transit and at rest.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your data while your account is open. Booking records may be kept after that where needed for disputes or
        legal reasons.
      </p>

      <h2>Your rights</h2>
      <p>
        You can see and correct most of your data in Settings. You can also ask us for a copy of your data, to correct it,
        or to delete your account by emailing <a href="mailto:aykhidmah@gmail.com">aykhidmah@gmail.com</a>.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy we will update the date at the top of this page.</p>
    </ProsePage>
  );
}
