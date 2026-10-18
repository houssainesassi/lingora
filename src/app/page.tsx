import { ArrowRight, CalendarCheck, Globe2, MessagesSquare, Mic, Search, ShieldCheck, Sparkles, Video } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, Card, Container } from "@/components/ui/primitives";
import { RatingSummary } from "@/components/ui/rating";
import { isSupabaseConfigured } from "@/lib/env";
import { getLanguages, parseTutorLanguages } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Language, TutorSearchRow } from "@/lib/types";
import { countryFlag, formatPrice } from "@/lib/utils";

async function loadHomeData(): Promise<{ languages: Language[]; tutors: TutorSearchRow[] }> {
  if (!isSupabaseConfigured()) return { languages: [], tutors: [] };
  try {
    const supabase = await createClient();
    const [languages, { data }] = await Promise.all([getLanguages(), supabase.rpc("search_tutors", { p_limit: 4, p_sort: "recommended" })]);
    return { languages, tutors: data ?? [] };
  } catch {
    return { languages: [], tutors: [] };
  }
}

const STEPS = [
  { icon: Search, title: "Find your tutor", text: "Filter by language, level, specialty, price and native language. Every tutor is reviewed by our team." },
  { icon: MessagesSquare, title: "Say hello", text: "Message tutors before you book to talk about your goals and your level." },
  { icon: CalendarCheck, title: "Book a time", text: "Pick a 25, 50 or 60 minute slot. Times are shown in your own time zone." },
  { icon: Video, title: "Start speaking", text: "Join the lesson in your browser with audio or video. No downloads needed." },
];

const BENEFITS = [
  { icon: Mic, title: "Speaking first", text: "Most of every lesson is spent talking, so you build fluency instead of only memorising rules." },
  { icon: Globe2, title: "Real accents and culture", text: "Learn the expressions people actually use from native speakers and experienced teachers." },
  { icon: Sparkles, title: "Lessons that fit you", text: "From A1 to C2, travel to job interviews: tutors adapt to your level and goals." },
  { icon: ShieldCheck, title: "Honest reviews", text: "Ratings can only come from students who completed a lesson with that tutor." },
];

