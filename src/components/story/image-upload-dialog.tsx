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
import { ImagePlus, Loader2, Upload, Camera, AlertCircle, Minimize2, Crop } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ImageCropDialog } from "./image-crop-dialog";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (url: string, attribution?: string) => void;
  storyId?: string;
}

// Maximum dimensions for uploaded images
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const JPEG_QUALITY = 0.85;

/**
 * Compress and resize an image file using Canvas API
 * Returns a compressed Blob
 */
async function compressImage(file: File): Promise<{ blob: Blob; wasCompressed: boolean }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas not supported"));
      return;
    }

    img.onload = () => {
      let { width, height } = img;
      let wasCompressed = false;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        wasCompressed = true;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas (this also strips EXIF data which can be huge)
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // If still too large, reduce quality further
            if (blob.size > MAX_FILE_SIZE) {
              canvas.toBlob(
                (smallerBlob) => {
                  if (smallerBlob) {
                    resolve({ blob: smallerBlob, wasCompressed: true });
                  } else {
                    reject(new Error("Failed to compress image"));
                  }
                },
                "image/jpeg",
                0.7 // Lower quality for very large images
              );
            } else {
              resolve({ blob, wasCompressed: wasCompressed || blob.size < file.size });
            }
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  onUpload,
  storyId,
}: ImageUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null); // For cropper
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [attribution, setAttribution] = useState("");
  const [hasRights, setHasRights] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    original: number;
    compressed: number;
    wasCompressed: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    setError(null);
    setSelectedFile(file);
    setIsCompressing(true);
    setCompressionInfo(null);

    try {
      // Compress the image
      const { blob, wasCompressed } = await compressImage(file);
      
      setCompressedBlob(blob);
      setCompressionInfo({
        original: file.size,
        compressed: blob.size,
        wasCompressed,
      });

      // Create preview from compressed blob
      const previewUrl = URL.createObjectURL(blob);
      setPreview(previewUrl);
      setRawPreview(previewUrl); // Store for cropper

      // Check if still too large after compression
      if (blob.size > MAX_FILE_SIZE) {
        setError(`Image is still too large (${formatFileSize(blob.size)}). Please try a smaller image.`);
      }
    } catch (err) {
      console.error("Compression error:", err);
      setError("Failed to process image. Please try a different file.");
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle cropped image
  const handleCropComplete = (croppedBlob: Blob) => {
    setCompressedBlob(croppedBlob);
    const croppedPreview = URL.createObjectURL(croppedBlob);
    setPreview(croppedPreview);
    
    // Update compression info with cropped size
    if (compressionInfo) {
      setCompressionInfo({
        ...compressionInfo,
        compressed: croppedBlob.size,
        wasCompressed: true,
      });
    }
  };

  const handleUpload = async () => {
    if (!compressedBlob || !hasRights) return;

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

      // Create unique filename (always .jpg since we compress to JPEG)
      const fileName = `${user.id}/${storyId || "drafts"}/${Date.now()}.jpg`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(fileName, compressedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
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
    setCompressedBlob(null);
    setPreview(null);
    setRawPreview(null);
    setShowCropDialog(false);
    setAttribution("");
    setHasRights(false);
    setError(null);
    setCompressionInfo(null);
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
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="w-full border-2 border-dashed border-bone rounded-lg p-8 text-center hover:border-slate transition-colors focus:outline-none focus:ring-2 focus:ring-slate focus:ring-offset-2 disabled:opacity-50"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="mx-auto h-10 w-10 text-stone mb-3 animate-spin" />
                  <p className="text-sm font-medium text-granite">
                    Processing image...
                  </p>
                  <p className="text-xs text-stone mt-1">
                    Optimizing for upload
                  </p>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-10 w-10 text-stone mb-3" />
                  <p className="text-sm font-medium text-granite">
                    Click to select an image
                  </p>
                  <p className="text-xs text-stone mt-1">
                    Any size — we'll automatically optimize it
                  </p>
                </>
              )}
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
              
              {/* Compression info */}
              {compressionInfo && compressionInfo.wasCompressed && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2">
                  <Minimize2 className="h-3 w-3 flex-shrink-0" />
                  <span>
                    Optimized: {formatFileSize(compressionInfo.original)} → {formatFileSize(compressionInfo.compressed)}
                    {" "}({Math.round((1 - compressionInfo.compressed / compressionInfo.original) * 100)}% smaller)
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCropDialog(true)}
                  className="flex-1 text-sm gap-1"
                >
                  <Crop className="h-4 w-4" />
                  Crop & Adjust
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setCompressedBlob(null);
                    setPreview(null);
                    setRawPreview(null);
                    setCompressionInfo(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="flex-1 text-sm"
                >
                  Change Image
                </Button>
              </div>
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
            disabled={!compressedBlob || !hasRights || isUploading || (compressedBlob && compressedBlob.size > MAX_FILE_SIZE)}
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

      {/* Crop Dialog */}
      {rawPreview && (
        <ImageCropDialog
          open={showCropDialog}
          onOpenChange={setShowCropDialog}
          imageSrc={rawPreview}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
        />
      )}
    </Dialog>
  );
}
