import { CalendarRange, CheckCircle2, Globe2, Wallet } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export const metadata = { title: "Become a tutor" };

const POINTS = [
  { icon: Wallet, title: "Set your own rate", text: "Choose an hourly price. Lesson prices for 25, 50 and 60 minutes are calculated from it." },
  { icon: CalendarRange, title: "Your schedule", text: "Set weekly hours in your time zone and block time off whenever you need." },
  { icon: Globe2, title: "Students worldwide", text: "Students see your availability converted into their own time zone." },
];

const STEPS = ["Create a tutor account", "Complete your profile, languages and availability", "Submit your profile for review", "Get approved and start accepting lesson requests"];

export default function BecomeTutorPage() {
  return (
    <Container className="py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Teach your language on Lingora</h1>
        <p className="mt-3 text-lg text-muted-foreground">Help learners speak with confidence through real conversations, one lesson at a time.</p>
        <div className="mt-6 flex gap-2">
          <ButtonLink href="/signup?role=tutor" size="lg">
            Apply to teach
          </ButtonLink>
          <ButtonLink href="/faq" size="lg" variant="secondary">
            Read the FAQ
          </ButtonLink>
        </div>
      </div>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {POINTS.map((p) => (
          <li key={p.title} className="rounded-2xl border border-border bg-card p-6">
            <p.icon className="size-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-semibold">{p.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-12 text-xl font-semibold">How to get started</h2>
      <ol className="mt-4 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            <span>
              <span className="sr-only">Step {i + 1}: </span>
              {s}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-muted-foreground">Online payouts are not available yet. Payment features will be added when a payment provider is connected.</p>
    </Container>
  );
}
