import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-bone bg-cream dark:bg-cream dark:border-bone">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 py-16">
        {/* Main footer content */}
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-serif text-xl font-bold text-granite">
              People of Cornwall
            </h3>
            <p className="mt-3 max-w-md text-sm text-stone leading-relaxed">
              A living digital museum and community archive of Cornish stories.
              Built to help people remember, not scroll faster.
            </p>
            <p className="mt-6 text-xs text-silver italic">
              "Stories are artefacts, not content."
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-granite">
              Explore
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/stories"
                  className="text-sm text-stone transition-colors hover:text-granite"
                >
                  All Stories
                </Link>
              </li>
              <li>
                <Link
                  href="/map"
                  className="text-sm text-stone transition-colors hover:text-granite"
                >
                  Map
                </Link>
              </li>
              <li>
                <Link
                  href="/timeline"
                  className="text-sm text-stone transition-colors hover:text-granite"
                >
                  Timeline
                </Link>
              </li>
              <li>
                <Link
                  href="/collections"
                  className="text-sm text-stone transition-colors hover:text-granite"
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  href="/prompts"
                  className="text-sm text-stone transition-colors hover:text-granite"
                >
                  Prompts
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-granite">
              Community
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/write"
                  className="text-sm text-stone transition-colors hover:text-granite"
                >
                  Share a Story
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-sm text-stone transition-colors hover:text-granite"
                >
                  Search
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 h-px bg-bone" />

        {/* Business Collaboration CTA */}
        <div className="mb-12 rounded-lg border border-copper/30 bg-gradient-to-r from-copper/5 to-atlantic/5 p-6 text-center">
          <h4 className="font-serif text-lg font-semibold text-granite mb-2">
            🤝 Partner With Us
          </h4>
          <p className="text-sm text-stone max-w-xl mx-auto mb-4">
            Are you a local business, museum, or heritage organization? We'd love to explore 
            collaboration opportunities to promote Cornish culture together.
          </p>
          <a 
            href="mailto:hello@peopleofcornwall.com?subject=Partnership Inquiry"
            className="inline-flex items-center gap-2 rounded-md bg-granite px-4 py-2 text-sm font-medium text-parchment transition-colors hover:bg-slate"
          >
            📧 Get in Touch
          </a>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-silver">
            © {currentYear} People of Cornwall. Built with care in Cornwall.
          </p>
          <div className="flex gap-6 text-xs text-silver">
            <Link
              href="/privacy"
              className="transition-colors hover:text-granite"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-granite"
            >
              Terms
            </Link>
            <Link
              href="/accessibility"
              className="transition-colors hover:text-granite"
            >
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
