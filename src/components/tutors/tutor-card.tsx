import { CalendarPlus } from "lucide-react";
import Link from "next/link";

import { FavoriteButton } from "@/components/tutors/favorite-button";
import { MessageButton } from "@/components/tutors/message-button";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, Card } from "@/components/ui/primitives";
import { RatingSummary } from "@/components/ui/rating";
import { SPECIALTY_LABEL } from "@/lib/constants";
import { parseTutorLanguages } from "@/lib/data";
import type { TutorSearchRow } from "@/lib/types";
import { countryFlag, countryName, formatPrice } from "@/lib/utils";

export function TutorCard({ tutor, isFavorite, viewerId }: { tutor: TutorSearchRow; isFavorite: boolean; viewerId: string | null }) {
  const languages = parseTutorLanguages(tutor.languages);
  const teaches = languages.filter((l) => l.teaches);
  const native = languages.filter((l) => l.is_native);
  const isSelf = viewerId === tutor.id;
  const href = `/tutors/${tutor.id}`;

  return (
    <Card className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-md sm:flex-row">
      <div className="flex shrink-0 items-start gap-4 sm:flex-col sm:items-center">
        <Avatar src={tutor.avatar_url} name={tutor.full_name} size={88} />
        <div className="sm:text-center">
          <p className="text-lg font-semibold sm:text-base">{formatPrice(tutor.hourly_rate_cents, tutor.currency)}</p>
          <p className="text-xs text-muted-foreground">per hour</p>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">
              <Link href={href} className="hover:underline">
                {tutor.full_name}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground">
              {tutor.country ? (
                <>
                  <span aria-hidden="true">{countryFlag(tutor.country)} </span>
                  {countryName(tutor.country)}
                </>
              ) : (
                "Location not shared"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tutor.is_demo ? <Badge tone="warning">Demo profile</Badge> : null}
            <RatingSummary rating={tutor.avg_rating} count={tutor.review_count} />
          </div>
        </div>

        <p className="mt-2 font-medium">{tutor.headline}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tutor.about}</p>

        <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="inline text-muted-foreground">Teaches: </dt>
            <dd className="inline font-medium">{teaches.map((l) => l.name).join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="inline text-muted-foreground">Native: </dt>
            <dd className="inline font-medium">{native.map((l) => l.name).join(", ") || "Not a native speaker"}</dd>
          </div>
        </dl>

        {tutor.specialties.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Specialties">
            {tutor.specialties.slice(0, 5).map((s) => (
              <li key={s}>
                <Badge>{SPECIALTY_LABEL[s] ?? s}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={href} variant="secondary" size="md">
            View profile
          </ButtonLink>
          {!isSelf ? (
            <>
              <MessageButton userId={tutor.id} returnTo={href} disabledReason={tutor.is_demo ? "Demo profiles cannot be messaged" : undefined} />
              {tutor.is_demo ? (
                <span className="inline-flex h-10 items-center rounded-xl px-3 text-xs text-muted-foreground">Booking disabled for demo</span>
              ) : (
                <ButtonLink href={`${href}#book`}>
                  <CalendarPlus aria-hidden="true" /> Book a lesson
                </ButtonLink>
              )}
              <FavoriteButton tutorId={tutor.id} tutorName={tutor.full_name} initial={isFavorite} />
            </>
          ) : (
            <Badge tone="primary" className="self-center">
              This is you
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
