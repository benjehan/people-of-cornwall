"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { StoryWithCounts } from "@/lib/supabase/queries";
import L from "leaflet";
import { MapPin, Calendar, User, Heart, MessageCircle } from "lucide-react";

// Dynamically import Leaflet components (they don't work with SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const MarkerClusterGroup = dynamic(
  () => import("react-leaflet-cluster").then((mod) => mod.default),
  { ssr: false }
);

interface StoryMapProps {
  stories: (StoryWithCounts & { 
    first_image_url?: string | null;
    author_display_name?: string | null;
    ai_summary?: string | null;
  })[];
}

// Cornwall center coordinates
const CORNWALL_CENTER: [number, number] = [50.2660, -5.0527];
const CORNWALL_BOUNDS: [[number, number], [number, number]] = [
  [49.9, -5.8], // Southwest
  [50.8, -4.2], // Northeast
];

// Custom marker icon - dark pin
const createCustomIcon = () => {
  if (typeof window === "undefined") return undefined;
  
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px;
      height: 28px;
      background: #1A1A1A;
      border: 3px solid #FAF9F6;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      cursor: pointer;
      transition: transform 0.15s ease;
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

// Cluster icon - copper colored with count
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  
  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: #C17F59;
      border: 3px solid #FAF9F6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: ${count < 10 ? 14 : 12}px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      cursor: pointer;
    ">${count}</div>`,
    className: "custom-cluster",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Extract excerpt from body (strip HTML)
const getExcerpt = (body: string | null, maxLength = 120) => {
  if (!body) return null;
  const text = body.replace(/<[^>]*>/g, "").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

export function StoryMap({ stories }: StoryMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [customIcon, setCustomIcon] = useState<L.DivIcon | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
    setCustomIcon(createCustomIcon());
  }, []);

  // Debug: log stories to console
  useEffect(() => {
    console.log("Stories with locations:", stories.length, stories);
  }, [stories]);

  if (!isMounted) {
    return (
      <div className="flex h-[600px] md:h-[800px] items-center justify-center bg-cream">
        <div className="text-center">
          <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-granite border-t-transparent mx-auto" />
          <p className="text-sm text-stone">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      
      {/* Custom popup styles */}
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 280px;
          max-width: 320px;
        }
        .leaflet-popup-tip {
          background: white;
        }
        .story-popup-image {
          width: 100%;
          height: 140px;
          object-fit: cover;
          border-radius: 8px 8px 0 0;
        }
        .story-popup-placeholder {
          width: 100%;
          height: 100px;
          background: linear-gradient(135deg, #EDECE8 0%, #F5F4F0 100%);
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .custom-marker:hover > div {
          transform: scale(1.15);
        }
      `}</style>

      <div className="h-[600px] md:h-[800px] w-full">
        <MapContainer
          center={CORNWALL_CENTER}
          zoom={9}
          maxBounds={CORNWALL_BOUNDS}
          minZoom={8}
          className="h-full w-full"
          style={{ background: "#e8e6e1" }}
        >
          {/* OpenStreetMap tiles - no API key needed */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterIcon}
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            disableClusteringAtZoom={15}
          >
            {stories.map((story) => {
              if (!story.location_lat || !story.location_lng) return null;

              const excerpt = story.ai_summary || getExcerpt(story.body);
              const authorName = story.anonymous 
                ? "Anonymous" 
                : (story.author_display_name || "A Cornish voice");

              return (
                <Marker
                  key={story.id}
                  position={[story.location_lat, story.location_lng]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="story-popup">
                      {/* Image or placeholder */}
                      {story.first_image_url ? (
                        <img 
                          src={story.first_image_url} 
                          alt={story.title || "Story image"}
                          className="story-popup-image"
                        />
                      ) : (
                        <div className="story-popup-placeholder">
                          <MapPin className="h-8 w-8 text-stone/40" />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="p-4">
                        {/* Meta line */}
                        <div className="flex items-center gap-2 text-xs text-stone mb-2">
                          {story.timeline_decade && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {story.timeline_decade}s
                            </span>
                          )}
                          {story.location_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {story.location_name}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-lg font-bold leading-tight text-granite mb-2">
                          {story.title || "Untitled Story"}
                        </h3>

                        {/* Excerpt */}
                        {excerpt && (
                          <p className="text-sm text-stone leading-relaxed mb-3">
                            {excerpt}
                          </p>
                        )}

                        {/* Author */}
                        <div className="flex items-center gap-2 text-xs text-stone mb-3 pb-3 border-b border-bone">
                          <User className="h-3 w-3" />
                          <span>By {authorName}</span>
                        </div>

                        {/* Engagement & CTA */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-silver">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {story.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {story.comments_count || 0}
                            </span>
                          </div>
                          <Link
                            href={`/stories/${story.id}`}
                            className="text-sm font-medium text-granite hover:text-slate transition-colors"
                          >
                            Read story →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* Story list below map */}
      {stories.length > 0 && (
        <div className="border-t border-bone bg-parchment py-12">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <h2 className="mb-6 font-serif text-2xl font-bold text-granite">
              All Locations
              <span className="ml-2 text-base font-normal text-stone">
                ({stories.length} {stories.length === 1 ? "story" : "stories"})
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group rounded-lg border border-transparent bg-cream p-4 transition-all hover:border-bone hover:shadow-sm"
                >
                  <p className="mb-1 text-xs uppercase tracking-widest text-silver">
                    {story.location_name}
                    {story.timeline_decade && ` • ${story.timeline_decade}s`}
                  </p>
                  <h3 className="font-serif font-bold leading-snug text-granite group-hover:text-slate transition-colors">
                    {story.title}
                  </h3>
                  <p className="mt-1 text-xs text-stone">
                    By {story.anonymous ? "Anonymous" : (story.author_display_name || "A Cornish voice")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {stories.length === 0 && (
        <div className="border-t border-bone bg-parchment py-16 text-center">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-stone/30" />
          <p className="text-stone">
            No stories with locations yet. Be the first to share a story from a
            place in Cornwall!
          </p>
        </div>
      )}
    </>
  );
}
