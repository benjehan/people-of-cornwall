"use client";

import { useRouter } from "next/navigation";
import { MapPin, X } from "lucide-react";
import Link from "next/link";

interface LocationFilterProps {
  locations: string[];
  selectedLocation: string | null;
  selectedDecade: number | null;
}

export function LocationFilter({ locations, selectedLocation, selectedDecade }: LocationFilterProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = e.target.value;
    const params = new URLSearchParams();
    
    if (selectedDecade) {
      params.set("decade", selectedDecade.toString());
    }
    if (loc) {
      params.set("location", loc);
    }
    
    const queryString = params.toString();
    router.push(`/timeline${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="flex items-center gap-2 border-l border-bone pl-4">
      <MapPin className="h-4 w-4 text-stone" />
      <select
        value={selectedLocation || ""}
        onChange={handleChange}
        className="h-8 rounded-md border border-bone bg-parchment px-2 text-sm text-granite focus:border-granite focus:outline-none"
      >
        <option value="">All locations</option>
        {locations.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
      {selectedLocation && (
        <Link 
          href={selectedDecade ? `/timeline?decade=${selectedDecade}` : "/timeline"}
          className="text-stone hover:text-granite"
          title="Clear location"
        >
          <X className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
