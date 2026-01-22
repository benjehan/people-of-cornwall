"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, PenLine, ChevronLeft, ChevronRight } from "lucide-react";

interface Prompt {
  id: string;
  title: string;
  description: string | null;
}

interface RotatingPromptsProps {
  prompts: Prompt[];
}

export function RotatingPrompts({ prompts }: RotatingPromptsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (prompts.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, 8000);

    return () => clearInterval(timer);
  }, [prompts.length, isPaused, currentIndex]);

  const goToNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % prompts.length);
      setIsAnimating(false);
    }, 300);
  };

  const goToPrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + prompts.length) % prompts.length);
      setIsAnimating(false);
    }, 300);
  };

  const goToIndex = (index: number) => {
    if (index === currentIndex) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 300);
  };

  if (prompts.length === 0) return null;

  const current = prompts[currentIndex];

  return (
    <section 
      className="relative overflow-hidden border-t border-bone bg-gradient-to-b from-cream to-parchment py-16 md:py-24"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-granite blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-copper blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Header */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-copper/10 px-4 py-1.5 text-sm font-medium text-copper">
            <Sparkles className="h-4 w-4" />
            Spark an Idea
          </div>

          {/* Prompt Content - Animated */}
          <div className="relative min-h-[160px] md:min-h-[140px]">
            <div
              className={`transition-all duration-300 ${
                isAnimating 
                  ? "opacity-0 translate-y-2" 
                  : "opacity-100 translate-y-0"
              }`}
            >
              <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight text-granite sm:text-3xl md:text-4xl">
                "{current.title}"
              </h2>
              {current.description && (
                <p className="text-stone text-base md:text-lg leading-relaxed">
                  {current.description}
                </p>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`/write?prompt=${current.id}`}>
              <Button className="gap-2 bg-granite text-parchment hover:bg-slate font-medium px-6">
                <PenLine className="h-4 w-4" />
                Write about this
              </Button>
            </Link>
            <Link href="/prompts">
              <Button variant="outline" className="border-granite text-granite hover:bg-granite hover:text-parchment">
                See all prompts
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          {prompts.length > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              {/* Previous button */}
              <button
                onClick={goToPrev}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-bone bg-parchment text-stone hover:border-granite hover:text-granite transition-colors"
                aria-label="Previous prompt"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {prompts.slice(0, Math.min(prompts.length, 8)).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "w-6 bg-copper"
                        : "w-2 bg-bone hover:bg-stone"
                    }`}
                    aria-label={`Go to prompt ${index + 1}`}
                  />
                ))}
                {prompts.length > 8 && (
                  <span className="text-xs text-stone ml-1">
                    +{prompts.length - 8} more
                  </span>
                )}
              </div>

              {/* Next button */}
              <button
                onClick={goToNext}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-bone bg-parchment text-stone hover:border-granite hover:text-granite transition-colors"
                aria-label="Next prompt"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Pause indicator */}
          {isPaused && prompts.length > 1 && (
            <p className="mt-4 text-xs text-silver">
              Paused — move mouse away to resume
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
