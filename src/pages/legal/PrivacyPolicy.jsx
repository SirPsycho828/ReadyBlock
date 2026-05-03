import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <Link to="/auth/landing" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to ReadyBlock
        </Link>

        <h1 className="mb-2 text-3xl text-foreground sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-muted-foreground">Effective date: March 29, 2026</p>

        <div className="prose-sm space-y-8 text-muted-foreground [&_h2]:mb-3 [&_h2]:mt-0 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">

          <section>
            <h2>1. Introduction</h2>
            <p>ReadyBlock ("we," "our," or "us") is a neighborhood emergency preparedness platform operated in Asheville, North Carolina. We are committed to protecting the privacy of our users ("you" or "your"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the ReadyBlock web application and related services (the "Service").</p>
            <p>By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not access or use the Service.</p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>We collect several types of information to provide and improve the Service:</p>

            <p><strong>Account Information:</strong> When you register, we collect your email address and a password (stored in hashed form). You may optionally provide your first and last name.</p>

            <p><strong>Household Information:</strong> To connect you with your neighborhood block, we collect your street address, city, state, and ZIP code. You may also provide information about your household including the number of adults and children, pets, languages spoken, and emergency needs.</p>

            <p><strong>Emergency Contacts:</strong> You may provide names and phone numbers of emergency contacts outside your neighborhood. These contacts may receive automated safety notifications during emergencies.</p>

            <p><strong>Resources &amp; Skills:</strong> You may voluntarily share information about resources you have available (generators, tools, medical supplies, etc.) and professional skills or certifications (medical training, electrical work, etc.) that could help your neighborhood in an emergency.</p>

            <p><strong>Emergency Needs:</strong> You may optionally disclose sensitive information such as medical equipment dependency, mobility limitations, or priority check-in needs. This information is considered sensitive and is subject to enhanced privacy controls (see Section 5).</p>

            <p><strong>Usage Data:</strong> We automatically collect information about how you interact with the Service, including device type, browser type, IP address, pages visited, and timestamps. We use Google Analytics (via Firebase Analytics) to collect this data.</p>

            <p><strong>Location Data:</strong> We use your provided street address to assign you to a neighborhood block. We do not track your real-time GPS location.</p>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li><strong>Neighborhood Matching:</strong> Your address is used to assign you to the correct neighborhood block and connect you with nearby neighbors and your block coordinator.</li>
              <li><strong>Emergency Preparedness:</strong> Household information, resources, and skills are aggregated to calculate block readiness scores and help coordinators plan for emergencies.</li>
              <li><strong>Emergency Communication:</strong> During an active emergency, your status ("I'm Alive" or "Need Help") is shared with your block coordinator and, if configured, your designated emergency contacts.</li>
              <li><strong>Service Improvement:</strong> Usage data helps us understand how the Service is used and identify areas for improvement.</li>
              <li><strong>Notifications:</strong> We may send push notifications about emergency events, welfare checks, and important updates related to your block.</li>
            </ul>
          </section>

          <section>
            <h2>4. How We Share Your Information</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We share your information only in the following circumstances:</p>
            <ul>
              <li><strong>Block Coordinator:</strong> Your block coordinator can see your household information, resources, skills, and emergency status. This is essential for emergency coordination.</li>
              <li><strong>Neighbors:</strong> Basic household information (address, number of people) may be visible to neighbors on your block. You control the visibility of emergency needs information through your privacy settings.</li>
              <li><strong>Emergency Contacts:</strong> Your designated emergency contacts receive notifications when you use the "I'm Alive" feature during an active emergency.</li>
              <li><strong>City/County Coordinators:</strong> Aggregated, anonymized data (e.g., block readiness scores, resource counts) may be shared with municipal emergency management coordinators. Individual household data is not shared at this level without your consent.</li>
              <li><strong>Service Providers:</strong> We use Firebase (Google Cloud) for authentication, data storage, and hosting. Your data is processed in accordance with Google's data processing terms.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, regulation, legal process, or governmental request.</li>
            </ul>
          </section>

          <section>
            <h2>5. Your Privacy Controls</h2>
            <p>You have control over how your emergency needs information is shared:</p>
            <ul>
              <li><strong>Coordinator Only:</strong> Only your block coordinator can see your emergency needs information.</li>
              <li><strong>Coordinator + Immediate Neighbors:</strong> Your coordinator and neighbors directly adjacent to your address can see your emergency needs.</li>
              <li><strong>Don't Share:</strong> Your emergency needs information is not visible to anyone. Note: this may limit the ability of your coordinator to prioritize welfare checks during emergencies.</li>
            </ul>
            <p>You can change these settings at any time from the Settings page in the app.</p>
          </section>

          <section>
            <h2>6. Data Storage &amp; Security</h2>
            <p>Your data is stored using Google Firebase (Firestore) with the following security measures:</p>
            <ul>
              <li>All data is encrypted in transit using TLS 1.2+ and at rest using AES-256.</li>
              <li>Authentication is handled by Firebase Authentication with industry-standard password hashing.</li>
              <li>Firestore security rules enforce role-based access control, ensuring users can only access data they are authorized to see.</li>
              <li>Sensitive household data is additionally encrypted at the application level before storage.</li>
              <li>The Service supports offline-first functionality using local device storage (IndexedDB). Data stored locally on your device is encrypted.</li>
            </ul>
            <p>While we implement commercially reasonable security measures, no method of electronic storage is 100% secure. We cannot guarantee absolute security of your data.</p>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide the Service. If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.</p>
            <p>Aggregated, anonymized data (such as block readiness statistics) may be retained indefinitely for research and service improvement purposes.</p>
          </section>

          <section>
            <h2>8. Children's Privacy</h2>
            <p>The Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us and we will take steps to delete such information.</p>
          </section>

          <section>
            <h2>9. Third-Party Services</h2>
            <p>The Service uses the following third-party services:</p>
            <ul>
              <li><strong>Firebase Authentication:</strong> For user login and account management.</li>
              <li><strong>Cloud Firestore:</strong> For data storage.</li>
              <li><strong>Firebase Analytics:</strong> For usage analytics (can be opted out of).</li>
              <li><strong>Firebase Cloud Functions:</strong> For server-side processing of alerts, notifications, and data aggregation.</li>
            </ul>
            <p>Each of these services has its own privacy policy. We encourage you to review Google's privacy policy at <span className="text-primary">privacy.google.com</span>.</p>
          </section>

          <section>
            <h2>10. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate personal information.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information and account.</li>
              <li><strong>Data Portability:</strong> Request a machine-readable copy of your data.</li>
              <li><strong>Objection:</strong> Object to processing of your personal information for certain purposes.</li>
            </ul>
            <p>To exercise any of these rights, please contact us at the address below.</p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Effective date" at the top. Your continued use of the Service after any changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, please contact us at:</p>
            <p>ReadyBlock<br />Asheville, North Carolina<br />Email: privacy@readyblock.org</p>
          </section>

        </div>
      </div>
    </div>
  );
}
