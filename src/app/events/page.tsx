"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Clock,
  PoundSterling,
  Accessibility,
  Dog,
  Baby,
  Leaf,
  Plus,
  Filter,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarDays,
  List,
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
}

const CORNISH_TOWNS = [
  "All Cornwall",
  "Bodmin",
  "Bude",
  "Camborne",
  "Falmouth",
  "Hayle",
  "Helston",
  "Launceston",
  "Liskeard",
  "Looe",
  "Lostwithiel",
  "Marazion",
  "Mevagissey",
  "Mousehole",
  "Newlyn",
  "Newquay",
  "Padstow",
  "Penryn",
  "Penzance",
  "Perranporth",
  "Port Isaac",
  "Porthleven",
  "Redruth",
  "St Agnes",
  "St Austell",
  "St Ives",
  "St Just",
  "Tintagel",
  "Truro",
  "Wadebridge",
];

export default function EventsPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Filters
  const [locationFilter, setLocationFilter] = useState("All Cornwall");
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showAccessible, setShowAccessible] = useState(false);
  const [showDogFriendly, setShowDogFriendly] = useState(false);
  const [showChildFriendly, setShowChildFriendly] = useState(false);
  const [showVeganFriendly, setShowVeganFriendly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    let query = (supabase.from("events") as any)
      .select("*")
      .eq("is_approved", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });

    if (locationFilter !== "All Cornwall") {
      query = query.ilike("location_name", `%${locationFilter}%`);
    }
    if (showFreeOnly) query = query.eq("is_free", true);
    if (showAccessible) query = query.eq("is_accessible", true);
    if (showDogFriendly) query = query.eq("is_dog_friendly", true);
    if (showChildFriendly) query = query.eq("is_child_friendly", true);
    if (showVeganFriendly) query = query.eq("is_vegan_friendly", true);

    const { data, error } = await query;

    if (error) {
      console.error("Error loading events:", error);
    } else {
      let filtered = data || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (e: Event) =>
            e.title.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q) ||
            e.location_name.toLowerCase().includes(q)
        );
      }
      setEvents(filtered);
    }
    setIsLoading(false);
  }, [locationFilter, showFreeOnly, showAccessible, showDogFriendly, showChildFriendly, showVeganFriendly, searchQuery]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shareEvent = (event: Event) => {
    const url = `${window.location.origin}/events/${event.id}`;
    const text = `${event.title} - ${formatDate(event.starts_at)} in ${event.location_name}`;
    
    if (navigator.share) {
      navigator.share({ title: event.title, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert("Link copied to clipboard!");
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startDayOfWeek };
  };

  const getEventsForDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dayDate = new Date(year, month, day);
    const nextDay = new Date(year, month, day + 1);
    
    return events.filter((event) => {
      const eventDate = new Date(event.starts_at);
      return eventDate >= dayDate && eventDate < nextDay;
    });
  };

  const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentMonth);

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-granite md:text-4xl">
                🗓️ Local Events
              </h1>
              <p className="mt-1 text-stone">
                Discover what's happening across Cornwall
              </p>
            </div>
            <div className="flex gap-2">
              {user && (
                <Link href="/events/create">
                  <Button className="gap-2 bg-granite text-parchment hover:bg-slate">
                    <Plus className="h-4 w-4" />
                    Add Event
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-bone bg-cream">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-end gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs text-stone">Search</Label>
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-bone"
                  />
                </div>

                {/* Location */}
                <div className="min-w-[150px]">
                  <Label className="text-xs text-stone">Location</Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="border-bone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CORNISH_TOWNS.map((town) => (
                        <SelectItem key={town} value={town}>
                          {town}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle */}
                <div className="flex gap-1 rounded-lg border border-bone p-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-granite text-parchment" : ""}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                    className={viewMode === "calendar" ? "bg-granite text-parchment" : ""}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filter toggles */}
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={showFreeOnly} onCheckedChange={(c) => setShowFreeOnly(c === true)} />
                  <PoundSterling className="h-4 w-4 text-green-600" />
                  Free
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={showAccessible} onCheckedChange={(c) => setShowAccessible(c === true)} />
                  <Accessibility className="h-4 w-4 text-blue-600" />
                  Accessible
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={showDogFriendly} onCheckedChange={(c) => setShowDogFriendly(c === true)} />
                  <Dog className="h-4 w-4 text-amber-600" />
                  Dog Friendly
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={showChildFriendly} onCheckedChange={(c) => setShowChildFriendly(c === true)} />
                  <Baby className="h-4 w-4 text-pink-600" />
                  Child Friendly
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={showVeganFriendly} onCheckedChange={(c) => setShowVeganFriendly(c === true)} />
                  <Leaf className="h-4 w-4 text-green-600" />
                  Vegan Options
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-granite" />
            </div>
          ) : viewMode === "list" ? (
            /* List View */
            <div className="space-y-4">
              {events.length === 0 ? (
                <Card className="border-bone bg-cream py-16 text-center">
                  <CardContent>
                    <Calendar className="mx-auto h-12 w-12 text-stone/30 mb-4" />
                    <p className="text-stone mb-4">No upcoming events found</p>
                    {user && (
                      <Link href="/events/create">
                        <Button className="bg-granite text-parchment hover:bg-slate">
                          Add the first event
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                events.map((event) => (
                  <Card key={event.id} className="border-bone bg-cream hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        {event.image_url && (
                          <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                            <img
                              src={event.image_url}
                              alt={event.title}
                              className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                            />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Date badge */}
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-copper text-parchment">
                                  {formatDate(event.starts_at)}
                                </Badge>
                                {!event.all_day && (
                                  <span className="text-sm text-stone flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(event.starts_at)}
                                    {event.ends_at && ` - ${formatTime(event.ends_at)}`}
                                  </span>
                                )}
                                {event.is_featured && (
                                  <Badge className="bg-yellow-500 text-white">⭐ Featured</Badge>
                                )}
                              </div>

                              <h3 className="font-serif text-xl font-bold text-granite mb-1">
                                {event.title}
                              </h3>

                              <p className="text-sm text-stone flex items-center gap-1 mb-2">
                                <MapPin className="h-4 w-4" />
                                {event.location_name}
                                {event.location_address && ` — ${event.location_address}`}
                              </p>

                              {event.description && (
                                <p className="text-sm text-stone line-clamp-2 mb-3">
                                  {event.description}
                                </p>
                              )}

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1.5">
                                {event.is_free && (
                                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                    Free
                                  </Badge>
                                )}
                                {event.price_info && !event.is_free && (
                                  <Badge variant="outline" className="border-bone">
                                    {event.price_info}
                                  </Badge>
                                )}
                                {event.is_accessible && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                    <Accessibility className="h-3 w-3 mr-1" />
                                    Accessible
                                  </Badge>
                                )}
                                {event.is_dog_friendly && (
                                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                    <Dog className="h-3 w-3 mr-1" />
                                    Dogs OK
                                  </Badge>
                                )}
                                {event.is_child_friendly && (
                                  <Badge variant="outline" className="text-pink-600 border-pink-200 bg-pink-50">
                                    <Baby className="h-3 w-3 mr-1" />
                                    Kids
                                  </Badge>
                                )}
                                {event.is_vegan_friendly && (
                                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                    <Leaf className="h-3 w-3 mr-1" />
                                    Vegan
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => shareEvent(event)}
                                className="text-stone hover:text-granite"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              {event.website_url && (
                                <a href={event.website_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="text-stone hover:text-granite">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            /* Calendar View */
            <Card className="border-bone bg-cream">
              <CardHeader className="flex flex-row items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="font-serif">
                  {currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-stone py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-24 bg-bone/30 rounded" />
                  ))}
                  
                  {/* Days of month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDay(day);
                    const isToday = 
                      day === new Date().getDate() &&
                      currentMonth.getMonth() === new Date().getMonth() &&
                      currentMonth.getFullYear() === new Date().getFullYear();
                    
                    return (
                      <div
                        key={day}
                        className={`h-24 rounded border p-1 overflow-hidden ${
                          isToday ? "border-copper bg-copper/5" : "border-bone bg-parchment"
                        }`}
                      >
                        <div className={`text-xs font-medium mb-1 ${isToday ? "text-copper" : "text-stone"}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs truncate bg-granite text-parchment rounded px-1"
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-stone">+{dayEvents.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
