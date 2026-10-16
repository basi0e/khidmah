import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/Prose";

export const metadata: Metadata = { title: "About | Khidmah" };

export default function AboutPage() {
  return (
    <ProsePage title="About Khidmah">
      <p>
        Khidmah means service. We connect people in Riyadh and Dammam with technicians, companies and landlords for the
        everyday jobs that keep a home running: a dripping AC in August, a blocked drain, a tripping breaker, or a room to rent.
      </p>
      <h2>How it works</h2>
      <p>
        You choose a service, compare providers who cover your district, and book a time. The provider accepts, comes to you,
        and adds a bill for labour and parts when the job is done. You pay them directly.
      </p>
      <h2>Free for everyone</h2>
      <p>
        We don&apos;t charge customers a booking fee and we don&apos;t take a commission from providers. We&apos;re starting
        small with a pilot in Riyadh and Dammam.
      </p>
      <h2>Trust</h2>
      <p>
        Providers send us their ID and, for companies, their commercial registration. Once we&apos;ve checked them they show as
        verified. Customers rate every completed job, so you can see how others found them.
      </p>
      <p>
        Questions? Visit <Link href="/support">contact support</Link> or email{" "}
        <a href="mailto:aykhidmah@gmail.com">aykhidmah@gmail.com</a>.
      </p>
    </ProsePage>
  );
}
