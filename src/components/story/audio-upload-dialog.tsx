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
import { Music, Loader2, Upload, AlertCircle, Play, Pause } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AudioUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (url: string, title?: string) => void;
  storyId?: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB for audio

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AudioUploadDialog({
  open,
  onOpenChange,
  onUpload,
  storyId,
}: AudioUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [hasRights, setHasRights] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("audio/") && !file.name.endsWith(".mp3")) {
      setError("Please select an audio file (MP3, WAV, or M4A)");
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large (${formatFileSize(file.size)}). Maximum size is 25MB.`);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, "")); // Use filename as default title

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !hasRights) return;

    setIsUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to upload audio");
        setIsUploading(false);
        return;
      }

      // Create unique filename
      const ext = selectedFile.name.split(".").pop() || "mp3";
      const fileName = `${user.id}/${storyId || "drafts"}/audio-${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError(`Upload failed: ${uploadError.message}`);
        setIsUploading(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("story-media").getPublicUrl(data.path);

      onUpload(publicUrl, title.trim() || undefined);
      handleClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload audio. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Stop playback
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSelectedFile(null);
    setPreview(null);
    setTitle("");
    setHasRights(false);
    setError(null);
    setIsPlaying(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Music className="h-5 w-5" />
            Add Audio Recording
          </DialogTitle>
          <DialogDescription>
            Upload an audio recording to accompany your story. Oral histories,
            interviews, and ambient sounds are welcome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Selection */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/x-m4a,.mp3,.wav,.m4a"
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
                Click to select an audio file
              </p>
              <p className="text-xs text-stone mt-1">
                MP3, WAV, or M4A up to 25MB
              </p>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Audio Preview Player */}
              <div className="rounded-lg bg-gradient-to-r from-granite to-slate p-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={togglePlayback}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-parchment text-granite hover:bg-cream transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-parchment truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-silver">
                      {formatFileSize(selectedFile?.size || 0)}
                    </p>
                  </div>
                  <Music className="h-6 w-6 text-parchment/50" />
                </div>
                <audio
                  ref={audioRef}
                  src={preview}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setSelectedFile(null);
                  setPreview(null);
                  setIsPlaying(false);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="w-full text-sm"
              >
                Choose a different file
              </Button>
            </div>
          )}

          {/* Title / Description */}
          <div>
            <label className="block text-sm font-medium text-granite mb-1.5">
              Recording title{" "}
              <span className="font-normal text-stone">(optional)</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 'Grandpa's fishing story' or 'Porthleven harbour sounds'"
              className="border-bone"
            />
          </div>

          {/* Rights Confirmation */}
          <div className="bg-cream rounded-lg p-4 border border-bone">
            <div className="flex items-start gap-3">
              <Checkbox
                id="audio-rights"
                checked={hasRights}
                onCheckedChange={(checked) => setHasRights(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="audio-rights"
                className="text-sm text-granite leading-relaxed cursor-pointer"
              >
                <strong>I confirm</strong> that I own this recording, have
                permission to share it, or the speakers have consented to its
                publication. I understand it will be audible to the public once
                my story is published.
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
                <Music className="h-4 w-4" />
                Add to story
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
