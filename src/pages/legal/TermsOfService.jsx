import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <Link to="/auth/landing" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to ReadyBlock
        </Link>

        <h1 className="mb-2 text-3xl text-foreground sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          Terms of Service
        </h1>
        <p className="mb-10 text-sm text-muted-foreground">Effective date: March 29, 2026</p>

        <div className="prose-sm space-y-8 text-muted-foreground [&_h2]:mb-3 [&_h2]:mt-0 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using the ReadyBlock web application and related services (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. The Service is operated by ReadyBlock ("we," "our," or "us"), based in Asheville, North Carolina.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>ReadyBlock is a neighborhood emergency preparedness platform that helps residents connect with their neighbors, share resources, and coordinate during emergencies. The Service includes:</p>
            <ul>
              <li>Household registration and neighborhood block assignment</li>
              <li>Resource and skill sharing within your block</li>
              <li>Emergency check-in and status reporting ("I'm Alive" feature)</li>
              <li>Neighborhood mapping and readiness scoring</li>
              <li>Coordinator tools for block captains and emergency management</li>
              <li>Offline-first functionality for use during connectivity disruptions</li>
            </ul>
          </section>

          <section>
            <h2>3. Eligibility</h2>
            <p>You must be at least 13 years old to use the Service. If you are between 13 and 18 years old, you must have the consent of a parent or legal guardian. By using the Service, you represent and warrant that you meet these eligibility requirements.</p>
          </section>

          <section>
            <h2>4. Account Registration</h2>
            <p>To use the Service, you must create an account by providing a valid email address and password. You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and truthful information, particularly your street address (which is used for neighborhood assignment)</li>
              <li>Promptly notifying us of any unauthorized use of your account</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms or provide false information.</p>
          </section>

          <section>
            <h2>5. Acceptable Use</h2>
            <p>You agree to use the Service only for its intended purpose of neighborhood emergency preparedness and community coordination. You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Provide false or misleading information about your identity, address, or household</li>
              <li>Misuse the emergency features (e.g., sending false "I'm Alive" or "Need Help" signals when there is no emergency)</li>
              <li>Harass, threaten, or intimidate other users, coordinators, or neighbors</li>
              <li>Attempt to access another user's account or personal information without authorization</li>
              <li>Use the Service to collect or harvest personal information about other users for purposes unrelated to neighborhood preparedness</li>
              <li>Interfere with or disrupt the Service, servers, or networks</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
              <li>Use the Service for commercial advertising, solicitation, or spam</li>
              <li>Share your coordinator access credentials or delegate coordinator responsibilities without authorization</li>
            </ul>
          </section>

          <section>
            <h2>6. Coordinator Roles &amp; Responsibilities</h2>
            <p>Certain users may be designated as block captains, neighborhood captains, or city/county coordinators. Coordinators have access to additional information about households in their assigned area and have additional responsibilities:</p>
            <ul>
              <li>Coordinators must keep household information confidential and use it only for emergency preparedness purposes</li>
              <li>Coordinators must not share individual household data with unauthorized parties</li>
              <li>Coordinators must use emergency mode and drill features responsibly and only when appropriate</li>
              <li>Coordinator roles may be revoked at any time by higher-level coordinators or ReadyBlock administrators</li>
            </ul>
          </section>

          <section>
            <h2>7. Emergency Features Disclaimer</h2>
            <p><strong>IMPORTANT: ReadyBlock is a preparedness tool, not an emergency service.</strong></p>
            <ul>
              <li>The "I'm Alive" feature is a convenience notification to your designated contacts. It is not a substitute for calling 911 or other emergency services.</li>
              <li>The "Need Help" feature alerts your block coordinator but does not contact emergency services.</li>
              <li>ReadyBlock does not guarantee delivery of notifications, especially during widespread emergencies when communication infrastructure may be compromised.</li>
              <li>Block readiness scores and resource inventories are self-reported and may not be accurate or up to date.</li>
              <li>ReadyBlock does not verify the accuracy of skills, certifications, or resource claims made by users.</li>
            </ul>
            <p>In any emergency, always contact local emergency services (911) first. Do not rely solely on ReadyBlock for emergency communication.</p>
          </section>

          <section>
            <h2>8. Offline Functionality</h2>
            <p>The Service includes offline-first functionality that allows limited use when internet connectivity is unavailable. Data created or modified while offline is stored locally on your device and synchronized with our servers when connectivity is restored. We are not responsible for data loss that occurs due to device failure, loss, or theft while data is stored locally.</p>
          </section>

          <section>
            <h2>9. Intellectual Property</h2>
            <p>The Service, including its design, code, logos, trademarks, and content, is the property of ReadyBlock and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the Service without our prior written consent.</p>
            <p>Content you provide (household information, resources, skills) remains yours, but you grant us a non-exclusive, worldwide license to use, store, and process this content for the purpose of providing the Service.</p>
          </section>

          <section>
            <h2>10. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, READYBLOCK AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:</p>
            <ul>
              <li>Any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service</li>
              <li>Any loss or damage resulting from reliance on information provided through the Service</li>
              <li>Any failure of the Service to deliver notifications during an emergency</li>
              <li>Any actions or omissions of other users, coordinators, or neighbors</li>
              <li>Any loss of data, including data stored locally on your device</li>
            </ul>
            <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
          </section>

          <section>
            <h2>11. Indemnification</h2>
            <p>You agree to indemnify and hold harmless ReadyBlock, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, or expenses (including reasonable attorneys' fees) arising from your use of the Service, your violation of these Terms, or your violation of any rights of another.</p>
          </section>

          <section>
            <h2>12. Termination</h2>
            <p>You may terminate your account at any time by contacting us or using the account deletion feature in the app. We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service ceases immediately, and we may delete your data in accordance with our Privacy Policy.</p>
          </section>

          <section>
            <h2>13. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and, where possible, by sending a notification through the Service. Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2>14. Governing Law</h2>
            <p>These Terms are governed by and construed in accordance with the laws of the State of North Carolina, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the state or federal courts located in Buncombe County, North Carolina.</p>
          </section>

          <section>
            <h2>15. Contact Us</h2>
            <p>If you have questions about these Terms, please contact us at:</p>
            <p>ReadyBlock<br />Asheville, North Carolina<br />Email: legal@readyblock.org</p>
          </section>

        </div>
      </div>
    </div>
  );
}
