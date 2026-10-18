import Link from "next/link";

import { moderateReviewAction } from "@/app/admin/actions";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { Stars } from "@/components/ui/rating";
import { SubmitButton } from "@/components/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Reviews" };

export default async function AdminReviews() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, student:profiles!reviews_student_id_fkey(full_name), tutor:tutor_profiles!reviews_tutor_id_fkey(profile:profiles!tutor_profiles_id_fkey(full_name))")
    .order("created_at", { ascending: false })
    .limit(100);

  if ((reviews ?? []).length === 0) return <EmptyState title="No reviews yet" />;

  return (
    <ul className="space-y-3">
      {(reviews ?? []).map((r) => (
        <li key={r.id}>
          <Card className="flex flex-wrap items-start gap-4 p-5 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={r.rating} />
                <Badge tone={r.status === "published" ? "success" : "neutral"}>{r.status}</Badge>
                <span className="text-muted-foreground">
                  {r.student?.full_name} →{" "}
                  <Link href={`/tutors/${r.tutor_id}`} className="hover:underline">
                    {r.tutor?.profile?.full_name}
                  </Link>{" "}
                  · {formatRelative(r.created_at)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line">{r.comment ?? <span className="text-muted-foreground">No comment</span>}</p>
            </div>
            <form action={moderateReviewAction}>
              <input type="hidden" name="reviewId" value={r.id} />
              <input type="hidden" name="status" value={r.status === "published" ? "hidden" : "published"} />
              <SubmitButton size="sm" variant={r.status === "published" ? "danger-outline" : "secondary"}>
                {r.status === "published" ? "Hide" : "Publish"}
              </SubmitButton>
            </form>
          </Card>
        </li>
      ))}
    </ul>
  );
}
