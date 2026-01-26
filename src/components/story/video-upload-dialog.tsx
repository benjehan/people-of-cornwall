"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Video, Loader2, Upload, AlertCircle, Play, Pause, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (url: string, thumbnailUrl?: string) => void;
  storyId?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for videos
const MAX_DURATION = 120; // 2 minutes max

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoUploadDialog({
  open,
  onOpenChange,
  onUpload,
  storyId,
}: VideoUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [caption, setCaption] = useState("");
  const [hasRights, setHasRights] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file (MP4, MOV, or WebM)");
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`Video is too large (${formatFileSize(file.size)}). Maximum size is 50MB. Consider trimming or compressing your video.`);
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Check video duration
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const videoDuration = video.duration;
      
      if (videoDuration > MAX_DURATION) {
        setWarning(`Video is ${formatDuration(videoDuration)} long. Consider trimming it to under 2 minutes for better loading times.`);
      } else {
        setWarning(null);
      }
      
      setDuration(videoDuration);
    };
    video.src = previewUrl;

    setError(null);
    setSelectedFile(file);
    setPreview(previewUrl);
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !hasRights) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to upload videos");
        setIsUploading(false);
        return;
      }

      // Create unique filename
      const ext = selectedFile.name.split(".").pop() || "mp4";
      const fileName = `${user.id}/${storyId || "drafts"}/video-${Date.now()}.${ext}`;

      // Simulate progress for better UX (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError(`Upload failed: ${uploadError.message}`);
        setIsUploading(false);
        return;
      }

      setUploadProgress(100);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("story-media").getPublicUrl(data.path);

      // Generate thumbnail (capture first frame)
      let thumbnailUrl: string | undefined;
      try {
        thumbnailUrl = await generateThumbnail(preview!);
        if (thumbnailUrl) {
          // Upload thumbnail
          const thumbFileName = `${user.id}/${storyId || "drafts"}/thumb-${Date.now()}.jpg`;
          const thumbBlob = await fetch(thumbnailUrl).then(r => r.blob());
          await supabase.storage.from("story-media").upload(thumbFileName, thumbBlob, {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/jpeg",
          });
          const { data: { publicUrl: thumbPublicUrl } } = supabase.storage.from("story-media").getPublicUrl(thumbFileName);
          thumbnailUrl = thumbPublicUrl;
        }
      } catch (thumbErr) {
        console.error("Thumbnail generation failed:", thumbErr);
        // Continue without thumbnail
      }

      // Also save to story_videos table if we have a story ID
      if (storyId) {
        await (supabase.from("story_videos") as any).insert({
          story_id: storyId,
          video_url: publicUrl,
          thumbnail_url: thumbnailUrl || null,
          caption: caption.trim() || null,
          duration_seconds: Math.round(duration),
          file_size_bytes: selectedFile.size,
        });
      }

      onUpload(publicUrl, thumbnailUrl);
      handleClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const generateThumbnail = (videoSrc: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = videoSrc;
      video.currentTime = 1; // Capture at 1 second

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          resolve(null);
        }
      };

      video.onerror = () => resolve(null);
    });
  };

  const handleClose = () => {
    // Stop playback
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    setHasRights(false);
    setError(null);
    setWarning(null);
    setIsPlaying(false);
    setDuration(0);
    setUploadProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Video className="h-5 w-5" />
            Add Video
          </DialogTitle>
          <DialogDescription>
            Upload a short video to accompany your story. Keep videos under 2 minutes
            and 50MB for best results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Selection */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/mov,video/webm,video/quicktime,.mp4,.mov,.webm"
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
                Click to select a video
              </p>
              <p className="text-xs text-stone mt-1">
                MP4, MOV, or WebM up to 50MB (max 2 minutes recommended)
              </p>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Video Preview Player */}
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={preview}
                  className="w-full max-h-64 object-contain"
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlayback}
                />
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-granite">
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-1" />
                    )}
                  </div>
                </button>
              </div>

              {/* File Info */}
              <div className="flex items-center justify-between text-sm text-stone px-1">
                <span>{selectedFile?.name}</span>
                <span>{formatFileSize(selectedFile?.size || 0)} · {formatDuration(duration)}</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (videoRef.current) videoRef.current.pause();
                  if (preview) URL.revokeObjectURL(preview);
                  setSelectedFile(null);
                  setPreview(null);
                  setIsPlaying(false);
                  setDuration(0);
                  setWarning(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="w-full text-sm"
              >
                Choose a different video
              </Button>
            </div>
          )}

          {/* Warning */}
          {warning && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {warning}
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-granite mb-1.5">
              Caption{" "}
              <span className="font-normal text-stone">(optional)</span>
            </label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. 'The harbour at sunset' or 'Interview with my grandmother'"
              className="border-bone"
            />
          </div>

          {/* Rights Confirmation */}
          <div className="bg-cream rounded-lg p-4 border border-bone">
            <div className="flex items-start gap-3">
              <Checkbox
                id="video-rights"
                checked={hasRights}
                onCheckedChange={(checked) => setHasRights(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="video-rights"
                className="text-sm text-granite leading-relaxed cursor-pointer"
              >
                <strong>I confirm</strong> that I own this video, have
                permission to share it, and anyone appearing has consented to its
                publication. I understand it will be visible to the public once
                my story is published.
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-stone">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

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
                <Video className="h-4 w-4" />
                Add to story
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
