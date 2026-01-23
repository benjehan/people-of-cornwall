import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Privacy Policy | People of Cornwall",
  description: "How we handle your data and protect your privacy under GDPR.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="mb-8 font-serif text-4xl font-bold tracking-tight text-granite">
            Privacy Policy
          </h1>

          <div className="prose prose-stone max-w-none">
            <p className="text-lg text-stone">
              Last updated: January 2026
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              1. Who We Are
            </h2>
            <p className="text-stone">
              People of Cornwall is a community storytelling platform operated as a not-for-profit project 
              dedicated to preserving Cornish heritage and memories. We are the data controller responsible 
              for your personal data.
            </p>
            <p className="text-stone">
              <strong>Contact:</strong>{" "}
              <a href="mailto:hello@peopleofcornwall.com" className="text-granite underline">
                hello@peopleofcornwall.com
              </a>
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              2. What Data We Collect
            </h2>
            <p className="text-stone">
              We collect and process the following personal data:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>
                <strong>Account Information:</strong> Name, email address, and profile picture 
                (provided via Google Sign-In)
              </li>
              <li>
                <strong>Profile Information:</strong> Display name and bio that you choose to share
              </li>
              <li>
                <strong>Content:</strong> Stories, comments, and images you upload
              </li>
              <li>
                <strong>Technical Data:</strong> Browser type, IP address, and pages visited 
                (for site functionality and security)
              </li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              3. Legal Basis for Processing (GDPR)
            </h2>
            <p className="text-stone">
              Under the UK GDPR, we process your data based on:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>
                <strong>Consent:</strong> When you create an account and submit stories, 
                you consent to us storing and displaying your content
              </li>
              <li>
                <strong>Legitimate Interest:</strong> For platform security, fraud prevention, 
                and improving our services
              </li>
              <li>
                <strong>Contract:</strong> To provide you with the platform services you've signed up for
              </li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              4. How We Use Your Data
            </h2>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>To provide and maintain the People of Cornwall platform</li>
              <li>To display your stories and contributions publicly (as you've agreed)</li>
              <li>To send you notifications about your stories (approvals, comments)</li>
              <li>To moderate content and ensure community guidelines are followed</li>
              <li>To improve the platform based on usage patterns</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              5. Data Sharing & Third Parties
            </h2>
            <p className="text-stone">
              We share your data with the following third-party services that help us run the platform:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>
                <strong>Supabase</strong> (Database & Authentication) — stores your account and content. 
                Data is stored in the EU. <a href="https://supabase.com/privacy" className="text-granite underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              </li>
              <li>
                <strong>Google</strong> (Sign-In) — we use Google OAuth for authentication. 
                We only receive your name, email, and profile picture. <a href="https://policies.google.com/privacy" className="text-granite underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              </li>
              <li>
                <strong>OpenAI</strong> (AI Features) — if you use AI features, your story content 
                may be processed by OpenAI to generate summaries or images. <a href="https://openai.com/privacy" className="text-granite underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              </li>
              <li>
                <strong>Vercel</strong> (Hosting) — hosts our website. <a href="https://vercel.com/legal/privacy-policy" className="text-granite underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              </li>
              <li>
                <strong>Resend</strong> (Email) — sends transactional emails about your stories. <a href="https://resend.com/legal/privacy-policy" className="text-granite underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              </li>
            </ul>
            <p className="text-stone mt-4">
              <strong>We never sell your personal data to third parties.</strong>
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              6. International Data Transfers
            </h2>
            <p className="text-stone">
              Some of our service providers (OpenAI, Vercel) may process data outside the UK/EU. 
              Where this occurs, we ensure appropriate safeguards are in place, including 
              Standard Contractual Clauses approved by the UK ICO.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              7. Data Retention
            </h2>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>
                <strong>Account data:</strong> Retained while your account is active, 
                plus 30 days after deletion request
              </li>
              <li>
                <strong>Published stories:</strong> Retained indefinitely as part of the community archive, 
                unless you request deletion
              </li>
              <li>
                <strong>Comments:</strong> Retained while the story exists or until you delete them
              </li>
              <li>
                <strong>Technical logs:</strong> Automatically deleted after 90 days
              </li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              8. Your Rights Under GDPR
            </h2>
            <p className="text-stone">
              Under the UK GDPR, you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>
                <strong>Right of Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data
              </li>
              <li>
                <strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion 
                of your account and data
              </li>
              <li>
                <strong>Right to Restrict Processing:</strong> Limit how we use your data
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Receive your data in a machine-readable format
              </li>
              <li>
                <strong>Right to Object:</strong> Object to processing based on legitimate interests
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time
              </li>
            </ul>
            <p className="text-stone mt-4">
              To exercise these rights, email us at{" "}
              <a href="mailto:hello@peopleofcornwall.com" className="text-granite underline">
                hello@peopleofcornwall.com
              </a>. We will respond within 30 days.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              9. How to Delete Your Account
            </h2>
            <p className="text-stone">
              You can request account deletion through your{" "}
              <a href="/profile/settings" className="text-granite underline">Profile Settings</a>{" "}
              page, or by emailing us. Upon deletion:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>Your profile will be immediately removed</li>
              <li>Your stories will be either deleted or anonymised (your choice)</li>
              <li>Your comments will be anonymised</li>
              <li>All data will be permanently deleted within 30 days</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              10. Cookies
            </h2>
            <p className="text-stone">
              We use only <strong>essential cookies</strong> required for the platform to function:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>
                <strong>Authentication cookies:</strong> To keep you logged in securely
              </li>
              <li>
                <strong>Theme preference:</strong> To remember your light/dark mode choice
              </li>
            </ul>
            <p className="text-stone mt-4">
              We do <strong>not</strong> use advertising cookies, tracking cookies, or any third-party 
              analytics that track you across websites. Because we only use essential cookies, 
              we do not require a cookie consent banner under UK GDPR.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              11. Children's Privacy
            </h2>
            <p className="text-stone">
              People of Cornwall is not intended for children under 13. We do not knowingly 
              collect personal data from children. If you believe a child has provided us with 
              personal data, please contact us so we can delete it.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              12. Security
            </h2>
            <p className="text-stone">
              We implement appropriate technical and organisational measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>All data transmitted over HTTPS encryption</li>
              <li>Passwords handled securely via Google OAuth (we never see your password)</li>
              <li>Database access restricted to authorised personnel only</li>
              <li>Regular security reviews of our systems</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              13. Complaints
            </h2>
            <p className="text-stone">
              If you're unhappy with how we've handled your data, you have the right to lodge 
              a complaint with the UK Information Commissioner's Office (ICO):
            </p>
            <p className="text-stone mt-2">
              <strong>Information Commissioner's Office</strong><br />
              Wycliffe House, Water Lane<br />
              Wilmslow, Cheshire SK9 5AF<br />
              <a href="https://ico.org.uk/make-a-complaint/" className="text-granite underline" target="_blank" rel="noopener noreferrer">
                ico.org.uk/make-a-complaint
              </a>
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              14. Changes to This Policy
            </h2>
            <p className="text-stone">
              We may update this privacy policy from time to time. We will notify you of 
              significant changes by email or by posting a notice on the platform.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              15. Contact Us
            </h2>
            <p className="text-stone">
              For any privacy-related questions or to exercise your rights:
            </p>
            <p className="text-stone mt-2">
              <strong>Email:</strong>{" "}
              <a href="mailto:hello@peopleofcornwall.com" className="text-granite underline">
                hello@peopleofcornwall.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
