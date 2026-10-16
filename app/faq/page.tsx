import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/Prose";

export const metadata: Metadata = { title: "FAQ | Khidmah" };

const QA: [string, React.ReactNode][] = [
  ["Does Khidmah cost anything?", "No. There are no booking fees for customers and no commission for providers. You pay the provider directly for the job."],
  ["How do I pay?", "After the job, the provider adds a bill with labour and parts. You pay them directly by cash, mada card, Apple Pay or STC Pay, whichever you chose when booking."],
  ["What does \"verified\" mean?", "A verified provider has sent us their ID and, for companies, their commercial registration, and we have checked them. Providers waiting for review are marked as pending."],
  ["Can I cancel a booking?", "Yes, while it is still Requested or Accepted. Open My bookings and tap Cancel booking. Once the provider is on the way, contact them through the booking messages or contact support."],
  ["How do I talk to my provider?", "Open the booking from My bookings and use Messages. Once the provider accepts, you also see their phone number."],
  ["Which areas do you cover?", "Riyadh and Dammam, including Al Khobar Al Shamalia. Each provider lists the districts they cover."],
  ["I'm a technician. How do I join?", <>Create an account, choose Offer my services, and fill in your services, prices and districts. Then upload your documents in <Link href="/settings">Settings</Link> so we can verify you.</>],
  ["Something went wrong with a job.", <>Tell us on the <Link href="/support">contact support</Link> page and pick the booking. We reply within a day.</>],
  ["I forgot my password.", <>On the <Link href="/login">log in</Link> page, enter your email and tap Forgot password. We&apos;ll email you a link to set a new one.</>],
];

export default function FaqPage() {
  return (
    <ProsePage title="Questions and answers">
      {QA.map(([q, a]) => (
        <section key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </section>
      ))}
    </ProsePage>
  );
}
