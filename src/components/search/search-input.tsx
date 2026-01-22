"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  initialQuery?: string;
  placeholder?: string;
  compact?: boolean;
}

export function SearchInput({ 
  initialQuery = "", 
  placeholder = "Search stories, places, themes...",
  compact = false 
}: SearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  // Update local state if URL changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    router.push("/search");
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="pl-9 pr-4 h-9 border-bone bg-cream text-sm"
        />
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 max-w-xl">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-12 pr-10 h-12 border-bone bg-cream text-base"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone hover:text-granite"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" className="h-12 px-6 bg-granite text-parchment hover:bg-slate">
        Search
      </Button>
    </form>
  );
}
