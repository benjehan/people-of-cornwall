import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-chalk-white-dark/50">
      <div className="mx-auto max-w-[1400px] px-4 py-12">
        {/* Main footer content */}
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              People of Cornwall
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              A living digital museum and community archive of Cornish stories.
              Built to help people remember, not scroll faster.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Stories are artefacts, not content.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Explore</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/stories"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  All Stories
                </Link>
              </li>
              <li>
                <Link
                  href="/map"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Stories by Place
                </Link>
              </li>
              <li>
                <Link
                  href="/timeline"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Stories by Time
                </Link>
              </li>
              <li>
                <Link
                  href="/collections"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Community</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/write"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Share a Story
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/guidelines"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <p className="text-xs text-muted-foreground">
            © {currentYear} People of Cornwall. Built with care in Cornwall.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/accessibility"
              className="transition-colors hover:text-foreground"
            >
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
