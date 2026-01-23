"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    handleUnsubscribe();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;

    const supabase = createClient();

    try {
      // Find subscription by token
      const { data: subscription, error: findError } = await (supabase
        .from("digest_subscriptions") as any)
        .select("*")
        .eq("unsubscribe_token", token)
        .single();

      if (findError || !subscription) {
        setStatus("error");
        return;
      }

      setEmail(subscription.email);

      // Update subscription
      const { error: updateError } = await (supabase
        .from("digest_subscriptions") as any)
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (updateError) {
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch (err) {
      console.error("Unsubscribe error:", err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-parchment">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="border-bone bg-cream">
            <CardContent className="pt-8 pb-8 text-center">
              {status === "loading" && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-granite mx-auto mb-4" />
                  <h1 className="font-serif text-2xl text-granite mb-2">Processing...</h1>
                  <p className="text-stone">Please wait while we update your preferences.</p>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h1 className="font-serif text-2xl text-granite mb-2">Unsubscribed</h1>
                  <p className="text-stone mb-4">
                    {email && <span className="font-medium">{email}</span>}
                    {email ? " has been " : "You've been "}
                    removed from our weekly digest.
                  </p>
                  <p className="text-sm text-silver mb-6">
                    You won't receive any more digest emails from us.
                    Changed your mind? You can always resubscribe in your profile settings.
                  </p>
                  <Link href="/">
                    <Button className="bg-granite text-parchment hover:bg-slate">
                      Return to Homepage
                    </Button>
                  </Link>
                </>
              )}

              {status === "error" && (
                <>
                  <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h1 className="font-serif text-2xl text-granite mb-2">Something Went Wrong</h1>
                  <p className="text-stone mb-4">
                    We couldn't process your unsubscribe request. 
                    The link may have expired or already been used.
                  </p>
                  <p className="text-sm text-silver mb-6">
                    Please contact us at hello@peopleofcornwall.com if you need help.
                  </p>
                  <Link href="/">
                    <Button variant="outline" className="border-granite text-granite">
                      Return to Homepage
                    </Button>
                  </Link>
                </>
              )}

              {status === "no-token" && (
                <>
                  <Mail className="h-12 w-12 text-stone mx-auto mb-4" />
                  <h1 className="font-serif text-2xl text-granite mb-2">Manage Email Preferences</h1>
                  <p className="text-stone mb-4">
                    To unsubscribe from our digest emails, click the unsubscribe link 
                    in any of our emails, or manage your preferences in your profile settings.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/profile/settings">
                      <Button className="bg-granite text-parchment hover:bg-slate">
                        Profile Settings
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline" className="border-granite text-granite">
                        Homepage
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-granite" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
