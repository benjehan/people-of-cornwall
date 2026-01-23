"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
  Map as MapIcon,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

// Date helper functions (replacing date-fns)
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const endOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  // Monday = 1, so we go to Sunday (end of week starting Monday)
  const daysUntilSunday = day === 0 ? 0 : (7 - day);
  result.setDate(result.getDate() + daysUntilSunday);
  result.setHours(23, 59, 59, 999);
  return result;
};

const endOfMonth = (date: Date): Date => {
  const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
};

const nextSaturday = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const daysUntilSat = day === 6 ? 7 : (6 - day);
  result.setDate(result.getDate() + daysUntilSat);
  result.setHours(0, 0, 0, 0);
  return result;
};

const nextSunday = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const daysUntilSun = day === 0 ? 7 : (7 - day);
  result.setDate(result.getDate() + daysUntilSun);
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// Dynamic import for map to avoid SSR issues
const EventsMap = dynamic(() => import("@/components/events/events-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-bone/30 rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-granite" />
    </div>
  ),
});

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
}

const CORNISH_TOWNS = [
  "All Cornwall",
  "Bodmin", "Bude", "Camborne", "Falmouth", "Hayle", "Helston", "Launceston",
  "Liskeard", "Looe", "Lostwithiel", "Marazion", "Mevagissey", "Mousehole",
  "Newlyn", "Newquay", "Padstow", "Penryn", "Penzance", "Perranporth",
  "Port Isaac", "Porthleven", "Redruth", "St Agnes", "St Austell", "St Ives",
  "St Just", "Tintagel", "Truro", "Wadebridge",
];

type DateFilter = "anytime" | "today" | "this_week" | "next_weekend" | "this_month" | "custom";

