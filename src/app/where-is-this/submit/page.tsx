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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  HelpCircle,
  MapPin,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Upload,
  X,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { ImageCropDialog } from "@/components/story/image-crop-dialog";

export default function SubmitWhereIsThisPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  // Answer location (only admin will see)
  const [answerLocationName, setAnswerLocationName] = useState("");
  const [answerLat, setAnswerLat] = useState<number | null>(null);
  const [answerLng, setAnswerLng] = useState<number | null>(null);
  const [answerDescription, setAnswerDescription] = useState("");
  
  // Optional
  const [hint, setHint] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [hasImageRights, setHasImageRights] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setShowCropDialog(true);
    setError(null);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "challenge-image.jpg", { type: "image/jpeg" });
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
      const fileName = `where-is-this/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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
    if (!imageFile) {
      setError("Please upload a photo");
      return;
    }
    if (!answerLocationName || !answerLat || !answerLng) {
      setError("Please select the correct location on the map");
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

      const { data, error: insertError } = await (supabase.from("where_is_this") as any)
        .insert({
          image_url: imageUrl,
          hint: hint.trim() || null,
          difficulty,
          answer_location_name: answerLocationName,
          answer_description: answerDescription.trim() || null,
          answer_lat: answerLat,
          answer_lng: answerLng,
          created_by: user.id,
          submitter_email: user.email,
          is_active: false,
          is_revealed: false,
          is_pending: true,
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
            type: "where_is_this",
            content: {
              answerLocation: answerLocationName,
              hint: hint,
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
      console.error("Error submitting challenge:", err);
      setError("Failed to submit challenge. Please try again.");
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
              <HelpCircle className="mx-auto h-12 w-12 text-stone/30 mb-4" />
              <h2 className="font-serif text-xl font-bold text-granite mb-2">
                Login Required
              </h2>
              <p className="text-stone mb-4">
                Please log in to submit a challenge.
              </p>
              <Link href="/login?redirect=/where-is-this/submit">
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
                Challenge Submitted!
              </h2>
              <p className="text-stone mb-4">
                Thank you! Your "Where Is This?" challenge has been submitted for review. 
                Our team will review it and you'll receive an email once it's approved.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/where-is-this">
                  <Button variant="outline" className="border-granite text-granite">
                    View Challenges
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setImageFile(null);
                    setImagePreview(null);
                    setAnswerLocationName("");
                    setAnswerLat(null);
                    setAnswerLng(null);
                    setHint("");
                    setDifficulty("medium");
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
            href="/where-is-this"
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to challenges
          </Link>

          <Card className="border-bone bg-cream">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl text-granite">
                <HelpCircle className="h-6 w-6 text-atlantic" />
                Submit a Challenge
              </CardTitle>
              <CardDescription>
                Share a mystery photo and challenge the community to guess the location!
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
                    Mystery Photo *
                  </h3>
                  <p className="text-sm text-stone">
                    Upload a photo of a location in Cornwall. Make sure it's interesting but not too obvious!
                  </p>

                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg border border-bone"
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
                      className="border-2 border-dashed border-bone rounded-lg p-8 text-center cursor-pointer hover:border-atlantic transition-colors"
                    >
                      <Upload className="h-8 w-8 text-stone mx-auto mb-2" />
                      <p className="text-sm text-stone">
                        Click to upload your mystery photo
                      </p>
                      <p className="text-xs text-silver mt-1">
                        Max 5MB, JPG/PNG
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

                {/* The Answer (Admin Only) */}
                <div className="space-y-4 p-4 rounded-lg bg-atlantic/5 border border-atlantic/20">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-atlantic" />
                    The Correct Answer
                    <span className="text-xs bg-atlantic/10 text-atlantic px-2 py-0.5 rounded">
                      Only visible to admins
                    </span>
                  </h3>
                  <p className="text-sm text-stone">
                    Tell us where this photo was taken. This will be kept secret until the challenge is revealed!
                  </p>

                  <div>
                    <Label htmlFor="answerLocation">Location *</Label>
                    <LocationAutocomplete
                      value={answerLocationName}
                      onChange={(location) => {
                        setAnswerLocationName(location.name);
                        setAnswerLat(location.lat);
                        setAnswerLng(location.lng);
                      }}
                      placeholder="Search for the exact location..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="answerDescription">What makes this place special? (optional)</Label>
                    <Textarea
                      id="answerDescription"
                      value={answerDescription}
                      onChange={(e) => setAnswerDescription(e.target.value)}
                      placeholder="Share some interesting facts about this location..."
                      className="border-bone"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Optional Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium text-granite flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Challenge Settings
                  </h3>

                  <div>
                    <Label htmlFor="hint">Hint (optional)</Label>
                    <Input
                      id="hint"
                      value={hint}
                      onChange={(e) => setHint(e.target.value)}
                      placeholder="e.g., 'Near a famous lighthouse'"
                      className="border-bone"
                    />
                    <p className="text-xs text-stone mt-1">
                      A small clue to help players
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                      <SelectTrigger className="border-bone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">🟢 Easy - Well-known location</SelectItem>
                        <SelectItem value="medium">🟡 Medium - Requires local knowledge</SelectItem>
                        <SelectItem value="hard">🔴 Hard - Only experts will know</SelectItem>
                      </SelectContent>
                    </Select>
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
                        I confirm that I took this photo myself or have permission to use it, 
                        and I grant People of Cornwall permission to display it on the website.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="w-full bg-atlantic text-white hover:bg-atlantic/90 gap-2 shadow-md"
                >
                  {isSubmitting || isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isUploadingImage ? "Uploading..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Submit Challenge for Review
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-stone">
                  Submissions are reviewed by our team. Approved challenges will be featured in future rounds!
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
