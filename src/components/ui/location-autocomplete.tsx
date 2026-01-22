"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: {
    name: string;
    lat: number | null;
    lng: number | null;
  }) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Location Autocomplete using OpenStreetMap Nominatim (free, no API key needed)
 * Limited to Cornwall area for relevance
 */
export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Search for a location...",
  className,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for locations
  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Search within Cornwall bounds using Nominatim
      const params = new URLSearchParams({
        q: `${searchQuery}, Cornwall, UK`,
        format: "json",
        addressdetails: "1",
        limit: "8",
        // Cornwall bounding box
        viewbox: "-5.8,49.9,-4.2,50.8",
        bounded: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            "User-Agent": "PeopleOfCornwall/1.0",
          },
        }
      );

      if (!response.ok) throw new Error("Search failed");

      const data: LocationResult[] = await response.json();
      
      // Filter to only Cornwall results and deduplicate
      const cornwallResults = data.filter(
        (r) =>
          r.display_name.toLowerCase().includes("cornwall") ||
          r.address?.county?.toLowerCase().includes("cornwall")
      );

      setResults(cornwallResults);
      setIsOpen(cornwallResults.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Location search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 300);
  };

  // Handle selecting a result
  const handleSelect = (result: LocationResult) => {
    // Get a clean location name
    const name = getCleanLocationName(result);
    
    setQuery(name);
    setIsOpen(false);
    onChange({
      name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
  };

  // Get a clean, readable location name
  const getCleanLocationName = (result: LocationResult): string => {
    const addr = result.address;
    if (addr) {
      const parts = [
        addr.village || addr.town || addr.city || result.name,
      ].filter(Boolean);
      return parts.join(", ") || result.display_name.split(",")[0];
    }
    return result.display_name.split(",")[0];
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  // Clear selection
  const handleClear = () => {
    setQuery("");
    setResults([]);
    onChange({ name: "", lat: null, lng: null });
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-8"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!isLoading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-chalk-white-dark bg-white shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {results.map((result, index) => (
              <li key={`${result.lat}-${result.lon}`}>
                <button
                  type="button"
                  onClick={() => handleSelect(result)}
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-chalk-white-dark",
                    index === selectedIndex && "bg-chalk-white-dark"
                  )}
                >
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-atlantic-blue" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {getCleanLocationName(result)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.display_name}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-chalk-white-dark px-3 py-2 text-xs text-muted-foreground">
            Powered by OpenStreetMap
          </p>
        </div>
      )}
    </div>
  );
}
