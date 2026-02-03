"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, Mail, Camera, Info } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";

export default function SubmitSportClubPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  if (isLoading) {
    return null;
  }

  if (!user) {
    router.push("/login?redirect=/sport-clubs/submit");
    return null;
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-12 md:py-20 max-w-3xl">
        {/* Back button */}
        <Link href="/sport-clubs">
          <Button variant="ghost" className="mb-6 -ml-2 text-stone hover:text-granite">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sport & Clubs
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-copper/10 border border-copper/20 text-copper text-sm font-medium mb-6">
            <Trophy className="h-4 w-4" />
            Share Your Photos
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-granite mb-4 tracking-tight">
            Share Sport & Club Photos
          </h1>
          <p className="text-stone text-lg max-w-xl mx-auto">
            Help us build Cornwall's sporting heritage archive by sharing your team photos and club memories.
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-bone bg-cream shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-granite">
              <Camera className="h-5 w-5 text-copper" />
              Photo Submission Coming Soon
            </CardTitle>
            <CardDescription>
              We're building a dedicated upload form for sport and club photos. In the meantime, you can share your photos with us directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-copper/5 border border-copper/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-copper flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-granite mb-2">How to share your photos now:</h3>
                  <ul className="text-sm text-stone space-y-2">
                    <li>• Email your photos to <a href="mailto:hello@peopleofcornwall.com" className="text-copper hover:underline font-medium">hello@peopleofcornwall.com</a></li>
                    <li>• Include: Team/club name, sport type, year (if known), location</li>
                    <li>• Add any interesting stories or details about the photo</li>
                    <li>• Let us know how you'd like to be credited</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-bone pt-6">
              <h3 className="font-medium text-granite mb-3">What we're looking for:</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-copper mt-2 flex-shrink-0" />
                  <p className="text-stone">Football, rugby, cricket teams</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-copper mt-2 flex-shrink-0" />
                  <p className="text-stone">Sailing and rowing clubs</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-copper mt-2 flex-shrink-0" />
                  <p className="text-stone">Athletic clubs and competitions</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-copper mt-2 flex-shrink-0" />
                  <p className="text-stone">Youth leagues and tournaments</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-copper mt-2 flex-shrink-0" />
                  <p className="text-stone">Club facilities and venues</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-copper mt-2 flex-shrink-0" />
                  <p className="text-stone">Historic sporting events</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <a href="mailto:hello@peopleofcornwall.com?subject=Sport%20%26%20Clubs%20Photo%20Submission" className="flex-1">
                <Button className="w-full bg-copper text-white hover:bg-copper/90">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Your Photos
                </Button>
              </a>
              <Link href="/contact" className="flex-1">
                <Button variant="outline" className="w-full border-copper text-copper hover:bg-copper hover:text-white">
                  Contact Us
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-sm text-stone">
          <p>
            Your photos will help preserve Cornwall's rich sporting history for future generations.
            All submissions are reviewed before publishing.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
