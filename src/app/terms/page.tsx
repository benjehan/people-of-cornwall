import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Terms of Use | People of Cornwall",
  description: "Terms and conditions for using People of Cornwall.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="mb-8 font-serif text-4xl font-bold tracking-tight text-granite">
            Terms of Use
          </h1>

          <div className="prose prose-stone max-w-none">
            <p className="text-lg text-stone">
              Last updated: January 2026
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Welcome
            </h2>
            <p className="text-stone">
              By using People of Cornwall, you agree to these terms. Please read them carefully.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Your Content
            </h2>
            <p className="text-stone">
              When you share stories on People of Cornwall:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>You retain ownership of your stories and content</li>
              <li>You grant us a license to display and share your stories on the platform</li>
              <li>You confirm that your content doesn't infringe on others' rights</li>
              <li>You agree that your stories may be reviewed before publication</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Community Guidelines
            </h2>
            <p className="text-stone">
              To maintain a respectful community, please:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>Share authentic stories from Cornwall or about Cornish experiences</li>
              <li>Be respectful of others in comments and interactions</li>
              <li>Do not share content that is harmful, hateful, or illegal</li>
              <li>Do not impersonate others or share false information</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Moderation
            </h2>
            <p className="text-stone">
              All stories are reviewed by our team before publication. We reserve the right to:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>Reject stories that don't meet our guidelines</li>
              <li>Request edits before publication</li>
              <li>Remove content that violates these terms</li>
              <li>Suspend accounts that repeatedly violate guidelines</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Intellectual Property
            </h2>
            <p className="text-stone">
              The People of Cornwall platform, including its design and features, is protected 
              by copyright. You may not copy or reproduce the platform without permission.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Disclaimer
            </h2>
            <p className="text-stone">
              People of Cornwall is provided "as is" without warranties. We are not liable for 
              any damages arising from your use of the platform.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Changes to Terms
            </h2>
            <p className="text-stone">
              We may update these terms from time to time. Continued use of the platform 
              after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Contact
            </h2>
            <p className="text-stone">
              For questions about these terms, contact us at{" "}
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
