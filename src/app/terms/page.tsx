import { ContentPage } from "@/components/content-page";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <ContentPage title="Terms of use" intro="Template text. Have it reviewed by a legal professional before launch.">
      <h2>Accounts</h2>
      <p>You are responsible for your account and for keeping your password secure. Provide accurate information in your profile.</p>
      <h2>Lessons</h2>
      <ul>
        <li>Booking requests become lessons only after the tutor confirms them.</li>
        <li>Students may cancel confirmed lessons up to 24 hours before the start time.</li>
        <li>Tutors mark lessons as completed after they have taken place.</li>
      </ul>
      <h2>Payments</h2>
      <p>Online payments are not offered yet. Displayed prices are informational until a payment provider is connected.</p>
      <h2>Conduct</h2>
      <p>Be respectful. Harassment, spam, fraud and inappropriate content are not allowed and may lead to suspension. Use the report feature to flag problems.</p>
      <h2>Reviews</h2>
      <p>Reviews must reflect your genuine experience of a completed lesson. Moderators may hide reviews that break these rules.</p>
    </ContentPage>
  );
}
