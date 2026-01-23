"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Youtube, AlertCircle, Check } from "lucide-react";

interface VideoEmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmbed: (embedHtml: string, videoUrl: string) => void;
}

function extractVideoId(url: string): { platform: "youtube" | "vimeo" | null; id: string | null } {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return { platform: "youtube", id: match[1] };
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) {
      return { platform: "vimeo", id: match[1] };
    }
  }

  return { platform: null, id: null };
}

function generateEmbedHtml(platform: "youtube" | "vimeo", id: string): string {
  if (platform === "youtube") {
    return `<div class="video-embed" data-platform="youtube" data-video-id="${id}"><iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  } else {
    return `<div class="video-embed" data-platform="vimeo" data-video-id="${id}"><iframe src="https://player.vimeo.com/video/${id}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  }
}

export function VideoEmbedDialog({ open, onOpenChange, onEmbed }: VideoEmbedDialogProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ platform: "youtube" | "vimeo"; id: string } | null>(null);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError("");
    
    if (!value.trim()) {
      setPreview(null);
      return;
    }

    const { platform, id } = extractVideoId(value);
    if (platform && id) {
      setPreview({ platform, id });
    } else {
      setPreview(null);
    }
  };

  const handleEmbed = () => {
    if (!url.trim()) {
      setError("Please enter a video URL");
      return;
    }

    const { platform, id } = extractVideoId(url);
    if (!platform || !id) {
      setError("Invalid URL. Please use a YouTube or Vimeo link.");
      return;
    }

    const embedHtml = generateEmbedHtml(platform, id);
    onEmbed(embedHtml, url);
    
    // Reset and close
    setUrl("");
    setPreview(null);
    setError("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setUrl("");
    setPreview(null);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-600" />
            Embed a Video
          </DialogTitle>
          <DialogDescription>
            Add a YouTube or Vimeo video to illustrate your story
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="video-url">Video URL</Label>
            <Input
              id="video-url"
              placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="font-mono text-sm"
            />
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Supported platforms */}
          <div className="text-xs text-stone space-y-1">
            <p className="font-medium">Supported platforms:</p>
            <ul className="list-disc list-inside space-y-0.5 text-silver">
              <li>YouTube (youtube.com, youtu.be)</li>
              <li>Vimeo (vimeo.com)</li>
            </ul>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="h-4 w-4" />
                <span>Valid {preview.platform === "youtube" ? "YouTube" : "Vimeo"} video detected</span>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden bg-granite/5 border border-bone">
                {preview.platform === "youtube" ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${preview.id}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    src={`https://player.vimeo.com/video/${preview.id}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleEmbed}
            disabled={!preview}
            className="bg-granite text-parchment hover:bg-slate"
          >
            Embed Video
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
