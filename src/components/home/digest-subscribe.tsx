"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

export function DigestSubscribe() {
  const { user, isLoading: userLoading } = useUser();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user?.email) return;
    
    setIsSubscribing(true);
    const supabase = createClient();

    // Check if already exists
    const { data: existing } = await (supabase
      .from("digest_subscriptions") as any)
      .select("id, is_active")
      .eq("email", user.email)
      .single();

    if (existing) {
      if (existing.is_active) {
        setIsSubscribed(true);
        setMessage("You're already subscribed!");
      } else {
        // Reactivate
        await (supabase
          .from("digest_subscriptions") as any)
          .update({ is_active: true, frequency: "weekly" })
          .eq("id", existing.id);
        setIsSubscribed(true);
        setMessage("Welcome back! You're subscribed.");
      }
    } else {
      // Create new
      await (supabase
        .from("digest_subscriptions") as any)
        .insert({
          email: user.email,
          user_id: user.id,
          frequency: "weekly",
          is_active: true,
        });
      setIsSubscribed(true);
      setMessage("You're subscribed! Check your inbox every Sunday.");
    }
    
    setIsSubscribing(false);
  };

  // Check subscription status on load
  useState(() => {
    if (user?.email) {
      const checkStatus = async () => {
        const supabase = createClient();
        const { data } = await (supabase
          .from("digest_subscriptions") as any)
          .select("is_active")
          .eq("email", user.email)
          .eq("is_active", true)
          .single();
        if (data) setIsSubscribed(true);
      };
      checkStatus();
    }
  });

  return (
    <section className="border-t border-bone bg-gradient-to-r from-copper/5 via-parchment to-atlantic/5 py-12">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Mail className="h-5 w-5 text-copper" />
              <h3 className="font-serif text-xl font-bold text-granite">
                Weekly Story Digest
              </h3>
            </div>
            <p className="text-stone max-w-lg">
              Get the 3 most popular stories of the week delivered to your inbox every Sunday. 
              No spam, just Cornish voices.
            </p>
            {message && (
              <p className="mt-2 text-sm text-green-600 flex items-center justify-center md:justify-start gap-1">
                <CheckCircle className="h-4 w-4" />
                {message}
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            {userLoading ? (
              <Button disabled className="bg-granite text-parchment">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </Button>
            ) : user ? (
              isSubscribed ? (
                <div className="text-center">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Subscribed!</span>
                  </div>
                  <Link href="/profile/settings" className="text-sm text-atlantic hover:underline">
                    Manage preferences
                  </Link>
                </div>
              ) : (
                <Button 
                  onClick={handleSubscribe}
                  disabled={isSubscribing}
                  className="bg-granite text-parchment hover:bg-slate"
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe for Free"
                  )}
                </Button>
              )
            ) : (
              <Link href="/login?redirect=/">
                <Button className="bg-granite text-parchment hover:bg-slate">
                  Login to Subscribe
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
