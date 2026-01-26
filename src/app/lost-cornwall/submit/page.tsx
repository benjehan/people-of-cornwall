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
import {
  ArrowLeft,
  Camera,
  MapPin,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Upload,
  X,
  Clock,
  FileText,
  Plus,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { ImageCropDialog } from "@/components/story/image-crop-dialog";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  caption: string;
  isPrimary: boolean;
}

export default function SubmitLostCornwallPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [yearTaken, setYearTaken] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [sourceCredit, setSourceCredit] = useState("");
  
  // Multiple images state
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [currentCropIndex, setCurrentCropIndex] = useState<number | null>(null);
  
  const [hasImageRights, setHasImageRights] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check total count
    if (images.length + files.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Please select only image files");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Each image must be less than 10MB");
        return;
      }
    }

    // Open crop dialog for first file (one at a time)
    const objectUrl = URL.createObjectURL(files[0]);
    setImageToCrop(objectUrl);
    setCurrentCropIndex(images.length);
    setShowCropDialog(true);
    setError(null);
    
    // Clear input for next selection
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], `historic-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    const preview = URL.createObjectURL(croppedBlob);
    
    const newImage: ImageItem = {
      id: `img-${Date.now()}`,
      file: croppedFile,
      preview,
      caption: "",
      isPrimary: images.length === 0, // First image is primary by default
    };
    
    setImages(prev => [...prev, newImage]);
    setShowCropDialog(false);
    setImageToCrop(null);
    setCurrentCropIndex(null);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // Ensure at least one primary if images remain
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryImage = (id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === id,
    })));
  };

  const updateCaption = (id: string, caption: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, caption } : img
    ));
  };

  const uploadImages = async (): Promise<{ url: string; caption: string; isPrimary: boolean }[]> => {
    if (images.length === 0) return [];

    setIsUploadingImages(true);
    const supabase = createClient();
    const uploadedImages: { url: string; caption: string; isPrimary: boolean }[] = [];

    try {
      for (const image of images) {
        const fileExt = image.file.name.split(".").pop();
        const fileName = `lost-cornwall/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("story-media")
          .upload(fileName, image.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("story-media")
          .getPublicUrl(fileName);

        uploadedImages.push({
          url: publicUrl,
          caption: image.caption,
          isPrimary: image.isPrimary,
        });
      }

      return uploadedImages;
    } catch (err) {
      console.error("Error uploading images:", err);
      throw new Error("Failed to upload images");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (images.length === 0) {
      setError("Please upload at least one historic photo");
      return;
    }
    if (!hasImageRights) {
      setError("Please confirm you have the rights to use these images");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const uploadedImages = await uploadImages();
      if (uploadedImages.length === 0) throw new Error("Failed to upload images");

      const supabase = createClient();
      const primaryImage = uploadedImages.find(img => img.isPrimary) || uploadedImages[0];

      // Create the main entry with primary image
      const { data, error: insertError } = await (supabase.from("lost_cornwall") as any)
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          image_url: primaryImage.url,
          year_taken: yearTaken.trim() || null,
          location_name: locationName || null,
          location_lat: locationLat,
          location_lng: locationLng,
          source_credit: sourceCredit.trim() || null,
          created_by: user.id,
          submitter_email: user.email,
          is_published: false,
          is_pending: true,
          has_image_rights: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert additional images into lost_cornwall_images table
      if (uploadedImages.length > 0) {
        const imageInserts = uploadedImages.map((img, index) => ({
          lost_cornwall_id: data.id,
          image_url: img.url,
          caption: img.caption || null,
          is_primary: img.isPrimary,
          display_order: index,
        }));

        const { error: imagesError } = await (supabase.from("lost_cornwall_images") as any)
          .insert(imageInserts);

        if (imagesError) {
          console.error("Error inserting additional images:", imagesError);
        }
      }

      // Send notification to admin
      try {
        await fetch("/api/moderation/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "lost_cornwall",
            content: {
              title: title.trim(),
              description: `${description.trim()}\n\nImages: ${uploadedImages.length}`,
              yearTaken: yearTaken.trim(),
              location: locationName,
              imageUrl: primaryImage.url,
            },
            submitterId: user.id,
            submitterEmail: user.email,
            itemId: data.id,
          }),
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Error submitting photos:", err);
      setError("Failed to submit photos. Please try again.");
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
              <Camera className="mx-auto h-12 w-12 text-stone/30 mb-4" />
              <h2 className="font-serif text-xl font-bold text-granite mb-2">
                Login Required
              </h2>
              <p className="text-stone mb-4">
                Please log in to submit historic photos.
              </p>
              <Link href="/login?redirect=/lost-cornwall/submit">
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
                Photos Submitted!
              </h2>
              <p className="text-stone mb-4">
                Thank you for sharing these pieces of history! Your photos have been submitted for review. 
                Our team will review them and you'll receive an email once they're approved.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/lost-cornwall">
                  <Button variant="outline" className="border-granite text-granite">
                    View Gallery
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setTitle("");
                    setDescription("");
                    setYearTaken("");
                    setLocationName("");
                    setLocationLat(null);
                    setLocationLng(null);
                    setSourceCredit("");
                    setImages([]);
                    setHasImageRights(false);
                  }}
                  className="bg-granite text-parchment hover:bg-slate"
                >
                  Submit More
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
            href="/lost-cornwall"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to gallery
          </Link>

          <Card className="border-bone bg-cream">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl text-granite">
                <Camera className="h-6 w-6 text-sepia" />
                Share Historic Photos
              </CardTitle>
              <CardDescription>
                Help preserve Cornwall's visual history by sharing old photographs from your family collection.
                You can upload up to 10 images for a single entry.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Photo Upload */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Historic Photos * <span className="text-xs text-stone font-normal">({images.length}/10)</span>
                  </h3>
                  <p className="text-sm text-stone">
                    Upload scans or photos of the historic images. You can add multiple related photos.
                    Click the star to set the primary image for the thumbnail.
                  </p>

                  {/* Image Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt="Preview"
                          className={`w-full aspect-square object-cover rounded-lg border-2 sepia-[0.2] ${
                            image.isPrimary ? "border-sepia" : "border-bone"
                          }`}
                        />
                        {/* Primary indicator */}
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(image.id)}
                          className={`absolute top-2 left-2 p-1 rounded-full transition-all ${
                            image.isPrimary 
                              ? "bg-sepia text-white" 
                              : "bg-black/50 text-white/70 hover:text-yellow-400"
                          }`}
                          title={image.isPrimary ? "Primary image" : "Set as primary"}
                        >
                          <Star className={`h-4 w-4 ${image.isPrimary ? "fill-current" : ""}`} />
                        </button>
                        {/* Remove button */}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {/* Caption input */}
                        <Input
                          placeholder="Caption (optional)"
                          value={image.caption}
                          onChange={(e) => updateCaption(image.id, e.target.value)}
                          className="mt-1 text-xs border-bone h-7"
                        />
                      </div>
                    ))}
                    
                    {/* Add more button */}
                    {images.length < 10 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-sepia/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-sepia transition-colors bg-sepia/5"
                      >
                        <Plus className="h-8 w-8 text-sepia/60 mb-1" />
                        <p className="text-xs text-stone">Add Photo</p>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Photo Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Photo Details
                  </h3>

                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Newlyn Harbour, fishing boats"
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
                      placeholder="Tell us about these photos... What's happening? Who might be in them?"
                      className="border-bone"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="yearTaken" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Year (e.g., 1920)
                      </Label>
                      <Input
                        id="yearTaken"
                        value={yearTaken}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 4) {
                            setYearTaken(value);
                          }
                        }}
                        placeholder="e.g., 1920"
                        className="border-bone"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sourceCredit">Source/Credit</Label>
                      <Input
                        id="sourceCredit"
                        value={sourceCredit}
                        onChange={(e) => setSourceCredit(e.target.value)}
                        placeholder="e.g., Family collection"
                        className="border-bone"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location (if known)
                  </h3>

                  <div>
                    <Label htmlFor="location">Where was this taken?</Label>
                    <LocationAutocomplete
                      value={locationName}
                      onChange={(location) => {
                        setLocationName(location.name);
                        setLocationLat(location.lat);
                        setLocationLng(location.lng);
                      }}
                      placeholder="Search for location..."
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Image Rights Agreement */}
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
                        I confirm that these are family photos, I own the rights to them, or they are in the public domain, 
                        and I grant People of Cornwall permission to display them on the website.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingImages}
                  className="w-full bg-sepia text-white hover:bg-sepia/90 gap-2 shadow-md"
                >
                  {isSubmitting || isUploadingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isUploadingImages ? "Uploading..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Submit Photos for Review
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-stone">
                  Submissions are reviewed by our team before being added to the gallery.
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
            setCurrentCropIndex(null);
          }
        }}
        imageSrc={imageToCrop || ""}
        onCropComplete={handleCropComplete}
        aspectRatio={4 / 3}
      />

      <Footer />
    </div>
  );
}
