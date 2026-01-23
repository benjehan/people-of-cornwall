"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, X, ExternalLink, Accessibility, Dog, Baby, Leaf } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location_name: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  price_info: string | null;
  is_free: boolean;
  is_accessible: boolean;
  is_dog_friendly: boolean;
  is_child_friendly: boolean;
  is_vegan_friendly: boolean;
  website_url: string | null;
}

interface EventsMapProps {
  events: Event[];
  onEventSelect: (event: Event | null) => void;
  selectedEvent: Event | null;
}

// Town coordinates for events without specific lat/lng
const TOWN_COORDINATES: Record<string, [number, number]> = {
  "Bodmin": [50.4692, -4.7165],
  "Bude": [50.8296, -4.5454],
  "Camborne": [50.2132, -5.2975],
  "Falmouth": [50.1537, -5.0714],
  "Hayle": [50.1892, -5.4241],
  "Helston": [50.1024, -5.2724],
  "Launceston": [50.6373, -4.3591],
  "Liskeard": [50.4560, -4.4653],
  "Looe": [50.3567, -4.4544],
  "Lostwithiel": [50.4070, -4.6730],
  "Marazion": [50.1258, -5.4688],
  "Mevagissey": [50.2700, -4.7904],
  "Mousehole": [50.0829, -5.5381],
  "Newlyn": [50.1026, -5.5429],
  "Newquay": [50.4125, -5.0757],
  "Padstow": [50.5425, -4.9357],
  "Penryn": [50.1681, -5.1044],
  "Penzance": [50.1180, -5.5375],
  "Perranporth": [50.3456, -5.1519],
  "Port Isaac": [50.5927, -4.8314],
  "Porthleven": [50.0847, -5.3153],
  "Redruth": [50.2327, -5.2268],
  "St Agnes": [50.3119, -5.2038],
  "St Austell": [50.3398, -4.7875],
  "St Ives": [50.2114, -5.4803],
  "St Just": [50.1235, -5.6833],
  "Tintagel": [50.6636, -4.7530],
  "Truro": [50.2632, -5.0510],
  "Wadebridge": [50.5176, -4.8353],
};

export default function EventsMap({ events, onEventSelect, selectedEvent }: EventsMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);

  // Get coordinates for an event
  const getEventCoordinates = (event: Event): [number, number] | null => {
    if (event.location_lat && event.location_lng) {
      return [event.location_lat, event.location_lng];
    }
    // Try to match town name
    for (const [town, coords] of Object.entries(TOWN_COORDINATES)) {
      if (event.location_name.toLowerCase().includes(town.toLowerCase())) {
        // Add small random offset to prevent stacking
        return [
          coords[0] + (Math.random() - 0.5) * 0.01,
          coords[1] + (Math.random() - 0.5) * 0.01,
        ];
      }
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on Cornwall
    mapRef.current = L.map(mapContainerRef.current, {
      center: [50.3, -5.0],
      zoom: 9,
      zoomControl: true,
    });

    // Add tile layer - using a nicer style
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Create custom icon
    const createIcon = (isSelected: boolean) => L.divIcon({
      className: "custom-event-marker",
      html: `
        <div style="
          width: ${isSelected ? "36px" : "28px"};
          height: ${isSelected ? "36px" : "28px"};
          background: ${isSelected ? "#B45A3C" : "#3D4F4F"};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
      `,
      iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
      iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
    });

    // Add markers for each event
    events.forEach((event) => {
      const coords = getEventCoordinates(event);
      if (!coords) return;

      const isSelected = selectedEvent?.id === event.id;
      const marker = L.marker(coords, {
        icon: createIcon(isSelected),
      });

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px; max-width: 280px;">
          ${event.image_url ? `<img src="${event.image_url}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px 4px 0 0; margin: -8px -8px 8px -8px; width: calc(100% + 16px);" />` : ""}
          <div style="font-weight: 600; font-size: 14px; color: #3D4F4F; margin-bottom: 4px;">${event.title}</div>
          <div style="font-size: 12px; color: #5A6B6B; margin-bottom: 4px;">
            📍 ${event.location_name}
          </div>
          <div style="font-size: 12px; color: #5A6B6B; margin-bottom: 8px;">
            📅 ${formatDate(event.starts_at)} ${!event.all_day ? `at ${formatTime(event.starts_at)}` : "(All day)"}
          </div>
          ${event.is_free ? '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Free</span>' : ""}
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: "event-popup",
      });

      marker.on("click", () => {
        onEventSelect(event);
      });

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Fit bounds if there are events
    if (events.length > 0) {
      const validCoords = events
        .map(getEventCoordinates)
        .filter((c): c is [number, number] => c !== null);
      
      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [events, selectedEvent, onEventSelect]);

  // Pan to selected event
  useEffect(() => {
    if (!mapRef.current || !selectedEvent) return;
    
    const coords = getEventCoordinates(selectedEvent);
    if (coords) {
      mapRef.current.setView(coords, 13, { animate: true });
    }
  }, [selectedEvent]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="h-[600px] w-full" />
      
      {/* Events count overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <span className="text-sm font-medium text-granite">
          {events.filter(e => getEventCoordinates(e)).length} events on map
        </span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <div className="flex items-center gap-2 text-xs text-stone">
          <div className="w-4 h-4 rounded-full bg-granite border-2 border-white shadow" />
          <span>Event location</span>
        </div>
      </div>

      {/* Style for custom markers */}
      <style jsx global>{`
        .event-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
        }
        .event-popup .leaflet-popup-content {
          margin: 8px;
        }
        .event-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-event-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}
