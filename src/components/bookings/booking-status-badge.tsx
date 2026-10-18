import { Badge } from "@/components/ui/primitives";
import { BOOKING_STATUS_LABEL } from "@/lib/constants";
import type { BookingStatus } from "@/lib/types";

const tones: Record<BookingStatus, "warning" | "success" | "neutral" | "primary" | "danger"> = {
  pending: "warning",
  confirmed: "success",
  completed: "primary",
  cancelled: "neutral",
  rejected: "danger",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={tones[status]}>{BOOKING_STATUS_LABEL[status]}</Badge>;
}
