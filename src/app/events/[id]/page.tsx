"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "@/components/comments/comment-section";
import { EventImageCarousel } from "@/components/events/event-image-carousel";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  User,
  Mail,
  Phone,
  ExternalLink,
  Share2,
  Heart,
  Loader2,
  Accessibility,
  Dog,
  Baby,
  Leaf,
  Repeat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

interface EventImage {
  id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  location_name: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  price_info: string | null;
  is_free: boolean;
  is_accessible: boolean;
  is_dog_friendly: boolean;
  is_child_friendly: boolean;
  is_vegan_friendly: boolean;
  is_featured: boolean;
  category: string | null;
  source_url: string | null;
  recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  excluded_dates: string[];
  like_count: number;
  comment_count: number;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventImages, setEventImages] = useState<EventImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const loadEvent = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error: fetchError } = await (supabase
      .from("events") as any)
      .select("*")
      .eq("id", id)
      .eq("is_approved", true)
      .single();

    if (fetchError || !data) {
      setError("Event not found");
      setIsLoading(false);
      return;
    }

    setEvent(data);
    setLikeCount(data.like_count || 0);

    // Load event images
    const { data: images } = await (supabase
      .from("event_images") as any)
      .select("*")
      .eq("event_id", id)
      .order("display_order", { ascending: true });
    
    setEventImages(images || []);

    // Check if user has liked
    if (user) {
      const { data: like } = await (supabase
        .from("likes") as any)
        .select("id")
        .eq("content_type", "event")
        .eq("content_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setUserHasLiked(!!like);
    }

    setIsLoading(false);
  }, [id, user]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleLike = async () => {
    if (!user || !event) return;

    setIsLiking(true);
    const supabase = createClient();

    if (userHasLiked) {
      await (supabase
        .from("likes") as any)
        .delete()
        .eq("content_type", "event")
        .eq("content_id", event.id)
        .eq("user_id", user.id);
      setUserHasLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      await (supabase
        .from("likes") as any)
        .insert({
          content_type: "event",
          content_id: event.id,
          user_id: user.id,
        });
      setUserHasLiked(true);
      setLikeCount((c) => c + 1);
    }

    setIsLiking(false);
  };

  const shareEvent = () => {
    if (!event) return;
    const url = window.location.href;
    const text = `${event.title} - ${formatDate(event.starts_at)} in ${event.location_name}`;
    
    if (navigator.share) {
      navigator.share({ title: event.title, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert("Link copied to clipboard!");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if event is in the past
  const isEventPast = event ? (() => {
    const endDate = event.ends_at ? new Date(event.ends_at) : new Date(event.starts_at);
    return endDate < new Date();
  })() : false;

  if (isLoading) {
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

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="max-w-md border-bone bg-cream text-center">
            <CardContent className="pt-6">
              <Calendar className="mx-auto h-12 w-12 text-stone/30 mb-4" />
              <h2 className="font-serif text-xl font-bold text-granite mb-2">
                Event Not Found
              </h2>
              <p className="text-stone mb-4">
                This event may have been removed or hasn't been approved yet.
              </p>
              <Link href="/events">
                <Button className="bg-granite text-parchment hover:bg-slate">
                  Back to Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/events"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>

          {/* Past Event Notice */}
          {isEventPast && (
            <div className="mb-4 p-4 bg-stone/10 border border-stone/20 rounded-lg flex items-center gap-3">
              <Calendar className="h-5 w-5 text-stone" />
              <div>
                <p className="font-medium text-granite">This event has ended</p>
                <p className="text-sm text-stone">
                  Browse our <Link href="/events" className="text-atlantic hover:underline">upcoming events</Link> for more to explore.
                </p>
              </div>
            </div>
          )}

          {/* Hero image carousel */}
          <div className={`mb-8 rounded-xl overflow-hidden relative ${isEventPast ? "grayscale" : ""}`}>
            {/* Past Event Ribbon */}
            {isEventPast && (
              <div className="absolute top-6 -left-12 z-20 rotate-[-45deg] bg-stone text-white text-sm font-bold py-2 px-14 shadow-lg">
                PAST EVENT
              </div>
            )}
            <EventImageCarousel
              images={eventImages}
              eventTitle={event.title}
              className="h-64 md:h-96"
              showDots={true}
              autoPlay={eventImages.length > 1}
              autoPlayInterval={6000}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              {/* Title & badges */}
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {isEventPast && (
                    <Badge className="bg-stone text-white">Past Event</Badge>
                  )}
                  <Badge className="bg-copper text-parchment">
                    {formatDate(event.starts_at)}
                  </Badge>
                  {event.is_featured && (
                    <Badge className="bg-yellow-500 text-white">⭐ Featured</Badge>
                  )}
                </div>

                <h1 className="font-serif text-3xl md:text-4xl font-bold text-granite mb-4">
                  {event.title}
                </h1>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleLike}
                    disabled={!user || isLiking}
                    className={`gap-2 ${userHasLiked ? "border-red-300 text-red-500" : "border-bone text-stone"}`}
                  >
                    <Heart className={`h-4 w-4 ${userHasLiked ? "fill-current" : ""}`} />
                    {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                  </Button>
                  <Button variant="outline" onClick={shareEvent} className="gap-2 border-bone text-stone">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="prose prose-stone max-w-none">
                  <p className="text-stone whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Amenities */}
              <div className="flex flex-wrap gap-2">
                {event.is_free && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                    Free Event
                  </Badge>
                )}
                {event.price_info && !event.is_free && (
                  <Badge variant="outline" className="border-bone gap-1">
                    {event.price_info}
                  </Badge>
                )}
                {event.is_accessible && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 gap-1">
                    <Accessibility className="h-3 w-3" />
                    Wheelchair Accessible
                  </Badge>
                )}
                {event.is_dog_friendly && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1">
                    <Dog className="h-3 w-3" />
                    Dog Friendly
                  </Badge>
                )}
                {event.is_child_friendly && (
                  <Badge variant="outline" className="text-pink-600 border-pink-200 bg-pink-50 gap-1">
                    <Baby className="h-3 w-3" />
                    Child Friendly
                  </Badge>
                )}
                {event.is_vegan_friendly && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                    <Leaf className="h-3 w-3" />
                    Vegan Options
                  </Badge>
                )}
              </div>

              {/* Source attribution */}
              {event.source_url && (
                <p className="text-xs text-stone/60 flex items-center gap-1">
                  Originally listed on{" "}
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-stone/60 underline hover:text-stone"
                  >
                    {(() => {
                      try {
                        const host = new URL(event.source_url).hostname;
                        return host.replace(/^www\./, "");
                      } catch {
                        return "source";
                      }
                    })()}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}

              {/* Comments */}
              <Card className="border-bone bg-cream">
                <CardContent className="pt-6">
                  <CommentSection contentType="event" contentId={event.id} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Date & Time */}
              <Card className="border-bone bg-cream">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-copper" />
                    When
                  </h3>
                  <div className="text-stone">
                    <p className="font-medium">{formatDate(event.starts_at)}</p>
                    {!event.all_day && (
                      <p className="flex items-center gap-1 text-sm mt-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.starts_at)}
                        {event.ends_at && ` - ${formatTime(event.ends_at)}`}
                      </p>
                    )}
                    {event.all_day && (
                      <p className="text-sm mt-1">All day event</p>
                    )}
                    {event.recurring && event.recurrence_pattern && (
                      <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-bone">
                        <Repeat className="h-4 w-4 text-blue-600" />
                        <span>
                          Repeats {event.recurrence_pattern}
                          {event.recurrence_end_date && (
                            <> until {new Date(event.recurrence_end_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                          )}
                        </span>
                      </div>
                    )}
                    {event.excluded_dates && event.excluded_dates.length > 0 && (
                      <p className="text-xs text-stone mt-1">
                        Skips: {event.excluded_dates.map(d =>
                          new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        ).join(', ')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="border-bone bg-cream">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-copper" />
                    Where
                  </h3>
                  <div className="text-stone">
                    <p className="font-medium">{event.location_name}</p>
                    {event.location_address && (
                      <p className="text-sm mt-1">{event.location_address}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              {(event.contact_name || event.contact_email || event.contact_phone || event.website_url) && (
                <Card className="border-bone bg-cream">
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-medium text-granite flex items-center gap-2">
                      <User className="h-4 w-4 text-copper" />
                      Contact
                    </h3>
                    <div className="space-y-2">
                      {event.contact_name && (
                        <p className="font-medium text-granite">{event.contact_name}</p>
                      )}
                      {event.contact_email && (
                        <a
                          href={`mailto:${event.contact_email}`}
                          className="flex items-center gap-2 text-sm text-atlantic hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {event.contact_email}
                        </a>
                      )}
                      {event.contact_phone && (
                        <a
                          href={`tel:${event.contact_phone}`}
                          className="flex items-center gap-2 text-sm text-atlantic hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {event.contact_phone}
                        </a>
                      )}
                      {event.website_url && (
                        <a
                          href={event.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-atlantic hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Visit website
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
