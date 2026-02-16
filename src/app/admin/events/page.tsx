"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Pencil,
  Globe,
  Mail,
  Phone,
  User,
  PoundSterling,
  Baby,
  Dog,
  Accessibility,
  Leaf,
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  Repeat,
  Tag,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { ImageCropDialog } from "@/components/story/image-crop-dialog";
import { EVENT_CATEGORIES, type RecurrencePattern } from "@/lib/events/types";

interface EventImage {
  id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
  display_order: number;
}

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
  is_free: boolean;
  price_info: string | null;
  is_child_friendly: boolean;
  is_dog_friendly: boolean;
  is_accessible: boolean;
  is_vegan_friendly: boolean;
  website_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  category: string | null;
  source_url: string | null;
  recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  excluded_dates: string[];
  created_at: string;
  created_by: string;
  creator?: {
    display_name: string | null;
    email: string | null;
  };
}

interface EditForm {
  title: string;
  description: string;
  location_name: string;
  location_address: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  is_free: boolean;
  price_info: string;
  is_child_friendly: boolean;
  is_dog_friendly: boolean;
  is_accessible: boolean;
  is_vegan_friendly: boolean;
  website_url: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  category: string;
  source_url: string;
  recurring: boolean;
  recurrence_pattern: string;
  recurrence_end_date: string;
  excluded_dates: string[];
}

