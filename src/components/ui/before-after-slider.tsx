"use client";

import { useState, useRef, useEffect } from "react";
import { GripVertical } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  initialPosition?: number; // 0-100, default 50
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
  initialPosition = 50,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Clamp between 0 and 100
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
    setSliderPosition(clampedPercentage);
  };

  // Mouse handlers
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    updatePosition(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add global event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, sliderPosition]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      style={{ touchAction: "none" }}
    >
      {/* Before Image (Full) */}
      <div className="relative w-full">
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-contain sepia-[0.2]"
          draggable={false}
        />
        {/* Before Label */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium">
          {beforeLabel}
        </div>
      </div>

      {/* After Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-contain sepia-[0.2]"
          draggable={false}
        />
        {/* After Label */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium">
          {afterLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Handle Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center cursor-ew-resize">
          <GripVertical className="h-6 w-6 text-granite" />
        </div>
      </div>
    </div>
  );
}