export default function EventsPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "map">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Filters
  const [locationFilter, setLocationFilter] = useState("All Cornwall");
  const [dateFilter, setDateFilter] = useState<DateFilter>("anytime");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showAccessible, setShowAccessible] = useState(false);
  const [showDogFriendly, setShowDogFriendly] = useState(false);
  const [showChildFriendly, setShowChildFriendly] = useState(false);
  const [showVeganFriendly, setShowVeganFriendly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get date range from filter
  const getDateRange = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case "today":
        return { start: now, end: addDays(now, 1) };
      case "this_week":
        return { start: now, end: endOfWeek(now) };
      case "next_weekend": {
        const saturday = nextSaturday(now);
        const sunday = nextSunday(now);
        return { start: saturday, end: addDays(sunday, 1) };
      }
      case "this_month":
        return { start: now, end: endOfMonth(now) };
      case "custom":
        if (customDate) {
          return { start: customDate, end: addDays(customDate, 1) };
        }
        return { start: now, end: null };
      default:
        return { start: now, end: null };
    }
  }, [dateFilter, customDate]);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { start, end } = getDateRange();

    let query = (supabase.from("events") as any)
      .select("*")
      .eq("is_approved", true)
      .gte("starts_at", start.toISOString())
      .order("starts_at", { ascending: true });

    if (end) {
      query = query.lte("starts_at", end.toISOString());
    }
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
  }, [locationFilter, showFreeOnly, showAccessible, showDogFriendly, showChildFriendly, showVeganFriendly, searchQuery, getDateRange]);

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

  const clearFilters = () => {
    setLocationFilter("All Cornwall");
    setDateFilter("anytime");
    setCustomDate(undefined);
    setShowFreeOnly(false);
    setShowAccessible(false);
    setShowDogFriendly(false);
    setShowChildFriendly(false);
    setShowVeganFriendly(false);
    setSearchQuery("");
  };

  const hasActiveFilters = locationFilter !== "All Cornwall" || dateFilter !== "anytime" || 
    showFreeOnly || showAccessible || showDogFriendly || showChildFriendly || showVeganFriendly || searchQuery;

  // Event Card component for reuse
  const EventCard = ({ event, compact = false }: { event: Event; compact?: boolean }) => (
    <Card 
      className={`border-bone bg-cream hover:shadow-md transition-shadow cursor-pointer ${compact ? "" : ""}`}
      onClick={() => setSelectedEvent(event)}
    >
      <CardContent className="p-0">
        <div className={`flex ${compact ? "flex-col" : "flex-col sm:flex-row"}`}>
          {/* Image */}
          {event.image_url && (
            <div className={compact ? "h-32" : "sm:w-48 h-32 sm:h-auto flex-shrink-0"}>
              <img
                src={event.image_url}
                alt={event.title}
                className={`w-full h-full object-cover ${compact ? "rounded-t-lg" : "rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"}`}
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Date badge */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className="bg-copper text-parchment text-xs">
                    {formatDate(event.starts_at)}
                  </Badge>
                  {!event.all_day && (
                    <span className="text-xs text-stone flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(event.starts_at)}
                    </span>
                  )}
                  {event.is_featured && (
                    <Badge className="bg-yellow-500 text-white text-xs">⭐</Badge>
                  )}
                </div>

                <h3 className={`font-serif font-bold text-granite mb-1 ${compact ? "text-sm line-clamp-1" : "text-lg"}`}>
                  {event.title}
                </h3>

                <p className="text-xs text-stone flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{event.location_name}</span>
                </p>

                {!compact && event.description && (
                  <p className="text-sm text-stone line-clamp-2 mb-3">
                    {event.description}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {event.is_free && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                      Free
                    </Badge>
                  )}
                  {event.is_accessible && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs p-1">
                      <Accessibility className="h-3 w-3" />
                    </Badge>
                  )}
                  {event.is_dog_friendly && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs p-1">
                      <Dog className="h-3 w-3" />
                    </Badge>
                  )}
                  {event.is_child_friendly && (
                    <Badge variant="outline" className="text-pink-600 border-pink-200 bg-pink-50 text-xs p-1">
                      <Baby className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!compact && (
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); shareEvent(event); }}
                    className="text-stone hover:text-granite h-8 w-8"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
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
              {/* Quick date filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm font-medium text-granite flex items-center mr-2">When:</span>
                {[
                  { value: "anytime" as DateFilter, label: "Anytime" },
                  { value: "today" as DateFilter, label: "Today" },
                  { value: "this_week" as DateFilter, label: "This Week" },
                  { value: "next_weekend" as DateFilter, label: "Next Weekend" },
                  { value: "this_month" as DateFilter, label: "This Month" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={dateFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setDateFilter(option.value); setCustomDate(undefined); }}
                    className={dateFilter === option.value 
                      ? "bg-granite text-parchment" 
                      : "border-bone text-stone hover:bg-bone"
                    }
                  >
                    {option.label}
                  </Button>
                ))}
                
                {/* Custom date picker */}
                <div className="relative">
                  <Input
                    type="date"
                    value={customDate ? customDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCustomDate(new Date(e.target.value));
                        setDateFilter("custom");
                      }
                    }}
                    className={`w-[140px] h-9 text-sm ${
                      dateFilter === "custom" 
                        ? "border-granite bg-granite/5" 
                        : "border-bone"
                    }`}
                  />
                </div>
              </div>

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
                <div className="flex gap-1 rounded-lg border border-bone p-1 bg-parchment">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-granite text-parchment" : ""}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                    className={viewMode === "calendar" ? "bg-granite text-parchment" : ""}
                    title="Calendar View"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className={viewMode === "map" ? "bg-granite text-parchment" : ""}
                    title="Map View"
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filter toggles */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
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
                
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-stone hover:text-granite"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results count */}
          <div className="mb-4 text-sm text-stone">
            {isLoading ? "Loading..." : `${events.length} event${events.length !== 1 ? "s" : ""} found`}
          </div>

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
                    <p className="text-stone mb-4">No events found matching your filters</p>
                    {hasActiveFilters && (
                      <Button onClick={clearFilters} variant="outline" className="mb-4">
                        Clear filters
                      </Button>
                    )}
                    {user && (
                      <Link href="/events/create">
                        <Button className="bg-granite text-parchment hover:bg-slate">
                          Add an event
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                events.map((event) => <EventCard key={event.id} event={event} />)
              )}
            </div>
          ) : viewMode === "calendar" ? (
            /* Calendar View */
            <Card className="border-bone bg-cream">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
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
                              className="text-xs truncate bg-granite text-parchment rounded px-1 cursor-pointer hover:bg-slate"
                              title={event.title}
                              onClick={() => setSelectedEvent(event)}
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
          ) : (
            /* Map View */
            <div className="rounded-lg overflow-hidden border border-bone">
              <EventsMap 
                events={events} 
                onEventSelect={setSelectedEvent}
                selectedEvent={selectedEvent}
              />
            </div>
          )}
        </div>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <Card 
            className="max-w-lg w-full max-h-[90vh] overflow-y-auto border-bone bg-cream"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-0">
              {selectedEvent.image_url && (
                <div className="h-48 relative">
                  <img
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="p-6">
                {!selectedEvent.image_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className="bg-copper text-parchment">
                    {formatDate(selectedEvent.starts_at)}
                  </Badge>
                  {!selectedEvent.all_day && (
                    <span className="text-sm text-stone flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(selectedEvent.starts_at)}
                      {selectedEvent.ends_at && ` - ${formatTime(selectedEvent.ends_at)}`}
                    </span>
                  )}
                </div>

                <h2 className="font-serif text-2xl font-bold text-granite mb-2">
                  {selectedEvent.title}
                </h2>

                <p className="text-stone flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  {selectedEvent.location_name}
                  {selectedEvent.location_address && ` — ${selectedEvent.location_address}`}
                </p>

                {selectedEvent.description && (
                  <p className="text-stone mb-4">{selectedEvent.description}</p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedEvent.is_free && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Free
                    </Badge>
                  )}
                  {selectedEvent.price_info && !selectedEvent.is_free && (
                    <Badge variant="outline" className="border-bone">
                      {selectedEvent.price_info}
                    </Badge>
                  )}
                  {selectedEvent.is_accessible && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      <Accessibility className="h-3 w-3 mr-1" />
                      Accessible
                    </Badge>
                  )}
                  {selectedEvent.is_dog_friendly && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                      <Dog className="h-3 w-3 mr-1" />
                      Dogs OK
                    </Badge>
                  )}
                  {selectedEvent.is_child_friendly && (
                    <Badge variant="outline" className="text-pink-600 border-pink-200 bg-pink-50">
                      <Baby className="h-3 w-3 mr-1" />
                      Kids
                    </Badge>
                  )}
                  {selectedEvent.is_vegan_friendly && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      <Leaf className="h-3 w-3 mr-1" />
                      Vegan
                    </Badge>
                  )}
                </div>

                {/* Contact */}
                {(selectedEvent.contact_email || selectedEvent.contact_phone || selectedEvent.website_url) && (
                  <div className="border-t border-bone pt-4 space-y-2">
                    {selectedEvent.contact_name && (
                      <p className="text-sm text-granite font-medium">{selectedEvent.contact_name}</p>
                    )}
                    {selectedEvent.contact_email && (
                      <a href={`mailto:${selectedEvent.contact_email}`} className="text-sm text-atlantic hover:underline block">
                        {selectedEvent.contact_email}
                      </a>
                    )}
                    {selectedEvent.contact_phone && (
                      <a href={`tel:${selectedEvent.contact_phone}`} className="text-sm text-atlantic hover:underline block">
                        {selectedEvent.contact_phone}
                      </a>
                    )}
                    {selectedEvent.website_url && (
                      <a 
                        href={selectedEvent.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-atlantic hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit website
                      </a>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={() => shareEvent(selectedEvent)}
                    variant="outline"
                    className="flex-1 border-granite text-granite"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 bg-granite text-parchment hover:bg-slate"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
}