export default async function HomePage() {
  const { languages, tutors } = await loadHomeData();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary-soft/70 via-background to-background">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-accent/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-40 size-[24rem] rounded-full bg-primary/15 blur-3xl" />
        <Container className="relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Badge tone="primary" className="mb-5">
              English · German · French · Italian · Spanish · Arabic · Portuguese
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Speak a new language through <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">real conversations</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Meet tutors and native speakers for one-to-one lessons. Practise pronunciation, build fluency and gain the confidence to speak.
            </p>
            <form action="/tutors" method="get" className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row">
              <label htmlFor="hero-language" className="sr-only">
                Language you want to learn
              </label>
              <select id="hero-language" name="teaches" defaultValue="" className="h-12 flex-1 rounded-xl bg-transparent px-3 text-base focus-visible:outline-2">
                <option value="">What do you want to learn?</option>
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-medium text-primary-foreground hover:bg-primary-hover">
                <Search className="size-4" aria-hidden="true" /> Find tutors
              </button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              Free to join.{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Create an account
              </Link>{" "}
              to message and book.
            </p>
          </div>

          <div className="relative hidden lg:block" aria-hidden="true">
            <Card className="rotate-2 p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-accent-soft font-semibold text-accent">¡H</div>
                <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2 text-sm">¿Qué tal tu fin de semana?</div>
              </div>
              <div className="mt-3 flex justify-end">
                <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2 text-sm text-white">¡Muy bien! Fui a la playa con mis amigos.</div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-accent-soft font-semibold text-accent">¡H</div>
                <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2 text-sm">¡Perfecto! Your past tense is spot on.</div>
              </div>
            </Card>
            <Card className="absolute -bottom-10 -left-8 -rotate-3 p-4 shadow-lg">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Video className="size-4 text-primary" /> Lesson starts in 5 min
              </p>
              <p className="mt-1 text-xs text-muted-foreground">50 min · Conversation practice</p>
            </Card>
          </div>
        </Container>
      </section>

      {/* Popular languages */}
      <section aria-labelledby="languages-heading" className="py-16">
        <Container>
          <h2 id="languages-heading" className="text-2xl font-semibold tracking-tight">
            Popular languages
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {(languages.length ? languages : FALLBACK_LANGUAGES).map((l) => (
              <li key={l.code}>
                <Link href={`/tutors?teaches=${l.code}`} className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <span className="text-lg font-semibold">{l.name}</span>
                  <span className="text-sm text-muted-foreground" lang={l.code}>
                    {l.native_name}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Find tutors <ArrowRight className="size-3 transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Featured tutors */}
      <section aria-labelledby="featured-heading" className="border-y border-border bg-card py-16">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight">
                Meet some of our tutors
              </h2>
              <p className="mt-1 text-muted-foreground">Approved tutors, loaded live from the marketplace.</p>
            </div>
            <ButtonLink href="/tutors" variant="secondary">
              Browse all tutors <ArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>
          {tutors.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
              No tutors are listed yet.{" "}
              <Link href="/become-a-tutor" className="text-primary underline">
                Be the first to teach
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tutors.map((t) => {
                const teaches = parseTutorLanguages(t.languages).filter((l) => l.teaches);
                return (
                  <li key={t.id}>
                    <Link href={`/tutors/${t.id}`} className="flex h-full flex-col rounded-2xl border border-border bg-background p-5 transition hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <Avatar src={t.avatar_url} name={t.full_name} size={56} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{t.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {countryFlag(t.country)} {teaches.map((l) => l.name).join(", ")}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-2 flex-1 text-sm">{t.headline}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <RatingSummary rating={t.avg_rating} count={t.review_count} className="text-xs" />
                        <span className="text-sm font-semibold">{formatPrice(t.hourly_rate_cents, t.currency)}/h</span>
                      </div>
                      {t.is_demo ? <Badge tone="warning" className="mt-3 self-start">Demo profile</Badge> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="py-16">
        <Container>
          <h2 id="how-heading" className="text-2xl font-semibold tracking-tight">
            How Lingora works
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <s.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Benefits */}
      <section aria-labelledby="benefits-heading" className="bg-foreground py-16 text-background">
        <Container>
          <h2 id="benefits-heading" className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Why learn with tutors and native speakers?
          </h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <li key={b.title}>
                <b.icon className="size-6 text-accent" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm text-background/70">{b.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Become a tutor */}
      <section aria-labelledby="teach-heading" className="py-16">
        <Container>
          <Card className="grid items-center gap-8 overflow-hidden bg-gradient-to-br from-accent-soft to-primary-soft p-8 md:grid-cols-[1.4fr_1fr] md:p-12">
            <div>
              <h2 id="teach-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Share your language. Teach on Lingora.
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Set your own rate and weekly schedule, choose lesson lengths, and teach students from around the world from your browser.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
              <ButtonLink href="/signup?role=tutor" size="lg">
                Apply to teach
              </ButtonLink>
              <ButtonLink href="/become-a-tutor" size="lg" variant="secondary">
                Learn more
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="pb-20">
        <Container className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready for your first conversation?</h2>
          <p className="mt-2 text-muted-foreground">Create a free account, find a tutor you like and book a lesson in minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <ButtonLink href="/signup" size="lg">
              Get started
            </ButtonLink>
            <ButtonLink href="/tutors" size="lg" variant="secondary">
              Explore tutors
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}

const FALLBACK_LANGUAGES = [
  { code: "en", name: "English", native_name: "English" },
  { code: "de", name: "German", native_name: "Deutsch" },
  { code: "fr", name: "French", native_name: "Français" },
  { code: "it", name: "Italian", native_name: "Italiano" },
  { code: "es", name: "Spanish", native_name: "Español" },
  { code: "ar", name: "Arabic", native_name: "العربية" },
  { code: "pt", name: "Portuguese", native_name: "Português" },
];
