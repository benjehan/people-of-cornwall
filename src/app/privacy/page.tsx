import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Privacy Policy | People of Cornwall",
  description: "How we handle your data and protect your privacy.",
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
              Introduction
            </h2>
            <p className="text-stone">
              People of Cornwall ("we", "us", or "our") is committed to protecting your privacy. 
              This policy explains how we collect, use, and safeguard your information when you 
              use our community storytelling platform.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Information We Collect
            </h2>
            <p className="text-stone">
              When you use People of Cornwall, we may collect:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li><strong>Account information:</strong> Your name, email address, and profile picture when you sign in with Google</li>
              <li><strong>Stories and content:</strong> The stories, comments, and media you choose to share</li>
              <li><strong>Usage data:</strong> Basic analytics about how you use the site</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              How We Use Your Information
            </h2>
            <p className="text-stone">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>Provide and maintain the platform</li>
              <li>Display your stories and contributions</li>
              <li>Send you notifications about your stories (approvals, comments)</li>
              <li>Improve the platform based on usage patterns</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Data Storage
            </h2>
            <p className="text-stone">
              Your data is stored securely using Supabase, a trusted database provider. 
              We do not sell or share your personal information with third parties for 
              marketing purposes.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Your Rights
            </h2>
            <p className="text-stone">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>Access your personal data</li>
              <li>Request deletion of your account and stories</li>
              <li>Update your profile information</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Cookies
            </h2>
            <p className="text-stone">
              We use essential cookies to maintain your login session. We do not use 
              tracking cookies or third-party advertising cookies.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Contact
            </h2>
            <p className="text-stone">
              If you have questions about this privacy policy, please contact us at{" "}
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
