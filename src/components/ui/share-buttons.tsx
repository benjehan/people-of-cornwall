"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Facebook, MessageCircle, Copy, Check, Twitter, Mail, Link2 } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: "default" | "compact" | "inline";
}

export function ShareButtons({
  url,
  title,
  description,
  className = "",
  variant = "default",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  
  const fullUrl = typeof window !== "undefined" 
    ? (url.startsWith("http") ? url : `${window.location.origin}${url}`)
    : url;
  
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
  };

  // Compact variant - just icons in a row
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-stone hover:text-green-600 hover:bg-green-50"
          onClick={() => handleShare("whatsapp")}
          title="Share on WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-stone hover:text-blue-600 hover:bg-blue-50"
          onClick={() => handleShare("facebook")}
          title="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-stone hover:text-sky-500 hover:bg-sky-50"
          onClick={() => handleShare("twitter")}
          title="Share on X"
        >
          <Twitter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-stone hover:text-granite"
          onClick={handleCopy}
          title="Copy link"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  // Inline variant - horizontal buttons with labels
  if (variant === "inline") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="text-sm text-stone font-medium">Share:</span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
          onClick={() => handleShare("whatsapp")}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
          onClick={() => handleShare("facebook")}
        >
          <Facebook className="h-4 w-4 mr-1" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-sky-500 border-sky-200 hover:bg-sky-50 hover:border-sky-300"
          onClick={() => handleShare("twitter")}
        >
          <Twitter className="h-4 w-4 mr-1" />
          X
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
    );
  }

  // Default variant - dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare("whatsapp")} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("facebook")} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("twitter")} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2 text-sky-500" />
          X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("email")} className="cursor-pointer">
          <Mail className="h-4 w-4 mr-2 text-stone" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
