import Link from "next/link";

import { ContentPage } from "@/components/content-page";

export const metadata = { title: "FAQ" };

const FAQ = [
  { q: "How do I book a lesson?", a: "Open a tutor’s profile, choose the lesson type, duration and a free time, then send the request. The tutor confirms or declines it and you get a notification either way." },
  { q: "Which time zone are lesson times in?", a: "Times are always shown in the time zone from your account settings. Tutors set their weekly hours in their own time zone and we convert them for you." },
  { q: "How do I pay?", a: "Online payments are not available yet, so nothing is charged when you book. Every booking stores its price so payments can be added later." },
  { q: "Can I cancel a lesson?", a: "Pending requests can be cancelled any time. Confirmed lessons can be cancelled by students up to 24 hours before the start. After that, you can propose a new time or message your tutor." },
  { q: "How do video lessons work?", a: "Lessons run in your browser. The lesson room opens 10 minutes before the start time for confirmed lessons. You can join with video or audio only. Lessons are never recorded." },
  { q: "Are reviews real?", a: "Only students who completed a lesson with a tutor can review them, once per lesson. Profiles marked “Demo profile” are sample data without reviews." },
  { q: "How do I become a tutor?", a: "Sign up as a tutor, complete your profile, add the languages you teach and submit it for review. An administrator approves profiles before they appear in search." },
];

export default function FaqPage() {
  return (
    <ContentPage title="Frequently asked questions">
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQ.map((f) => (
          <details key={f.q} className="group px-5 py-4">
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {f.q}
                <span aria-hidden="true" className="text-muted-foreground transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2">{f.a}</p>
          </details>
        ))}
      </div>
      <p>
        Still have a question?{" "}
        <Link href="/contact" className="text-primary underline">
          Contact us
        </Link>
        .
      </p>
    </ContentPage>
  );
}
