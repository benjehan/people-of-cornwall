"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, X, ExternalLink, Accessibility, Dog, Baby, Leaf } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Category to gradient/icon mapping for placeholder (matches EventImageCarousel)
const CATEGORY_STYLES: Record<string, { gradient: string; icon: string }> = {
  music: { gradient: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)", icon: "🎵" },
  food: { gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)", icon: "🍽️" },
  arts: { gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)", icon: "🎨" },
  sports: { gradient: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)", icon: "🏆" },
  community: { gradient: "linear-gradient(135deg, #f43f5e 0%, #ef4444 100%)", icon: "👥" },
  nature: { gradient: "linear-gradient(135deg, #16a34a 0%, #14b8a6 100%)", icon: "🌿" },
  festival: { gradient: "linear-gradient(135deg, #eab308 0%, #f59e0b 100%)", icon: "✨" },
  default: { gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)", icon: "📅" },
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
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  source_url: string | null;
  price_info: string | null;
  is_free: boolean;
  is_accessible: boolean;
  is_dog_friendly: boolean;
  is_child_friendly: boolean;
  is_vegan_friendly: boolean;
  is_featured: boolean;
  category: string | null;
  recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  excluded_dates: string[];
  primary_image?: string | null;
  instance_date?: string;
  is_recurring_instance?: boolean;
}

interface EventsMapProps {
  events: Event[];
  onEventSelect: (event: Event | null) => void;
  selectedEvent: Event | null;
  /** When true, shows rich popups on markers instead of triggering onEventSelect modal */
  fullPageMode?: boolean;
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

export default function EventsMap({ events, onEventSelect, selectedEvent, fullPageMode = false }: EventsMapProps) {
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

      if (fullPageMode) {
        // Get category style for placeholder
        const category = detectCategory(event.title);
        const categoryStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
        
        // Rich popup content for full page mode (like story map)
        const richPopupContent = `
          <div class="event-rich-popup" style="min-width: 280px; max-width: 320px;">
            ${event.image_url ? `
              <img src="${event.image_url}" 
                style="width: calc(100% + 16px); height: 140px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -8px -8px 0 -8px;" 
                alt="${event.title}" />
            ` : `
              <div style="width: calc(100% + 16px); height: 120px; background: ${categoryStyle.gradient}; border-radius: 8px 8px 0 0; margin: -8px -8px 0 -8px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 28px;">
                  ${categoryStyle.icon}
                </div>
                <div style="position: absolute; inset: 0; opacity: 0.1; background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 16px 16px;"></div>
              </div>
            `}
            <div style="padding: 12px 0 0 0;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                <span style="background: #C17F59; color: #FAF9F6; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                  ${formatDate(event.starts_at)}
                </span>
                ${!event.all_day ? `
                  <span style="font-size: 11px; color: #5A6B6B; display: flex; align-items: center; gap: 2px;">
                    🕐 ${formatTime(event.starts_at)}
                  </span>
                ` : ''}
                ${event.is_free ? '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Free</span>' : ""}
              </div>
              <div style="font-family: serif; font-weight: 700; font-size: 16px; color: #3D4F4F; margin-bottom: 8px; line-height: 1.3;">
                ${event.title}
              </div>
              <div style="font-size: 12px; color: #5A6B6B; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                <span>📍</span> ${event.location_name}
              </div>
              ${event.description ? `
                <div style="font-size: 13px; color: #5A6B6B; margin-bottom: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  ${event.description.substring(0, 120)}${event.description.length > 120 ? '...' : ''}
                </div>
              ` : ''}
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
                ${event.is_accessible ? '<span style="background: #dbeafe; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-size: 10px;">♿ Accessible</span>' : ''}
                ${event.is_dog_friendly ? '<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px;">🐕 Dogs OK</span>' : ''}
                ${event.is_child_friendly ? '<span style="background: #fce7f3; color: #be185d; padding: 2px 6px; border-radius: 4px; font-size: 10px;">👶 Kids</span>' : ''}
              </div>
              <div style="border-top: 1px solid #e5e5e5; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <a href="/events/${event.id}" 
                   style="font-size: 13px; font-weight: 500; color: #3D4F4F; text-decoration: none;"
                   onmouseover="this.style.color='#5A6B6B'" 
                   onmouseout="this.style.color='#3D4F4F'">
                  View details →
                </a>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(richPopupContent, {
          closeButton: true,
          className: "event-popup event-popup-rich",
          maxWidth: 320,
          autoPanPadding: L.point(50, 80),
        });
      } else {
        // Get category style for placeholder
        const category = detectCategory(event.title);
        const categoryStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
        
        // Simple popup for embedded mode - clicking opens modal
        const simplePopupContent = `
          <div style="min-width: 200px; max-width: 280px;">
            ${event.image_url ? `
              <img src="${event.image_url}" style="width: calc(100% + 16px); height: 100px; object-fit: cover; border-radius: 4px 4px 0 0; margin: -8px -8px 8px -8px;" />
            ` : `
              <div style="width: calc(100% + 16px); height: 80px; background: ${categoryStyle.gradient}; border-radius: 4px 4px 0 0; margin: -8px -8px 8px -8px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                  ${categoryStyle.icon}
                </div>
              </div>
            `}
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

        marker.bindPopup(simplePopupContent, {
          closeButton: true,
          className: "event-popup",
        });

        marker.on("click", () => {
          onEventSelect(event);
        });
      }

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
  }, [events, selectedEvent, onEventSelect, fullPageMode]);

  // Pan to selected event
  useEffect(() => {
    if (!mapRef.current || !selectedEvent) return;
    
    const coords = getEventCoordinates(selectedEvent);
    if (coords) {
      mapRef.current.setView(coords, 13, { animate: true });
    }
  }, [selectedEvent]);

  return (
    <div className="relative z-0">
      <div ref={mapContainerRef} className="h-[600px] w-full" style={{ zIndex: 0 }} />
      
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
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .event-popup .leaflet-popup-content {
          margin: 8px;
        }
        .event-popup .leaflet-popup-tip {
          background: white;
        }
        .event-popup-rich .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
        }
        .event-popup-rich .leaflet-popup-content {
          margin: 0;
          padding: 8px;
          min-width: 280px;
          max-width: 320px;
        }
        .custom-event-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}
