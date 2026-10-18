import { ContentPage } from "@/components/content-page";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy policy" intro="Template text. Have it reviewed by a legal professional before launch.">
      <h2>What we store</h2>
      <ul>
        <li>Account data: email address, name, country, time zone and optional profile photo.</li>
        <li>Learning and teaching data: languages, levels, goals, tutor profiles and availability.</li>
        <li>Activity: bookings, messages between participants, reviews, notifications and reports.</li>
      </ul>
      <h2>Who can see it</h2>
      <p>Approved tutor profiles are public. Student profiles are only visible to tutors they share a booking or conversation with. Messages are only visible to the two participants. Access rules are enforced in the database.</p>
      <h2>Calls</h2>
      <p>Voice and video lessons are transmitted through our real-time provider and are not recorded.</p>
      <h2>Your rights</h2>
      <p>You can edit your profile at any time in settings and request deletion of your account through the contact page.</p>
    </ContentPage>
  );
}
