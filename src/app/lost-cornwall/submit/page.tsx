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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { ImageCropDialog } from "@/components/story/image-crop-dialog";

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
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  const [hasImageRights, setHasImageRights] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setShowCropDialog(true);
    setError(null);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "historic-photo.jpg", { type: "image/jpeg" });
    setImageFile(croppedFile);
    setImagePreview(URL.createObjectURL(croppedBlob));
    setShowCropDialog(false);
    setImageToCrop(null);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setIsUploadingImage(true);
    const supabase = createClient();

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `lost-cornwall/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(fileName, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("story-media")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      throw new Error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
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
    if (!imageFile) {
      setError("Please upload a historic photo");
      return;
    }
    if (!hasImageRights) {
      setError("Please confirm you have the rights to use this image");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error("Failed to upload image");

      const supabase = createClient();

      const { data, error: insertError } = await (supabase.from("lost_cornwall") as any)
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
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

      // Send notification to admin
      try {
        await fetch("/api/moderation/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "lost_cornwall",
            content: {
              title: title.trim(),
              description: description.trim(),
              yearTaken: yearTaken.trim(),
              location: locationName,
              imageUrl,
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
      console.error("Error submitting photo:", err);
      setError("Failed to submit photo. Please try again.");
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
                Please log in to submit a historic photo.
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
                Photo Submitted!
              </h2>
              <p className="text-stone mb-4">
                Thank you for sharing this piece of history! Your photo has been submitted for review. 
                Our team will review it and you'll receive an email once it's approved.
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
                    setImageFile(null);
                    setImagePreview(null);
                    setHasImageRights(false);
                  }}
                  className="bg-granite text-parchment hover:bg-slate"
                >
                  Submit Another
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
                Share a Historic Photo
              </CardTitle>
              <CardDescription>
                Help preserve Cornwall's visual history by sharing old photographs from your family collection.
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
                    Historic Photo *
                  </h3>
                  <p className="text-sm text-stone">
                    Upload a scan or photo of the historic image. Higher quality is better!
                  </p>

                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg border border-bone sepia-[0.2]"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={clearImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-sepia/30 rounded-lg p-8 text-center cursor-pointer hover:border-sepia transition-colors bg-sepia/5"
                    >
                      <Upload className="h-8 w-8 text-sepia/60 mx-auto mb-2" />
                      <p className="text-sm text-stone">
                        Click to upload your historic photo
                      </p>
                      <p className="text-xs text-silver mt-1">
                        Max 10MB, JPG/PNG
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
                      placeholder="Tell us about this photo... What's happening? Who might be in it?"
                      className="border-bone"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="yearTaken" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Approximate Date/Year
                      </Label>
                      <Input
                        id="yearTaken"
                        value={yearTaken}
                        onChange={(e) => setYearTaken(e.target.value)}
                        placeholder="e.g., 1920s, circa 1950"
                        className="border-bone"
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
                        I confirm that this is a family photo, I own the rights to it, or it is in the public domain, 
                        and I grant People of Cornwall permission to display it on the website.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="w-full bg-sepia text-white hover:bg-sepia/90 gap-2 shadow-md"
                >
                  {isSubmitting || isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isUploadingImage ? "Uploading..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Submit Photo for Review
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
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
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
