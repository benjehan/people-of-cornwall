"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  User,
  Mail,
  Phone,
  Globe,
  PoundSterling,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Accessibility,
  Dog,
  Baby,
  Leaf,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

const CORNISH_TOWNS = [
  "Bodmin", "Bude", "Camborne", "Falmouth", "Hayle", "Helston", "Launceston",
  "Liskeard", "Looe", "Lostwithiel", "Marazion", "Mevagissey", "Mousehole",
  "Newlyn", "Newquay", "Padstow", "Penryn", "Penzance", "Perranporth",
  "Port Isaac", "Porthleven", "Redruth", "St Agnes", "St Austell", "St Ives",
  "St Just", "Tintagel", "Truro", "Wadebridge",
];

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [isAccessible, setIsAccessible] = useState(false);
  const [isDogFriendly, setIsDogFriendly] = useState(false);
  const [isChildFriendly, setIsChildFriendly] = useState(false);
  const [isVeganFriendly, setIsVeganFriendly] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!title.trim() || !locationName || !startDate) {
      setError("Please fill in the required fields (title, location, start date)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();

    // Combine date and time
    const startsAt = allDay 
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime || "00:00"}:00`;
    
    const endsAt = endDate 
      ? (allDay ? `${endDate}T23:59:59` : `${endDate}T${endTime || "23:59"}:00`)
      : null;

    const { error: insertError } = await (supabase.from("events") as any).insert({
      title: title.trim(),
      description: description.trim() || null,
      location_name: locationName,
      location_address: locationAddress.trim() || null,
      image_url: imageUrl.trim() || null,
      starts_at: startsAt,
      ends_at: endsAt,
      all_day: allDay,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      website_url: websiteUrl.trim() || null,
      price_info: priceInfo.trim() || null,
      is_free: isFree,
      is_accessible: isAccessible,
      is_dog_friendly: isDogFriendly,
      is_child_friendly: isChildFriendly,
      is_vegan_friendly: isVeganFriendly,
      created_by: user.id,
      is_approved: false, // Needs admin approval
    });

    if (insertError) {
      console.error("Error creating event:", insertError);
      setError("Failed to create event. Please try again.");
    } else {
      setIsSuccess(true);
    }

    setIsSubmitting(false);
  };

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

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="max-w-md border-bone bg-cream">
            <CardContent className="pt-6 text-center">
              <Calendar className="mx-auto h-12 w-12 text-stone/30 mb-4" />
              <h2 className="font-serif text-xl font-bold text-granite mb-2">
                Login Required
              </h2>
              <p className="text-stone mb-4">
                Please log in to submit an event.
              </p>
              <Link href="/login?redirect=/events/create">
                <Button className="bg-granite text-parchment hover:bg-slate">
                  Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="max-w-md border-bone bg-cream text-center">
            <CardContent className="pt-6">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h2 className="font-serif text-xl font-bold text-granite mb-2">
                Event Submitted!
              </h2>
              <p className="text-stone mb-4">
                Thank you! Your event has been submitted for review and will appear once approved.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/events">
                  <Button variant="outline" className="border-granite text-granite">
                    View Events
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setTitle("");
                    setDescription("");
                    setStartDate("");
                    setStartTime("");
                    setEndDate("");
                    setEndTime("");
                  }}
                  className="bg-granite text-parchment hover:bg-slate"
                >
                  Add Another
                </Button>
              </div>
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
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/events"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>

          <Card className="border-bone bg-cream">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl text-granite">
                <Calendar className="h-6 w-6 text-copper" />
                Submit an Event
              </CardTitle>
              <CardDescription>
                Share a local event with the community. Events are reviewed before publishing.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Event Details
                  </h3>

                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Newlyn Fish Festival"
                      className="border-bone"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell people what the event is about..."
                      className="border-bone"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="image">Image URL (optional)</Label>
                    <Input
                      id="image"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="border-bone"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h3>

                  <div>
                    <Label htmlFor="location">Town/Village *</Label>
                    <Select value={locationName} onValueChange={setLocationName} required>
                      <SelectTrigger className="border-bone">
                        <SelectValue placeholder="Select a location" />
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

                  <div>
                    <Label htmlFor="address">Full Address (optional)</Label>
                    <Input
                      id="address"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="e.g., Newlyn Harbour, Penzance TR18 5HN"
                      className="border-bone"
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Date & Time
                  </h3>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="allDay"
                      checked={allDay}
                      onCheckedChange={(c) => setAllDay(c === true)}
                    />
                    <Label htmlFor="allDay" className="cursor-pointer">All-day event</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-bone"
                        required
                      />
                    </div>
                    {!allDay && (
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="border-bone"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="endDate">End Date (optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-bone"
                      />
                    </div>
                    {!allDay && (
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="border-bone"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="border-bone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input
                        id="contactPhone"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="border-bone"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="border-bone"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://..."
                      className="border-bone"
                    />
                  </div>
                </div>

                {/* Price & Amenities */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <PoundSterling className="h-4 w-4" />
                    Price & Amenities
                  </h3>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isFree"
                      checked={isFree}
                      onCheckedChange={(c) => setIsFree(c === true)}
                    />
                    <Label htmlFor="isFree" className="cursor-pointer">Free event</Label>
                  </div>

                  {!isFree && (
                    <div>
                      <Label htmlFor="price">Price Info</Label>
                      <Input
                        id="price"
                        value={priceInfo}
                        onChange={(e) => setPriceInfo(e.target.value)}
                        placeholder="e.g., £5 adults, £3 children"
                        className="border-bone"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={isAccessible} onCheckedChange={(c) => setIsAccessible(c === true)} />
                      <Accessibility className="h-4 w-4 text-blue-600" />
                      Wheelchair Accessible
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={isDogFriendly} onCheckedChange={(c) => setIsDogFriendly(c === true)} />
                      <Dog className="h-4 w-4 text-amber-600" />
                      Dog Friendly
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={isChildFriendly} onCheckedChange={(c) => setIsChildFriendly(c === true)} />
                      <Baby className="h-4 w-4 text-pink-600" />
                      Child Friendly
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={isVeganFriendly} onCheckedChange={(c) => setIsVeganFriendly(c === true)} />
                      <Leaf className="h-4 w-4 text-green-600" />
                      Vegan Options
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-granite text-parchment hover:bg-slate gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Submit Event for Review
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-stone">
                  Events are reviewed by our team before being published. This usually takes 24-48 hours.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
