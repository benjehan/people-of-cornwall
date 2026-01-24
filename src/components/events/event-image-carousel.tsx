"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Music, Utensils, Palette, Trophy, Users, Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventImage {
  id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
}

interface EventImageCarouselProps {
  images: EventImage[];
  eventTitle: string;
  category?: string;
  className?: string;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

// Category to icon/color mapping for placeholder
const CATEGORY_STYLES: Record<string, { icon: React.ElementType; gradient: string; emoji: string }> = {
  music: { icon: Music, gradient: "from-purple-600 to-pink-500", emoji: "🎵" },
  food: { icon: Utensils, gradient: "from-amber-500 to-orange-500", emoji: "🍽️" },
  arts: { icon: Palette, gradient: "from-cyan-500 to-blue-500", emoji: "🎨" },
  sports: { icon: Trophy, gradient: "from-green-500 to-emerald-500", emoji: "🏆" },
  community: { icon: Users, gradient: "from-rose-500 to-red-500", emoji: "👥" },
  nature: { icon: Leaf, gradient: "from-green-600 to-teal-500", emoji: "🌿" },
  festival: { icon: Sparkles, gradient: "from-yellow-500 to-amber-500", emoji: "✨" },
  default: { icon: Calendar, gradient: "from-slate-600 to-slate-500", emoji: "📅" },
};

// Detect category from event title
function detectCategory(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("music") || lower.includes("concert") || lower.includes("festival") || lower.includes("band") || lower.includes("shanty")) return "music";
  if (lower.includes("food") || lower.includes("pasty") || lower.includes("restaurant") || lower.includes("beer") || lower.includes("tasting")) return "food";
  if (lower.includes("art") || lower.includes("gallery") || lower.includes("exhibition") || lower.includes("theatre") || lower.includes("film")) return "arts";
  if (lower.includes("run") || lower.includes("marathon") || lower.includes("surf") || lower.includes("swim") || lower.includes("cycle") || lower.includes("gig")) return "sports";
  if (lower.includes("market") || lower.includes("fair") || lower.includes("carnival") || lower.includes("parade") || lower.includes("community")) return "community";
  if (lower.includes("walk") || lower.includes("nature") || lower.includes("wildlife") || lower.includes("garden") || lower.includes("seal") || lower.includes("bird")) return "nature";
  if (lower.includes("festival") || lower.includes("celebration") || lower.includes("regatta")) return "festival";
  return "default";
}

export function EventImageCarousel({
  images,
  eventTitle,
  category,
  className,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 5000,
}: EventImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Sort images to show primary first
  const sortedImages = [...images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isHovered || sortedImages.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, isHovered, sortedImages.length]);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  // If no images, show placeholder
  if (sortedImages.length === 0) {
    const detectedCategory = category || detectCategory(eventTitle);
    const style = CATEGORY_STYLES[detectedCategory] || CATEGORY_STYLES.default;
    const Icon = style.icon;

    return (
      <div 
        className={cn(
          "relative w-full bg-gradient-to-br overflow-hidden",
          style.gradient,
          className
        )}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
            <Icon className="w-8 h-8" />
          </div>
          <span className="text-4xl mb-1">{style.emoji}</span>
        </div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>
      </div>
    );
  }

  // Single image - no carousel needed
  if (sortedImages.length === 1) {
    return (
      <div className={cn("relative w-full overflow-hidden", className)}>
        <img
          src={sortedImages[0].image_url}
          alt={eventTitle}
          className="w-full h-full object-cover"
        />
        {sortedImages[0].caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-sm">{sortedImages[0].caption}</p>
          </div>
        )}
      </div>
    );
  }

  // Multiple images - full carousel
  return (
    <div 
      className={cn("relative w-full overflow-hidden group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images */}
      <div 
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {sortedImages.map((image, index) => (
          <div key={image.id} className="w-full h-full flex-shrink-0">
            <img
              src={image.image_url}
              alt={`${eventTitle} - Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Dots Indicator */}
      {showDots && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {sortedImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(index, e)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-white w-4" 
                  : "bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
        {currentIndex + 1} / {sortedImages.length}
      </div>

      {/* Caption */}
      {sortedImages[currentIndex].caption && (
        <div className="absolute bottom-8 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
          <p className="text-white text-sm">{sortedImages[currentIndex].caption}</p>
        </div>
      )}
    </div>
  );
}
