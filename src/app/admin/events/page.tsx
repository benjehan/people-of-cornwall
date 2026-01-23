"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Star,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location_name: string;
  starts_at: string;
  ends_at: string | null;
  is_approved: boolean;
  is_featured: boolean;
  price_info: string | null;
  is_free: boolean;
  website_url: string | null;
  created_at: string;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: userLoading } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await (supabase.from("events") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading events:", error);
    } else {
      setEvents(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!userLoading && !isAdmin) {
      router.push("/");
    } else if (isAdmin) {
      loadEvents();
    }
  }, [userLoading, isAdmin, router, loadEvents]);

  const handleApprove = async (eventId: string) => {
    setActionLoading(eventId);
    const supabase = createClient();

    await (supabase.from("events") as any)
      .update({ is_approved: true })
      .eq("id", eventId);

    await loadEvents();
    setActionLoading(null);
  };

  const handleReject = async (eventId: string) => {
    setActionLoading(eventId);
    const supabase = createClient();

    await (supabase.from("events") as any)
      .delete()
      .eq("id", eventId);

    await loadEvents();
    setActionLoading(null);
  };

  const handleToggleFeatured = async (eventId: string, featured: boolean) => {
    setActionLoading(eventId);
    const supabase = createClient();

    await (supabase.from("events") as any)
      .update({ is_featured: !featured })
      .eq("id", eventId);

    await loadEvents();
    setActionLoading(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-granite" />
        </main>
        <Footer />
      </div>
    );
  }

  const pendingEvents = events.filter((e) => !e.is_approved);
  const approvedEvents = events.filter((e) => e.is_approved);

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="mb-8 font-serif text-3xl font-bold text-granite">
            🗓️ Manage Events
          </h1>

          {/* Pending Events */}
          <section className="mb-10">
            <h2 className="mb-4 font-serif text-xl font-bold text-granite flex items-center gap-2">
              <Clock className="h-5 w-5 text-copper" />
              Pending Approval ({pendingEvents.length})
            </h2>

            {pendingEvents.length === 0 ? (
              <Card className="border-bone bg-cream">
                <CardContent className="py-8 text-center text-stone">
                  No events pending approval.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingEvents.map((event) => (
                  <Card key={event.id} className="border-copper bg-copper/5">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-bold text-granite">
                            {event.title}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-stone">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(event.starts_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location_name}
                            </span>
                          </div>
                          {event.description && (
                            <p className="mt-2 text-sm text-stone line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(event.id)}
                            disabled={actionLoading === event.id}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            {actionLoading === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(event.id)}
                            disabled={actionLoading === event.id}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Approved Events */}
          <section>
            <h2 className="mb-4 font-serif text-xl font-bold text-granite flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approved Events ({approvedEvents.length})
            </h2>

            {approvedEvents.length === 0 ? (
              <Card className="border-bone bg-cream">
                <CardContent className="py-8 text-center text-stone">
                  No approved events yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {approvedEvents.map((event) => (
                  <Card key={event.id} className="border-bone bg-cream">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-granite truncate">
                              {event.title}
                            </h3>
                            {event.is_featured && (
                              <Badge className="bg-yellow-500 text-white">⭐ Featured</Badge>
                            )}
                          </div>
                          <div className="text-sm text-stone">
                            {formatDate(event.starts_at)} • {event.location_name}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={event.is_featured ? "default" : "outline"}
                            onClick={() => handleToggleFeatured(event.id, event.is_featured)}
                            disabled={actionLoading === event.id}
                            className={event.is_featured ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                          >
                            <Star className={`h-4 w-4 ${event.is_featured ? "fill-white" : ""}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(event.id)}
                            disabled={actionLoading === event.id}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
