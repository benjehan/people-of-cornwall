import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Accessibility | People of Cornwall",
  description: "Our commitment to making People of Cornwall accessible to everyone.",
};

export default function AccessibilityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="mb-8 font-serif text-4xl font-bold tracking-tight text-granite">
            Accessibility Statement
          </h1>

          <div className="prose prose-stone max-w-none">
            <p className="text-lg text-stone">
              Last updated: January 2026
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Our Commitment
            </h2>
            <p className="text-stone">
              People of Cornwall is committed to ensuring digital accessibility for people 
              of all abilities. We are continually improving the user experience for everyone 
              and applying the relevant accessibility standards.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Accessibility Features
            </h2>
            <p className="text-stone">
              We have implemented the following features to improve accessibility:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li><strong>Keyboard navigation:</strong> All interactive elements can be accessed using a keyboard</li>
              <li><strong>Screen reader support:</strong> Pages are structured with semantic HTML for screen reader compatibility</li>
              <li><strong>Text alternatives:</strong> Images include descriptive alt text where appropriate</li>
              <li><strong>Colour contrast:</strong> We use high-contrast colour combinations for readability</li>
              <li><strong>Resizable text:</strong> Text can be resized without loss of functionality</li>
              <li><strong>Focus indicators:</strong> Visible focus states for keyboard users</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Standards
            </h2>
            <p className="text-stone">
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. 
              These guidelines explain how to make web content more accessible for people with 
              disabilities.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Known Limitations
            </h2>
            <p className="text-stone">
              While we strive for full accessibility, some areas may have limitations:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>User-uploaded images may not always have descriptive alt text</li>
              <li>Some third-party content (like embedded maps) may have accessibility limitations</li>
              <li>Older user-generated content may not meet all current accessibility standards</li>
            </ul>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Feedback
            </h2>
            <p className="text-stone">
              We welcome your feedback on the accessibility of People of Cornwall. If you 
              encounter any accessibility barriers or have suggestions for improvement, 
              please contact us:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>
                Email:{" "}
                <a href="mailto:hello@peopleofcornwall.com" className="text-granite underline">
                  hello@peopleofcornwall.com
                </a>
              </li>
            </ul>
            <p className="text-stone mt-4">
              We try to respond to accessibility feedback within 5 business days.
            </p>

            <h2 className="mt-8 font-serif text-2xl font-bold text-granite">
              Assistive Technologies
            </h2>
            <p className="text-stone">
              People of Cornwall is designed to be compatible with the following assistive technologies:
            </p>
            <ul className="list-disc pl-6 text-stone space-y-2">
              <li>Screen readers (NVDA, JAWS, VoiceOver)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Keyboard-only navigation</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
