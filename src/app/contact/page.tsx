import { ContentPage } from "@/components/content-page";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <ContentPage title="Contact us" intro="We are happy to help with questions about lessons, tutors or your account.">
      {email ? (
        <p>
          Email us at{" "}
          <a href={`mailto:${email}`} className="font-medium text-primary underline">
            {email}
          </a>
          . We usually reply within two working days.
        </p>
      ) : (
        <p>The support email address has not been configured yet. Set NEXT_PUBLIC_SUPPORT_EMAIL to show it here.</p>
      )}
      <p>To report a user or a review, use the “Report” option on the lesson page so our team gets the full context.</p>
    </ContentPage>
  );
}
