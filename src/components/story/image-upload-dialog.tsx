"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagePlus, Loader2, Upload, Camera, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (url: string, attribution?: string) => void;
  storyId?: string;
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  onUpload,
  storyId,
}: ImageUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [attribution, setAttribution] = useState("");
  const [hasRights, setHasRights] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !hasRights) return;

    setIsUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to upload images");
        setIsUploading(false);
        return;
      }

      // Create unique filename
      const ext = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${storyId || "drafts"}/${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        if (
          uploadError.message?.includes("bucket") ||
          uploadError.message?.includes("not found")
        ) {
          setError(
            "Storage not available. Please contact an administrator."
          );
        } else {
          setError(`Upload failed: ${uploadError.message}`);
        }
        setIsUploading(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("story-media").getPublicUrl(data.path);

      // Return the URL and attribution
      onUpload(publicUrl, attribution.trim() || undefined);
      handleClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setAttribution("");
    setHasRights(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Camera className="h-5 w-5" />
            Add an Image
          </DialogTitle>
          <DialogDescription>
            Upload a photo to accompany your story. Old photographs, places, and
            moments are welcome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Selection */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-bone rounded-lg p-8 text-center hover:border-slate transition-colors focus:outline-none focus:ring-2 focus:ring-slate focus:ring-offset-2"
            >
              <Upload className="mx-auto h-10 w-10 text-stone mb-3" />
              <p className="text-sm font-medium text-granite">
                Click to select an image
              </p>
              <p className="text-xs text-stone mt-1">
                JPEG, PNG, GIF or WebP up to 5MB
              </p>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-bone">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-contain"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="w-full text-sm"
              >
                Choose a different image
              </Button>
            </div>
          )}

          {/* Attribution / Source */}
          <div>
            <label className="block text-sm font-medium text-granite mb-1.5">
              Photo credit / source{" "}
              <span className="font-normal text-stone">(optional)</span>
            </label>
            <Input
              value={attribution}
              onChange={(e) => setAttribution(e.target.value)}
              placeholder="e.g. 'Family archive' or 'Taken by John Smith, 1985'"
              className="border-bone"
            />
            <p className="text-xs text-stone mt-1">
              If this is someone else's photo, please credit them
            </p>
          </div>

          {/* Rights Confirmation */}
          <div className="bg-cream rounded-lg p-4 border border-bone">
            <div className="flex items-start gap-3">
              <Checkbox
                id="photo-rights"
                checked={hasRights}
                onCheckedChange={(checked) => setHasRights(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="photo-rights"
                className="text-sm text-granite leading-relaxed cursor-pointer"
              >
                <strong>I confirm</strong> that I own this image, have
                permission to share it, or it is in the public domain. I
                understand it will be visible to the public once my story is
                published.
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-granite text-granite"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !hasRights || isUploading}
            className="bg-granite text-parchment hover:bg-slate gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Add to story
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
