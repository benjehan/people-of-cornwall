"use client";

import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Upload,
  Link as LinkIcon,
  X,
  Repeat,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EVENT_CATEGORIES, type RecurrencePattern } from "@/lib/events/types";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import Image from "next/image";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { ImageCropDialog } from "@/components/story/image-crop-dialog";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  // Multiple images support
  const [images, setImages] = useState<Array<{ file: File | null; preview: string; url?: string }>>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [hasImageRights, setHasImageRights] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
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
  const [category, setCategory] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | "">("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [excludeDateInput, setExcludeDateInput] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    // Validate max images (5)
    if (images.length >= 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    // Open crop dialog
    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setShowCropDialog(true);
    setError(null);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], `event-image-${Date.now()}.jpg`, { type: "image/jpeg" });
    const preview = URL.createObjectURL(croppedBlob);
    setImages(prev => [...prev, { file: croppedFile, preview }]);
    setShowCropDialog(false);
    setImageToCrop(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImages = async (eventId: string): Promise<void> => {
    if (images.length === 0) return;

    setIsUploadingImage(true);
    const supabase = createClient();

    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        let imageUrl = img.url;

        // Upload file if it's a new upload
        if (img.file) {
          const fileExt = img.file.name.split(".").pop();
          const fileName = `events/${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("story-media")
            .upload(fileName, img.file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("story-media")
            .getPublicUrl(fileName);

          imageUrl = publicUrl;
        }

        // Insert into event_images table
        await (supabase.from("event_images") as any).insert({
          event_id: eventId,
          image_url: imageUrl,
          is_primary: i === 0, // First image is primary
          display_order: i,
        });
      }
    } catch (err) {
      console.error("Error uploading images:", err);
      throw new Error("Failed to upload images");
    } finally {
      setIsUploadingImage(false);
    }
  };

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

    try {
      const supabase = createClient();

      // Combine date and time
      const startsAt = allDay 
        ? `${startDate}T00:00:00`
        : `${startDate}T${startTime || "00:00"}:00`;
      
      const endsAt = endDate 
        ? (allDay ? `${endDate}T23:59:59` : `${endDate}T${endTime || "23:59"}:00`)
        : null;

      // Create event first (without image_url - images go to event_images table)
      const { data: eventData, error: insertError } = await (supabase.from("events") as any)
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          location_name: locationName,
          location_lat: locationLat,
          location_lng: locationLng,
          location_address: locationAddress.trim() || null,
          image_url: null, // Images now stored in event_images table
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
          category: category || null,
          source_url: sourceUrl.trim() || null,
          recurring,
          recurrence_pattern: recurring ? recurrencePattern || null : null,
          recurrence_end_date: recurring && recurrenceEndDate ? recurrenceEndDate : null,
          excluded_dates: recurring && excludedDates.length > 0 ? excludedDates : [],
          created_by: user.id,
          is_approved: false, // Needs admin approval
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Upload images to event_images table
      if (images.length > 0) {
        await uploadImages(eventData.id);
      }

      // Run moderation check and notify admin
      try {
        await fetch("/api/moderation/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "event",
            content: {
              title: title.trim(),
              description: description.trim(),
              imageCount: images.length,
            },
            submitterId: user.id,
            submitterEmail: user.email,
            itemId: eventData.id,
          }),
        });
      } catch (notifyError) {
        console.error("Failed to run moderation:", notifyError);
        // Don't fail the submission if moderation fails
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
                Thank you! Your event has been submitted for review. Our team will review it and you'll receive an email once it's approved.
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
                    setCategory("");
                    setStartDate("");
                    setStartTime("");
                    setEndDate("");
                    setEndTime("");
                    setRecurring(false);
                    setRecurrencePattern("");
                    setRecurrenceEndDate("");
                    setExcludedDates([]);
                    setSourceUrl("");
                    clearAllImages();
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
                    <Label htmlFor="category">Category</Label>
                    <Select value={category || undefined} onValueChange={setCategory}>
                      <SelectTrigger className="border-bone">
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image Upload - Multiple Images */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Event Images (optional)</Label>
                      <span className="text-xs text-stone">{images.length}/5 images</span>
                    </div>
                    
                    {/* Image Gallery */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {images.map((img, index) => (
                          <div key={index} className="relative group aspect-video">
                            <img
                              src={img.preview}
                              alt={`Event image ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg border border-bone"
                            />
                            {index === 0 && (
                              <span className="absolute top-1 left-1 bg-copper text-parchment text-xs px-2 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Image Button */}
                    {images.length < 5 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-bone rounded-lg p-6 text-center cursor-pointer hover:border-granite transition-colors"
                      >
                        <ImageIcon className="h-8 w-8 text-stone mx-auto mb-2" />
                        <p className="text-sm text-stone">
                          {images.length === 0 ? "Click to add images" : "Add another image"}
                        </p>
                        <p className="text-xs text-silver mt-1">
                          Max 5MB per image, JPG/PNG. First image will be the primary.
                        </p>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
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
                    <Label htmlFor="location">Location *</Label>
                    <LocationAutocomplete
                      value={locationName}
                      onChange={(location) => {
                        setLocationName(location.name);
                        setLocationLat(location.lat);
                        setLocationLng(location.lng);
                      }}
                      placeholder="Search for a location in Cornwall..."
                      className="mt-1"
                    />
                    <p className="text-xs text-stone mt-1">
                      Start typing to search for places in Cornwall
                    </p>
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

                {/* Recurrence */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Repeat (optional)
                  </h3>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="recurring"
                      checked={recurring}
                      onCheckedChange={(c) => {
                        setRecurring(c === true);
                        if (!c) {
                          setRecurrencePattern("");
                          setRecurrenceEndDate("");
                          setExcludedDates([]);
                        }
                      }}
                    />
                    <Label htmlFor="recurring" className="cursor-pointer">This event repeats</Label>
                  </div>

                  {recurring && (
                    <>
                      <div>
                        <Label htmlFor="recurrencePattern">How often?</Label>
                        <Select value={recurrencePattern || undefined} onValueChange={(v) => setRecurrencePattern(v as RecurrencePattern)}>
                          <SelectTrigger className="border-bone">
                            <SelectValue placeholder="Select frequency..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="fortnightly">Fortnightly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="recurrenceEnd">Repeats until (optional)</Label>
                        <Input
                          id="recurrenceEnd"
                          type="date"
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          min={startDate}
                          className="border-bone"
                        />
                        <p className="text-xs text-stone mt-1">Leave blank to repeat indefinitely</p>
                      </div>

                      <div>
                        <Label>Skip specific dates</Label>
                        <p className="text-xs text-stone mb-2">
                          Add dates when this event won&apos;t happen (e.g., school holidays)
                        </p>
                        <div className="flex gap-2 mb-2">
                          <Input
                            type="date"
                            value={excludeDateInput}
                            onChange={(e) => setExcludeDateInput(e.target.value)}
                            min={startDate}
                            className="border-bone flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-bone"
                            onClick={() => {
                              if (excludeDateInput && !excludedDates.includes(excludeDateInput)) {
                                setExcludedDates(prev => [...prev, excludeDateInput].sort());
                                setExcludeDateInput("");
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        {excludedDates.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {excludedDates.map(date => (
                              <Badge
                                key={date}
                                variant="outline"
                                className="border-bone text-stone gap-1 cursor-pointer hover:border-red-300"
                                onClick={() => setExcludedDates(prev => prev.filter(d => d !== date))}
                              >
                                {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                <X className="h-3 w-3" />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
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

                  <div>
                    <Label htmlFor="sourceUrl">Source URL (optional)</Label>
                    <Input
                      id="sourceUrl"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://... (original event listing)"
                      className="border-bone"
                    />
                    <p className="text-xs text-stone mt-1">Link to the original event page if applicable</p>
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

                {/* Image Rights Agreement */}
                {images.length > 0 && (
                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={hasImageRights}
                        onCheckedChange={(c) => setHasImageRights(c === true)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-amber-900">
                          Image Rights Confirmation *
                        </p>
                        <p className="text-xs text-amber-800 mt-1">
                          I confirm that I own the rights to this image or have permission to use it, 
                          and I grant People of Cornwall permission to display it on the website.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage || (images.length > 0 && !hasImageRights)}
                  className="w-full bg-granite text-parchment hover:bg-slate gap-2"
                >
                  {isSubmitting || isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isUploadingImage ? "Uploading image..." : "Submitting..."}
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

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={showCropDialog && !!imageToCrop}
        onOpenChange={(open) => {
          if (!open) {
            setShowCropDialog(false);
            setImageToCrop(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        }}
        imageSrc={imageToCrop || ""}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
      />

      <Footer />
    </div>
  );
}
