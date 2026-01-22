"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { StoryWithCounts } from "@/lib/supabase/queries";
import L from "leaflet";

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
  stories: StoryWithCounts[];
}

// Cornwall center coordinates
const CORNWALL_CENTER: [number, number] = [50.2660, -5.0527];
const CORNWALL_BOUNDS: [[number, number], [number, number]] = [
  [49.9, -5.8], // Southwest
  [50.8, -4.2], // Northeast
];

// Custom marker icon (fix for webpack/Next.js)
const createCustomIcon = () => {
  if (typeof window === "undefined") return undefined;
  
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 24px;
      height: 24px;
      background: #1A1A1A;
      border: 2px solid #FAF9F6;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Cluster icon
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 32 : count < 50 ? 40 : 48;
  
  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: #C17F59;
      border: 2px solid #FAF9F6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: ${count < 10 ? 13 : 11}px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    ">${count}</div>`,
    className: "custom-cluster",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export function StoryMap({ stories }: StoryMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [customIcon, setCustomIcon] = useState<L.DivIcon | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
    setCustomIcon(createCustomIcon());
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-[400px] md:h-[600px] items-center justify-center bg-cream">
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

      <div className="h-[400px] md:h-[600px] w-full">
        <MapContainer
          center={CORNWALL_CENTER}
          zoom={9}
          maxBounds={CORNWALL_BOUNDS}
          className="h-full w-full"
          style={{ background: "#e8e6e1" }}
        >
          {/* Using Stadia Maps Alidade Smooth for a cleaner look */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          />

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterIcon}
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {stories.map((story) => {
              if (!story.location_lat || !story.location_lng) return null;

              return (
                <Marker
                  key={story.id}
                  position={[story.location_lat, story.location_lng]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="max-w-[250px] p-1">
                      <h3 className="mb-1 font-serif font-bold leading-tight text-granite">
                        {story.title}
                      </h3>
                      <p className="mb-2 text-xs text-stone">
                        {story.timeline_decade && `${story.timeline_decade}s • `}
                        {story.location_name}
                      </p>
                      <Link
                        href={`/stories/${story.id}`}
                        className="text-sm font-medium text-granite hover:text-copper"
                      >
                        Read story →
                      </Link>
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
                  <h3 className="font-serif font-bold leading-snug text-granite group-hover:text-copper transition-colors">
                    {story.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {stories.length === 0 && (
        <div className="border-t border-bone bg-parchment py-16 text-center">
          <p className="text-stone">
            No stories with locations yet. Be the first to share a story from a
            place in Cornwall!
          </p>
        </div>
      )}
    </>
  );
}
