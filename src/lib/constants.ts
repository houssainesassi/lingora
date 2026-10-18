import type { BookingStatus, CefrLevel, LessonType } from "@/lib/types";

export const APP_NAME = "Lingora";

export const CEFR_LEVELS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const CEFR_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

export const LESSON_DURATIONS = [25, 50, 60] as const;

export const LESSON_TYPES: { value: LessonType; label: string; description: string }[] = [
  { value: "trial", label: "Trial lesson", description: "Meet the tutor and agree on goals. One per tutor." },
  { value: "conversation", label: "Conversation practice", description: "Free speaking practice with corrections." },
  { value: "structured", label: "Structured lesson", description: "Grammar, vocabulary and guided exercises." },
  { value: "exam_prep", label: "Exam preparation", description: "Focused practice for language certificates." },
  { value: "business", label: "Business language", description: "Meetings, presentations and work email." },
];

export const LESSON_TYPE_LABEL: Record<LessonType, string> = Object.fromEntries(
  LESSON_TYPES.map((t) => [t.value, t.label]),
) as Record<LessonType, string>;

export const SPECIALTIES: { value: string; label: string }[] = [
  { value: "conversation", label: "Conversation" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "beginners", label: "Beginners" },
  { value: "grammar", label: "Grammar" },
  { value: "business", label: "Business" },
  { value: "exam_prep", label: "Exam prep" },
  { value: "interview", label: "Job interviews" },
  { value: "travel", label: "Travel" },
  { value: "relocation", label: "Relocation" },
  { value: "culture", label: "Culture" },
  { value: "kids", label: "Kids & teens" },
  { value: "dialects", label: "Dialects" },
];

export const SPECIALTY_LABEL: Record<string, string> = Object.fromEntries(SPECIALTIES.map((s) => [s.value, s.label]));

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Awaiting tutor",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  rejected: "Declined",
};

export const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "fraud", label: "Fraud or scam" },
  { value: "no_show", label: "Did not show up" },
  { value: "other", label: "Something else" },
] as const;

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

// ISO 3166-1 alpha-2 codes. Names come from Intl.DisplayNames at runtime.
export const COUNTRY_CODES = [
  "AE", "AR", "AT", "AU", "BE", "BR", "CA", "CH", "CL", "CN", "CO", "CZ", "DE", "DK", "DZ", "EG", "ES", "FI", "FR",
  "GB", "GR", "HU", "IE", "IL", "IN", "IQ", "IT", "JO", "JP", "KR", "KW", "LB", "MA", "MX", "NL", "NO", "NZ", "PE",
  "PH", "PL", "PT", "QA", "RO", "RU", "SA", "SE", "SY", "TN", "TR", "UA", "US", "UY", "VE", "ZA",
] as const;

export const PAGE_SIZE = 12;
