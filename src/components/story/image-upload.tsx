"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  storyId?: string;
}

export function ImageUpload({ onUpload, storyId }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to upload images");
        return;
      }

      // Create unique filename
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}/${storyId || "drafts"}/${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        if (uploadError.message?.includes("bucket") || uploadError.message?.includes("not found")) {
          setError("Storage bucket not found. Please contact an administrator to set up the 'story-media' bucket.");
        } else {
          setError(`Failed to upload image: ${uploadError.message || "Please try again."}`);
        }
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("story-media")
        .getPublicUrl(data.path);

      onUpload(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4" />
            Add Image
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

interface UploadedImageProps {
  url: string;
  onRemove: () => void;
}

export function UploadedImage({ url, onRemove }: UploadedImageProps) {
  return (
    <div className="relative inline-block">
      <Image
        src={url}
        alt="Uploaded image"
        width={200}
        height={150}
        className="rounded-lg object-cover"
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute -right-2 -top-2 h-6 w-6"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
