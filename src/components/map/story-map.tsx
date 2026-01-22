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
      width: 28px;
      height: 28px;
      background: #1F4E5F;
      border: 3px solid #F7F6F2;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Cluster icon
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  
  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: #B45A3C;
      border: 3px solid #F7F6F2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: ${count < 10 ? 14 : 12}px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
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
      <div className="flex h-[400px] md:h-[600px] items-center justify-center bg-chalk-white-dark/30">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-atlantic-blue border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
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
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                      <h3 className="mb-1 font-serif font-semibold leading-tight text-slate-grey">
                        {story.title}
                      </h3>
                      <p className="mb-2 text-xs text-gray-500">
                        {story.timeline_decade && `${story.timeline_decade}s • `}
                        {story.location_name}
                      </p>
                      <Link
                        href={`/stories/${story.id}`}
                        className="text-sm font-medium text-atlantic-blue hover:underline"
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
        <div className="border-t border-chalk-white-dark bg-chalk-white py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            <h2 className="mb-4 font-serif text-xl font-semibold">
              All Locations ({stories.length} {stories.length === 1 ? "story" : "stories"})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group rounded-lg border border-chalk-white-dark bg-chalk-white p-4 transition-shadow hover:shadow-md"
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    {story.location_name}
                    {story.timeline_decade && ` • ${story.timeline_decade}s`}
                  </p>
                  <h3 className="font-serif font-medium leading-tight group-hover:text-atlantic-blue">
                    {story.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {stories.length === 0 && (
        <div className="border-t border-chalk-white-dark bg-chalk-white py-16 text-center">
          <p className="text-muted-foreground">
            No stories with locations yet. Be the first to share a story from a
            place in Cornwall!
          </p>
        </div>
      )}
    </>
  );
}
