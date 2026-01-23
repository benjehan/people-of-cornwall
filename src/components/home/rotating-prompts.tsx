"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, PenLine, ChevronLeft, ChevronRight } from "lucide-react";

interface Prompt {
  id: string;
  title: string;
  body: string;
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
        {/* Fixed layout: Navigation on sides, content in center */}
        <div className="flex items-center justify-center gap-4 md:gap-8">
          {/* Left Navigation Arrow - Fixed position */}
          {prompts.length > 1 && (
            <button
              onClick={goToPrev}
              className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full border border-bone bg-parchment text-stone hover:border-granite hover:text-granite transition-colors shadow-sm"
              aria-label="Previous prompt"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Center Content - Fixed width */}
          <div className="flex-1 max-w-2xl text-center">
            {/* Header */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-copper/10 px-4 py-1.5 text-sm font-medium text-copper">
              <Sparkles className="h-4 w-4" />
              Spark an Idea
            </div>

            {/* Prompt Content - Fixed height container */}
            <div className="h-[180px] md:h-[160px] flex flex-col justify-center">
              <div
                className={`transition-all duration-300 ${
                  isAnimating 
                    ? "opacity-0 translate-y-2" 
                    : "opacity-100 translate-y-0"
                }`}
              >
                <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight text-granite sm:text-3xl md:text-4xl line-clamp-2">
                  "{current.title}"
                </h2>
                {current.body && (
                  <p className="text-stone text-base md:text-lg leading-relaxed line-clamp-3">
                    {current.body}
                  </p>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
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

            {/* Counter */}
            {prompts.length > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                <span className="font-medium text-granite">{currentIndex + 1}</span>
                <span className="text-stone">/</span>
                <span className="text-stone">{prompts.length}</span>
                <span className="text-stone ml-1">prompts</span>
              </div>
            )}

            {/* Pause indicator */}
            {isPaused && prompts.length > 1 && (
              <p className="mt-2 text-xs text-silver">
                Paused — move mouse away to resume
              </p>
            )}
          </div>

          {/* Right Navigation Arrow - Fixed position */}
          {prompts.length > 1 && (
            <button
              onClick={goToNext}
              className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full border border-bone bg-parchment text-stone hover:border-granite hover:text-granite transition-colors shadow-sm"
              aria-label="Next prompt"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
