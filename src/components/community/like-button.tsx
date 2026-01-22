"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { toggleLikeAction } from "@/app/actions/likes";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  storyId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ storyId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();
  const router = useRouter();

  const handleLike = () => {
    if (!user) {
      // Redirect to login
      router.push(`/login?redirect=/stories/${storyId}`);
      return;
    }

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((prev) => (newLiked ? prev + 1 : prev - 1));

    startTransition(async () => {
      const result = await toggleLikeAction(storyId);
      
      if (result.error) {
        // Revert on error
        setLiked(!newLiked);
        setCount((prev) => (newLiked ? prev - 1 : prev + 1));
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isPending}
      className={cn(
        "gap-2 transition-colors",
        liked && "text-red-500 hover:text-red-600"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          liked && "fill-current",
          isPending && "animate-pulse"
        )}
      />
      <span>{count}</span>
    </Button>
  );
}
