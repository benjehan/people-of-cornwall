"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Loader2, ExternalLink, Globe } from "lucide-react";

interface LinkPreviewData {
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string;
  favicon: string | null;
}

interface LinkEmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (linkHtml: string) => void;
}

export function LinkEmbedDialog({
  open,
  onOpenChange,
  onInsert,
}: LinkEmbedDialogProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchPreview = async () => {
    if (!url.trim()) return;

    // Add https:// if missing
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      const response = await fetch("/api/link-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch preview");
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch link preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (!preview) return;

    // Escape HTML entities in text content to prevent XSS
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };

    // Create the link embed HTML with paragraphs before and after for editing
    const linkHtml = `<p></p><div class="link-embed" data-url="${preview.url}" contenteditable="false">
  <a href="${preview.url}" target="_blank" rel="noopener noreferrer" class="link-embed-card">
    ${preview.image ? `<div class="link-embed-image"><img src="${preview.image}" alt="${escapeHtml(preview.title)}" /></div>` : ""}
    <div class="link-embed-content">
      <div class="link-embed-site">
        ${preview.favicon ? `<img src="${preview.favicon}" alt="" class="link-embed-favicon" />` : ""}
        <span>${escapeHtml(preview.siteName)}</span>
      </div>
      <div class="link-embed-title">${escapeHtml(preview.title)}</div>
      ${preview.description ? `<div class="link-embed-description">${escapeHtml(preview.description)}</div>` : ""}
    </div>
  </a>
</div><p></p>`;

    onInsert(linkHtml);
    handleClose();
  };

  const handleClose = () => {
    setUrl("");
    setPreview(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-granite" />
            Add Link
          </DialogTitle>
          <DialogDescription>
            Add a link to an external article or webpage with a preview card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">Web Address (URL)</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.bbc.co.uk/news/..."
                className="flex-1 border-bone"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFetchPreview();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleFetchPreview}
                disabled={isLoading || !url.trim()}
                className="bg-granite text-parchment hover:bg-slate"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Preview"
                )}
              </Button>
            </div>
            <p className="text-xs text-silver">
              Paste a URL from news sites, Wikipedia, or any webpage
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <Label>Preview</Label>
              <div className="rounded-lg border border-bone overflow-hidden bg-white hover:bg-cream transition-colors">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {preview.image && (
                    <div className="aspect-video w-full overflow-hidden bg-bone">
                      <img
                        src={preview.image}
                        alt={preview.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-silver mb-2">
                      {preview.favicon ? (
                        <img
                          src={preview.favicon}
                          alt=""
                          className="w-4 h-4"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                      <span>{preview.siteName}</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </div>
                    <h4 className="font-medium text-granite line-clamp-2 mb-1">
                      {preview.title}
                    </h4>
                    {preview.description && (
                      <p className="text-sm text-stone line-clamp-2">
                        {preview.description}
                      </p>
                    )}
                  </div>
                </a>
              </div>
              <p className="text-xs text-silver text-center">
                Opens in a new tab when clicked
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!preview}
            className="bg-granite text-parchment hover:bg-slate"
          >
            <Link2 className="h-4 w-4 mr-1" />
            Add Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
