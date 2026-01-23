"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Star,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location_name: string;
  location_address: string | null;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  created_by: string;
  creator?: {
    display_name: string | null;
    email: string | null;
  };
}

export default function AdminEventsPage() {
  const { user, isAdmin, isLoading: userLoading } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await (supabase
      .from("events") as any)
      .select(`
        *,
        creator:users!created_by (
          display_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading events:", error);
    } else {
      setEvents(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!userLoading && isAdmin) {
      loadEvents();
    }
  }, [userLoading, isAdmin, loadEvents]);

  const handleApprove = async (eventId: string) => {
    setActionLoading(eventId);
    const supabase = createClient();

    await (supabase
      .from("events") as any)
      .update({ is_approved: true })
      .eq("id", eventId);

    // Log moderation action
    await (supabase
      .from("moderation_log") as any)
      .insert({
        content_type: "event",
        content_id: eventId,
        action: "approved",
        moderator_id: user?.id,
      });

    await loadEvents();
    setActionLoading(null);
  };

  const handleReject = async (eventId: string) => {
    if (!confirm("Reject this event? It won't be deleted but will remain hidden.")) return;
    
    setActionLoading(eventId);
    const supabase = createClient();

    await (supabase
      .from("events") as any)
      .update({ is_approved: false })
      .eq("id", eventId);

    // Log moderation action
    await (supabase
      .from("moderation_log") as any)
      .insert({
        content_type: "event",
        content_id: eventId,
        action: "rejected",
        moderator_id: user?.id,
      });

    await loadEvents();
    setActionLoading(null);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Permanently delete this event? This cannot be undone.")) return;
    
    setActionLoading(eventId);
    const supabase = createClient();

    // Log before delete
    await (supabase
      .from("moderation_log") as any)
      .insert({
        content_type: "event",
        content_id: eventId,
        action: "deleted",
        moderator_id: user?.id,
      });

    await (supabase
      .from("events") as any)
      .delete()
      .eq("id", eventId);

    await loadEvents();
    setActionLoading(null);
  };

  const handleToggleFeatured = async (eventId: string, currentFeatured: boolean) => {
    setActionLoading(eventId);
    const supabase = createClient();

    await (supabase
      .from("events") as any)
      .update({ is_featured: !currentFeatured })
      .eq("id", eventId);

    await loadEvents();
    setActionLoading(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingEvents = events.filter(e => !e.is_approved);
  const approvedEvents = events.filter(e => e.is_approved);

  if (userLoading) {
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

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="max-w-md border-bone bg-cream text-center">
            <CardContent className="pt-6">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="font-serif text-xl font-bold text-granite mb-2">
                Access Denied
              </h2>
              <p className="text-stone mb-4">
                You don't have permission to access this page.
              </p>
              <Link href="/">
                <Button className="bg-granite text-parchment hover:bg-slate">
                  Go Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const EventCard = ({ event }: { event: Event }) => (
    <Card className={`border-bone bg-cream ${!event.is_approved ? "border-l-4 border-l-yellow-500" : ""}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {event.image_url && (
            <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {!event.is_approved && (
                    <Badge className="bg-yellow-500 text-white text-xs">Pending</Badge>
                  )}
                  {event.is_featured && (
                    <Badge className="bg-copper text-parchment text-xs">⭐ Featured</Badge>
                  )}
                </div>
                <h3 className="font-serif font-bold text-granite">{event.title}</h3>
                <div className="flex items-center gap-3 text-sm text-stone mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(event.starts_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location_name}
                  </span>
                </div>
                {event.creator && (
                  <p className="text-xs text-silver mt-1">
                    By: {event.creator.display_name || event.creator.email || "Unknown"}
                  </p>
                )}
              </div>
            </div>

            {event.description && (
              <p className="text-sm text-stone mt-2 line-clamp-2">{event.description}</p>
            )}

            <div className="flex items-center gap-2 mt-3">
              {!event.is_approved ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(event.id)}
                    disabled={actionLoading === event.id}
                    className="bg-green-600 text-white hover:bg-green-700 gap-1"
                  >
                    {actionLoading === event.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(event.id)}
                    disabled={actionLoading === event.id}
                    className="border-red-300 text-red-600 hover:bg-red-50 gap-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleFeatured(event.id, event.is_featured)}
                  disabled={actionLoading === event.id}
                  className="border-bone gap-1"
                >
                  <Star className={`h-3 w-3 ${event.is_featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                  {event.is_featured ? "Unfeature" : "Feature"}
                </Button>
              )}
              <Link href={`/events/${event.id}`}>
                <Button size="sm" variant="ghost" className="gap-1">
                  <Eye className="h-3 w-3" />
                  View
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(event.id)}
                disabled={actionLoading === event.id}
                className="text-red-600 hover:bg-red-50 gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-granite">
                🗓️ Manage Events
              </h1>
              <p className="text-stone mt-1">
                Review and manage community events
              </p>
            </div>
            {pendingEvents.length > 0 && (
              <Badge className="bg-yellow-500 text-white text-lg px-3 py-1">
                {pendingEvents.length} Pending
              </Badge>
            )}
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="mb-6">
              <TabsTrigger value="pending" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pending ({pendingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({approvedEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-granite" />
                </div>
              ) : pendingEvents.length === 0 ? (
                <Card className="border-bone bg-cream text-center py-8">
                  <CardContent>
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <p className="text-stone">No pending events to review!</p>
                  </CardContent>
                </Card>
              ) : (
                pendingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-granite" />
                </div>
              ) : approvedEvents.length === 0 ? (
                <Card className="border-bone bg-cream text-center py-8">
                  <CardContent>
                    <Calendar className="mx-auto h-12 w-12 text-stone/30 mb-4" />
                    <p className="text-stone">No approved events yet</p>
                  </CardContent>
                </Card>
              ) : (
                approvedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