export default function AdminEventsPage() {
  const { user, isAdmin, isModerator, isLoading: userLoading } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    description: "",
    location_name: "",
    location_address: "",
    starts_at: "",
    ends_at: "",
    all_day: false,
    is_free: false,
    price_info: "",
    is_child_friendly: false,
    is_dog_friendly: false,
    is_accessible: false,
    is_vegan_friendly: false,
    website_url: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    category: "",
    source_url: "",
    recurring: false,
    recurrence_pattern: "",
    recurrence_end_date: "",
    excluded_dates: [],
  });
  const [excludeDateInput, setExcludeDateInput] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Image management state
  const [eventImages, setEventImages] = useState<EventImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!userLoading && isModerator) {
      loadEvents();
    }
  }, [userLoading, isModerator, loadEvents]);

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

  // Format datetime for input
  const formatDateTimeForInput = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    return date.toISOString().slice(0, 16);
  };

  // Load images for an event
  const loadEventImages = async (eventId: string) => {
    setIsLoadingImages(true);
    const supabase = createClient();
    
    const { data, error } = await (supabase.from("event_images") as any)
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true });
    
    if (error) {
      console.error("Error loading images:", error);
      setEventImages([]);
    } else {
      setEventImages(data || []);
    }
    setIsLoadingImages(false);
  };

  // Handle file selection - open crop dialog
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEvent) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError("Image must be less than 5MB");
      return;
    }

    // Open crop dialog
    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setShowCropDialog(true);
    setEditError(null);
  };

  // Upload cropped image
  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!editingEvent) return;

    setShowCropDialog(false);
    setImageToCrop(null);
    setIsUploadingImage(true);
    const supabase = createClient();

    try {
      const croppedFile = new File([croppedBlob], "event-image.jpg", { type: "image/jpeg" });
      
      // Upload to storage
      const fileName = `events/${editingEvent.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(fileName, croppedFile, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("story-media")
        .getPublicUrl(fileName);

      // Add to event_images table
      const isPrimary = eventImages.length === 0;
      const { error: insertError } = await (supabase.from("event_images") as any)
        .insert({
          event_id: editingEvent.id,
          image_url: urlData.publicUrl,
          is_primary: isPrimary,
          display_order: eventImages.length,
        });

      if (insertError) throw insertError;

      // Reload images
      await loadEventImages(editingEvent.id);
      
      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Upload error:", err);
      setEditError(`Failed to upload image: ${err.message}`);
    }
    setIsUploadingImage(false);
  };

  // Delete image
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;
    
    const supabase = createClient();
    const { error } = await (supabase.from("event_images") as any)
      .delete()
      .eq("id", imageId);

    if (error) {
      console.error("Error deleting image:", error);
    } else if (editingEvent) {
      await loadEventImages(editingEvent.id);
    }
  };

  // Set image as primary
  const handleSetPrimary = async (imageId: string) => {
    if (!editingEvent) return;
    
    const supabase = createClient();
    const { error } = await (supabase.from("event_images") as any)
      .update({ is_primary: true })
      .eq("id", imageId);

    if (error) {
      console.error("Error setting primary:", error);
    } else {
      await loadEventImages(editingEvent.id);
    }
  };

  // Open edit dialog
  const openEditDialog = async (event: Event) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description || "",
      location_name: event.location_name,
      location_address: event.location_address || "",
      starts_at: formatDateTimeForInput(event.starts_at),
      ends_at: formatDateTimeForInput(event.ends_at),
      all_day: event.all_day ?? false,
      is_free: event.is_free ?? false,
      price_info: event.price_info || "",
      is_child_friendly: event.is_child_friendly ?? false,
      is_dog_friendly: event.is_dog_friendly ?? false,
      is_accessible: event.is_accessible ?? false,
      is_vegan_friendly: event.is_vegan_friendly ?? false,
      website_url: event.website_url || "",
      contact_name: event.contact_name || "",
      contact_email: event.contact_email || "",
      contact_phone: event.contact_phone || "",
      category: (event.category || "").toLowerCase(),
      source_url: event.source_url || "",
      recurring: event.recurring ?? false,
      recurrence_pattern: (event.recurrence_pattern || "").toLowerCase(),
      recurrence_end_date: event.recurrence_end_date || "",
      excluded_dates: event.excluded_dates || [],
    });
    setExcludeDateInput("");
    setEditError(null);
    setEventImages([]);
    setEditDialogOpen(true);
    
    // Load images for this event
    await loadEventImages(event.id);
  };

  // Save edited event
  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    if (!editForm.title.trim() || !editForm.location_name.trim() || !editForm.starts_at) {
      setEditError("Title, location, and start date are required");
      return;
    }

    setIsSaving(true);
    setEditError(null);
    const supabase = createClient();

    const { error } = await (supabase.from("events") as any)
      .update({
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        location_name: editForm.location_name.trim(),
        location_address: editForm.location_address.trim() || null,
        starts_at: new Date(editForm.starts_at).toISOString(),
        ends_at: editForm.ends_at ? new Date(editForm.ends_at).toISOString() : null,
        all_day: editForm.all_day,
        is_free: editForm.is_free,
        price_info: editForm.price_info.trim() || null,
        is_child_friendly: editForm.is_child_friendly,
        is_dog_friendly: editForm.is_dog_friendly,
        is_accessible: editForm.is_accessible,
        is_vegan_friendly: editForm.is_vegan_friendly,
        website_url: editForm.website_url.trim() || null,
        contact_name: editForm.contact_name.trim() || null,
        contact_email: editForm.contact_email.trim() || null,
        contact_phone: editForm.contact_phone.trim() || null,
        category: editForm.category || null,
        source_url: editForm.source_url.trim() || null,
        recurring: editForm.recurring,
        recurrence_pattern: editForm.recurring ? editForm.recurrence_pattern || null : null,
        recurrence_end_date: editForm.recurring && editForm.recurrence_end_date ? editForm.recurrence_end_date : null,
        excluded_dates: editForm.recurring && editForm.excluded_dates.length > 0 ? editForm.excluded_dates : [],
      })
      .eq("id", editingEvent.id);

    if (error) {
      console.error("Error updating event:", error);
      setEditError(`Failed to update: ${error.message}`);
    } else {
      setEditDialogOpen(false);
      setEditingEvent(null);
      await loadEvents();
    }
    setIsSaving(false);
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

  if (!isModerator) {
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
                  {event.recurring && (
                    <Badge className="bg-blue-600 text-white text-xs flex items-center gap-1">
                      <Repeat className="h-3 w-3" />
                      {event.recurrence_pattern || 'Recurring'}
                    </Badge>
                  )}
                  {event.category && (
                    <Badge variant="outline" className="border-bone text-stone text-xs">
                      {event.category}
                    </Badge>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditDialog(event)}
                className="border-bone gap-1"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
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

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingEvent(null);
          setEditError(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {editError}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="border-bone"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="border-bone"
                rows={3}
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location-name">Location Name *</Label>
                <Input
                  id="edit-location-name"
                  value={editForm.location_name}
                  onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                  className="border-bone"
                  placeholder="e.g. Truro, St Ives"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location-address">Full Address</Label>
                <Input
                  id="edit-location-address"
                  value={editForm.location_address}
                  onChange={(e) => setEditForm({ ...editForm, location_address: e.target.value })}
                  className="border-bone"
                  placeholder="e.g. High Street, Truro TR1 2AB"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-starts-at">Start Date & Time *</Label>
                  <Input
                    id="edit-starts-at"
                    type="datetime-local"
                    value={editForm.starts_at}
                    onChange={(e) => setEditForm({ ...editForm, starts_at: e.target.value })}
                    className="border-bone"
                    disabled={editForm.all_day}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ends-at">End Date & Time</Label>
                  <Input
                    id="edit-ends-at"
                    type="datetime-local"
                    value={editForm.ends_at}
                    onChange={(e) => setEditForm({ ...editForm, ends_at: e.target.value })}
                    className="border-bone"
                    disabled={editForm.all_day}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-parchment border border-bone">
                <Checkbox
                  id="edit-all-day"
                  checked={editForm.all_day}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, all_day: checked === true })}
                />
                <Label htmlFor="edit-all-day" className="cursor-pointer flex items-center gap-2">
                  <Clock className="h-4 w-4 text-stone" />
                  All Day Event
                </Label>
              </div>
            </div>

            {/* Price Info */}
            <div className="space-y-4 pt-4 border-t border-bone">
              <h4 className="text-sm font-medium text-granite flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Pricing
              </h4>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-parchment border border-bone">
                <Checkbox
                  id="edit-free"
                  checked={editForm.is_free}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_free: checked === true, price_info: checked ? "" : editForm.price_info })}
                />
                <Label htmlFor="edit-free" className="cursor-pointer flex items-center gap-2">
                  <PoundSterling className="h-4 w-4 text-green-600" />
                  Free Event
                </Label>
              </div>
              {!editForm.is_free && (
                <div className="space-y-2">
                  <Label htmlFor="edit-price-info">Price Information</Label>
                  <Input
                    id="edit-price-info"
                    value={editForm.price_info}
                    onChange={(e) => setEditForm({ ...editForm, price_info: e.target.value })}
                    className="border-bone"
                    placeholder="e.g. £15 adults, £8 children, Family £35"
                  />
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-4 pt-4 border-t border-bone">
              <h4 className="text-sm font-medium text-granite flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contact-name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Name
                  </Label>
                  <Input
                    id="edit-contact-name"
                    value={editForm.contact_name}
                    onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                    className="border-bone"
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.contact_email}
                    onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                    className="border-bone"
                    placeholder="info@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Phone
                  </Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editForm.contact_phone}
                    onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                    className="border-bone"
                    placeholder="01234 567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website URL
                  </Label>
                  <Input
                    id="edit-website"
                    value={editForm.website_url}
                    onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                    className="border-bone"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-source-url" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Source URL
                  </Label>
                  <Input
                    id="edit-source-url"
                    value={editForm.source_url}
                    onChange={(e) => setEditForm({ ...editForm, source_url: e.target.value })}
                    className="border-bone"
                    placeholder="https://... (original event listing)"
                  />
                </div>
              </div>
            </div>

            {/* Category & Recurrence */}
            <div className="space-y-3 pt-4 border-t border-bone">
              <h4 className="text-sm font-medium text-granite flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Category & Recurrence
              </h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editForm.category || undefined} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
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

                <div className="flex items-center gap-3 p-3 rounded-lg bg-parchment border border-bone">
                  <Checkbox
                    id="edit-recurring"
                    checked={editForm.recurring}
                    onCheckedChange={(checked) => setEditForm({
                      ...editForm,
                      recurring: checked === true,
                      ...(checked !== true ? { recurrence_pattern: "", recurrence_end_date: "", excluded_dates: [] } : {}),
                    })}
                  />
                  <Label htmlFor="edit-recurring" className="cursor-pointer flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-copper" />
                    Recurring Event
                  </Label>
                </div>

                {editForm.recurring && (
                  <>
                    <div className="space-y-2">
                      <Label>How often?</Label>
                      <Select value={editForm.recurrence_pattern || undefined} onValueChange={(v) => setEditForm({ ...editForm, recurrence_pattern: v })}>
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
                    <div className="space-y-2">
                      <Label>Repeats until (optional)</Label>
                      <Input
                        type="date"
                        value={editForm.recurrence_end_date}
                        onChange={(e) => setEditForm({ ...editForm, recurrence_end_date: e.target.value })}
                        className="border-bone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Skip specific dates</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          type="date"
                          value={excludeDateInput}
                          onChange={(e) => setExcludeDateInput(e.target.value)}
                          className="border-bone flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-bone"
                          onClick={() => {
                            if (excludeDateInput && !editForm.excluded_dates.includes(excludeDateInput)) {
                              setEditForm({
                                ...editForm,
                                excluded_dates: [...editForm.excluded_dates, excludeDateInput].sort(),
                              });
                              setExcludeDateInput("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {editForm.excluded_dates.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {editForm.excluded_dates.map(date => (
                            <Badge
                              key={date}
                              variant="outline"
                              className="border-bone text-stone gap-1 cursor-pointer hover:border-red-300"
                              onClick={() => setEditForm({
                                ...editForm,
                                excluded_dates: editForm.excluded_dates.filter(d => d !== date),
                              })}
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
            </div>

            {/* Images */}
            <div className="space-y-3 pt-4 border-t border-bone">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-granite flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Event Images
                </h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="gap-1"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  Add Image
                </Button>
              </div>

              {isLoadingImages ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-stone" />
                </div>
              ) : eventImages.length === 0 ? (
                <p className="text-sm text-stone text-center py-4">
                  No images yet. Add images to make your event stand out!
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {eventImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden border border-bone">
                        <img
                          src={img.image_url}
                          alt="Event"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {img.is_primary && (
                        <Badge className="absolute top-1 left-1 bg-copper text-parchment text-xs">
                          Primary
                        </Badge>
                      )}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.is_primary && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-6 w-6 p-0"
                            onClick={() => handleSetPrimary(img.id)}
                            title="Set as primary"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteImage(img.id)}
                          title="Delete"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="space-y-3 pt-4 border-t border-bone">
              <h4 className="text-sm font-medium text-granite flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                Amenities & Accessibility
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-parchment border border-bone">
                  <Checkbox
                    id="edit-child"
                    checked={editForm.is_child_friendly}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, is_child_friendly: checked === true })}
                  />
                  <Label htmlFor="edit-child" className="cursor-pointer flex items-center gap-2">
                    <Baby className="h-4 w-4 text-pink-600" />
                    Child Friendly
                  </Label>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-parchment border border-bone">
                  <Checkbox
                    id="edit-dog"
                    checked={editForm.is_dog_friendly}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, is_dog_friendly: checked === true })}
                  />
                  <Label htmlFor="edit-dog" className="cursor-pointer flex items-center gap-2">
                    <Dog className="h-4 w-4 text-amber-600" />
                    Dog Friendly
                  </Label>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-parchment border border-bone">
                  <Checkbox
                    id="edit-accessible"
                    checked={editForm.is_accessible}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, is_accessible: checked === true })}
                  />
                  <Label htmlFor="edit-accessible" className="cursor-pointer flex items-center gap-2">
                    <Accessibility className="h-4 w-4 text-blue-600" />
                    Wheelchair Accessible
                  </Label>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-parchment border border-bone">
                  <Checkbox
                    id="edit-vegan"
                    checked={editForm.is_vegan_friendly}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, is_vegan_friendly: checked === true })}
                  />
                  <Label htmlFor="edit-vegan" className="cursor-pointer flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    Vegan Options
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={!editForm.title.trim() || !editForm.location_name.trim() || !editForm.starts_at || isSaving}
              className="bg-granite text-parchment hover:bg-slate"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Crop Dialog */}
      {imageToCrop && (
        <ImageCropDialog
          open={showCropDialog}
          onOpenChange={(open) => {
            setShowCropDialog(open);
            if (!open) {
              setImageToCrop(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }
          }}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
        />
      )}

      <Footer />
    </div>
  );
}
