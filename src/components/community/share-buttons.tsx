"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Facebook, MessageCircle, Link2, Check, Mail } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  /** Show as dropdown (default) or inline buttons */
  variant?: "dropdown" | "inline";
}

/**
 * Share Buttons Component
 * 
 * These use simple share URLs that don't require any API access:
 * - Facebook: Opens Facebook's share dialog
 * - WhatsApp: Opens WhatsApp with pre-filled message
 * - Email: Opens default email client
 * - Copy Link: Copies URL to clipboard
 */
export function ShareButtons({ 
  url, 
  title, 
  description,
  variant = "dropdown" 
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  // Encode for URLs
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || "");

  // Share URLs (no API required!)
  // Note: Facebook will scrape Open Graph tags from the URL for preview
  // The quote parameter adds custom text that appears above the link preview
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%0A%0A${encodedDescription ? encodedDescription + "%0A%0A" : ""}${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0ARead%20the%20full%20story%3A%20${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], "_blank", "width=600,height=400");
  };

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare("facebook")}
          title="Share on Facebook"
          className="h-9 w-9 text-muted-foreground hover:text-[#1877F2]"
        >
          <Facebook className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare("whatsapp")}
          title="Share on WhatsApp"
          className="h-9 w-9 text-muted-foreground hover:text-[#25D366]"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.location.href = shareUrls.email}
          title="Share via Email"
          className="h-9 w-9 text-muted-foreground hover:text-atlantic-blue"
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyLink}
          title={copied ? "Copied!" : "Copy link"}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="h-4 w-4 text-moss-green" /> : <Link2 className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleShare("facebook")}
          className="cursor-pointer gap-2"
        >
          <Facebook className="h-4 w-4 text-[#1877F2]" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare("whatsapp")}
          className="cursor-pointer gap-2"
        >
          <MessageCircle className="h-4 w-4 text-[#25D366]" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.location.href = shareUrls.email}
          className="cursor-pointer gap-2"
        >
          <Mail className="h-4 w-4 text-atlantic-blue" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCopyLink}
          className="cursor-pointer gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-moss-green" />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              Copy link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Native Share Button (mobile)
 * Uses the Web Share API when available
 */
export function NativeShareButton({
  url,
  title,
  description,
}: Omit<ShareButtonsProps, "variant">) {
  const [canShare, setCanShare] = useState(false);

  // Check if Web Share API is available
  useState(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  });

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled or failed:", err);
      }
    }
  };

  if (!canShare) {
    return <ShareButtons url={url} title={title} description={description} />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleNativeShare}
      className="gap-2 text-muted-foreground"
    >
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
}
