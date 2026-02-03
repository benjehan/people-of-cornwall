"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Camera, 
  Clock, 
  MapPin, 
  MessageCircle, 
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Info,
  Star,
  Heart,
  TrendingUp,
  Search,
  Grid3X3,
  LayoutGrid,
  X,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";
import { ShareButtons } from "@/components/ui/share-buttons";

interface LostCornwallPhoto {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  year_taken: string | null;
  location_name: string | null;
  source_credit: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  memories: Memory[];
  user_has_liked?: boolean;
}

type SortOption = "popular" | "recent" | "views" | "oldest";
type ViewMode = "grid" | "large";

interface Memory {
  id: string;
  content: string;
  is_featured: boolean;
  created_at: string;
  user: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface FilterState {
  location: string;
  yearFrom: string;
  yearTo: string;
  search: string;
}

function LostCornwallPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, isLoading: authLoading } = useUser();
  const [photos, setPhotos] = useState<LostCornwallPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<LostCornwallPhoto | null>(null);
  const [memoryText, setMemoryText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLiking, setIsLiking] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    location: "",
    yearFrom: "",
    yearTo: "",
    search: "",
  });

  // Unique values for filter dropdowns
  const [locations, setLocations] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      const supabase = createClient();
      
      const { data } = await (supabase
        .from("lost_cornwall") as any)
        .select("location_name, year_taken")
        .eq("is_published", true);

      if (data) {
        const uniqueLocations = [...new Set(data.filter((d: any) => d.location_name).map((d: any) => d.location_name))]
          .sort() as string[];
        const uniqueYears = [...new Set(data.filter((d: any) => d.year_taken).map((d: any) => d.year_taken))]
          .sort((a, b) => {
            // Extract first year from strings like "1920s" or "circa 1950"
            const yearA = parseInt((a as string).match(/\d{4}/)?.[0] || "0");
            const yearB = parseInt((b as string).match(/\d{4}/)?.[0] || "0");
            return yearB - yearA;
          }) as string[];

        setLocations(uniqueLocations);
        setYears(uniqueYears);
      }
    };

    loadFilterOptions();
  }, []);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    let query = (supabase
      .from("lost_cornwall") as any)
      .select(`
        *,
        memories:lost_cornwall_memories (
          id,
          content,
          is_featured,
          created_at,
          user:users (
            display_name,
            avatar_url
          )
        )
      `)
      .eq("is_published", true);

    // Apply filters
    if (filters.location && filters.location !== "all") {
      query = query.eq("location_name", filters.location);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading photos:", error);
      setIsLoading(false);
      return;
    }

    // Filter by year range if specified (client-side since year_taken is text)
    let filteredData = data || [];
    if ((filters.yearFrom && filters.yearFrom !== "all") || (filters.yearTo && filters.yearTo !== "all")) {
      filteredData = filteredData.filter((photo: any) => {
        if (!photo.year_taken) return false;
        const yearMatch = photo.year_taken.match(/\d{4}/);
        if (!yearMatch) return false;
        const year = parseInt(yearMatch[0]);
        if (filters.yearFrom && filters.yearFrom !== "all" && year < parseInt(filters.yearFrom)) return false;
        if (filters.yearTo && filters.yearTo !== "all" && year > parseInt(filters.yearTo)) return false;
        return true;
      });
    }

    // Check if user has liked each photo
    const photosWithLikes = await Promise.all(
      filteredData.map(async (photo: any) => {
        let userHasLiked = false;
        if (user) {
          const { data: like } = await (supabase
            .from("likes") as any)
            .select("id")
            .eq("content_type", "lost_cornwall")
            .eq("content_id", photo.id)
            .eq("user_id", user.id)
            .maybeSingle();
          userHasLiked = !!like;
        }
        return {
          ...photo,
          like_count: photo.like_count || 0,
          user_has_liked: userHasLiked,
        };
      })
    );

    setPhotos(photosWithLikes);
    setIsLoading(false);
  }, [user, filters]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Open photo from URL param
  useEffect(() => {
    const photoId = searchParams.get("photo");
    if (photoId && photos.length > 0) {
      const photo = photos.find(p => p.id === photoId);
      if (photo) setSelectedPhoto(photo);
    }
  }, [searchParams, photos]);

  const openPhoto = async (photo: LostCornwallPhoto) => {
    setSelectedPhoto(photo);
    window.history.pushState(null, "", `/lost-cornwall?photo=${photo.id}`);
    // Increment view count
    const supabase = createClient();
    await (supabase
      .from("lost_cornwall") as any)
      .update({ view_count: (photo.view_count || 0) + 1 })
      .eq("id", photo.id);
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
    window.history.pushState(null, "", "/lost-cornwall");
  };

  const submitMemory = async () => {
    if (!user || !selectedPhoto || !memoryText.trim()) return;
    
    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await (supabase
      .from("lost_cornwall_memories") as any)
      .insert({
        lost_cornwall_id: selectedPhoto.id,
        user_id: user.id,
        content: memoryText.trim(),
      });

    if (error) {
      console.error("Error submitting memory:", error);
      setSubmitMessage({ type: "error", text: "Failed to share your memory" });
    } else {
      setSubmitMessage({ type: "success", text: "Memory shared! Thank you for contributing." });
      setMemoryText("");
      await loadPhotos();
      const updated = photos.find(p => p.id === selectedPhoto.id);
      if (updated) setSelectedPhoto(updated);
      setTimeout(() => setSubmitMessage(null), 3000);
    }
    setIsSubmitting(false);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (!selectedPhoto) return;
    const currentIndex = sortedPhotos.findIndex(p => p.id === selectedPhoto.id);
    const newIndex = direction === "prev" 
      ? (currentIndex - 1 + sortedPhotos.length) % sortedPhotos.length
      : (currentIndex + 1) % sortedPhotos.length;
    const newPhoto = sortedPhotos[newIndex];
    setSelectedPhoto(newPhoto);
    window.history.pushState(null, "", `/lost-cornwall?photo=${newPhoto.id}`);
  };

  const handleLike = async (photoId: string, hasLiked: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    
    setIsLiking(photoId);
    const supabase = createClient();

    if (hasLiked) {
      await (supabase
        .from("likes") as any)
        .delete()
        .eq("content_type", "lost_cornwall")
        .eq("content_id", photoId)
        .eq("user_id", user.id);
    } else {
      await (supabase
        .from("likes") as any)
        .insert({
          content_type: "lost_cornwall",
          content_id: photoId,
          user_id: user.id,
        });
    }

    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return {
          ...p,
          like_count: hasLiked ? p.like_count - 1 : p.like_count + 1,
          user_has_liked: !hasLiked,
        };
      }
      return p;
    }));

    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(prev => prev ? {
        ...prev,
        like_count: hasLiked ? prev.like_count - 1 : prev.like_count + 1,
        user_has_liked: !hasLiked,
      } : null);
    }

    setIsLiking(null);
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      yearFrom: "",
      yearTo: "",
      search: "",
    });
  };

  const hasActiveFilters = filters.location || filters.yearFrom || filters.yearTo || filters.search;

  // Sort photos based on selected option
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.like_count || 0) - (a.like_count || 0);
        case "views":
          return (b.view_count || 0) - (a.view_count || 0);
        case "oldest": {
          const yearA = parseInt(a.year_taken?.match(/\d{4}/)?.[0] || "9999");
          const yearB = parseInt(b.year_taken?.match(/\d{4}/)?.[0] || "9999");
          return yearA - yearB;
        }
        case "recent":
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });
  }, [photos, sortBy]);

  // Generate decade options
  const decadeOptions = useMemo(() => {
    const decades = [1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
    return decades.reverse();
  }, []);

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sepia/10 text-sepia text-sm font-medium mb-4">
            <Camera className="h-4 w-4" />
            Lost Cornwall
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-granite mb-4">
            Windows to the Past
          </h1>
          <p className="text-stone max-w-2xl mx-auto text-lg mb-6">
            Explore historic photographs of Cornwall and share your memories. 
            Do you recognize these places? Remember these scenes? Help us preserve our heritage.
          </p>
          {user && (
            <Link href="/lost-cornwall/submit">
              <Button className="bg-sepia text-white hover:bg-sepia/90 shadow-md">
                <Camera className="h-4 w-4 mr-2" />
                Share a Historic Photo
              </Button>
            </Link>
          )}
        </div>

        {/* Search, Filters & Sort */}
        <div className="bg-cream border border-bone rounded-lg p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <Input
                placeholder="Search photos..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9 border-bone"
              />
            </div>

            {/* Location filter */}
            <Select
              value={filters.location}
              onValueChange={(v) => setFilters(f => ({ ...f, location: v }))}
            >
              <SelectTrigger className="w-[160px] border-bone">
                <MapPin className="h-4 w-4 mr-2 text-stone" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year range */}
            <div className="flex items-center gap-2">
              <Select
                value={filters.yearFrom}
                onValueChange={(v) => setFilters(f => ({ ...f, yearFrom: v }))}
              >
                <SelectTrigger className="w-[100px] border-bone">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">From</SelectItem>
                  {decadeOptions.map((decade) => (
                    <SelectItem key={decade} value={decade.toString()}>{decade}s</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-stone">-</span>
              <Select
                value={filters.yearTo}
                onValueChange={(v) => setFilters(f => ({ ...f, yearTo: v }))}
              >
                <SelectTrigger className="w-[100px] border-bone">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">To</SelectItem>
                  {decadeOptions.map((decade) => (
                    <SelectItem key={decade} value={(decade + 9).toString()}>{decade}s</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-stone hover:text-granite"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px] border-bone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Loved</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            {/* View mode toggle */}
            <div className="flex border border-bone rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-none ${viewMode === "grid" ? "bg-sepia text-white" : ""}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("large")}
                className={`rounded-none ${viewMode === "large" ? "bg-sepia text-white" : ""}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.location && (
                <Badge variant="secondary" className="bg-sepia/10 text-sepia">
                  {filters.location}
                  <button onClick={() => setFilters(f => ({ ...f, location: "" }))} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.yearFrom || filters.yearTo) && (
                <Badge variant="secondary" className="bg-sepia/10 text-sepia">
                  {filters.yearFrom || "..."} - {filters.yearTo || "..."}
                  <button onClick={() => setFilters(f => ({ ...f, yearFrom: "", yearTo: "" }))} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="bg-sepia/10 text-sepia">
                  "{filters.search}"
                  <button onClick={() => setFilters(f => ({ ...f, search: "" }))} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-stone mb-4">
            Showing {sortedPhotos.length} photo{sortedPhotos.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Photo Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-granite" />
          </div>
        ) : sortedPhotos.length === 0 ? (
          <Card className="border-bone bg-cream text-center py-12">
            <CardContent>
              <Camera className="h-12 w-12 text-stone mx-auto mb-4" />
              <h3 className="font-serif text-xl text-granite mb-2">
                {hasActiveFilters ? "No photos match your filters" : "Coming Soon"}
              </h3>
              <p className="text-stone mb-4">
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more results."
                  : "Historic photographs will be added soon. Check back!"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={`${
            viewMode === "grid"
              ? "columns-2 sm:columns-3 md:columns-4 lg:columns-5"
              : "columns-1 sm:columns-2 lg:columns-3"
          } gap-4`}>
            {sortedPhotos.map((photo) => (
              <Card
                key={photo.id}
                className="border-bone bg-cream overflow-hidden cursor-pointer group hover:shadow-lg transition-all mb-4 break-inside-avoid"
                onClick={() => openPhoto(photo)}
              >
                <div className={`relative ${viewMode === "grid" ? "aspect-square" : "aspect-[4/3]"} bg-stone/10 overflow-hidden`}>
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 sepia-[0.3]"
                  />
                  {/* Vintage overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Year badge */}
                  {photo.year_taken && (
                    <Badge className="absolute top-2 right-2 bg-sepia/90 text-parchment border-0 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {photo.year_taken}
                    </Badge>
                  )}

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-serif text-sm text-parchment font-bold line-clamp-1">
                      {photo.title}
                    </h3>
                    {photo.location_name && viewMode === "large" && (
                      <p className="text-xs text-parchment/80 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {photo.location_name}
                      </p>
                    )}
                  </div>
                </div>

                {viewMode === "large" && (
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between text-xs text-stone">
                      <button
                        onClick={(e) => handleLike(photo.id, photo.user_has_liked || false, e)}
                        disabled={!user || isLiking === photo.id}
                        className={`flex items-center gap-1 transition-colors ${
                          photo.user_has_liked 
                            ? "text-red-500" 
                            : "text-stone hover:text-red-500"
                        } disabled:opacity-50`}
                      >
                        <Heart className={`h-4 w-4 ${photo.user_has_liked ? "fill-current" : ""}`} />
                        {photo.like_count || 0}
                      </button>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {photo.memories?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {photo.view_count || 0}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ShareButtons
                          url={`/lost-cornwall?photo=${photo.id}`}
                          title={`Lost Cornwall: ${photo.title}`}
                          description={photo.description || `Historic photo from ${photo.year_taken || 'Cornwall'}`}
                          variant="compact"
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Call to contribute */}
        <div className="mt-16 text-center">
          <Card className="border-sepia/30 bg-gradient-to-r from-sepia/5 to-amber-500/5 inline-block">
            <CardContent className="p-8">
              <Info className="h-8 w-8 text-sepia mx-auto mb-4" />
              <h3 className="font-serif text-xl text-granite mb-2">
                Have Old Photos of Cornwall?
              </h3>
              <p className="text-stone max-w-md mb-4">
                We'd love to feature your family's historic photographs. 
                Help us build a visual archive of Cornwall's past.
              </p>
              {user ? (
                <Link href="/lost-cornwall/submit">
                  <Button className="bg-sepia text-white hover:bg-sepia/90">
                    Share a Photo
                  </Button>
                </Link>
              ) : (
                <Link href="/login?redirect=/lost-cornwall/submit">
                  <Button variant="outline" className="border-sepia text-sepia hover:bg-sepia hover:text-parchment">
                    Login to Contribute
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && closePhoto()}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-parchment max-h-[90vh] overflow-y-auto">
          {selectedPhoto && (
            <div className="flex flex-col">
              {/* Image section - Full width on top */}
              <div className="relative aspect-[4/3] bg-black overflow-hidden">
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.title}
                  className="absolute inset-0 w-full h-full object-contain sepia-[0.2]"
                />
                
                {/* Navigation */}
                {sortedPhotos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); navigatePhoto("prev"); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); navigatePhoto("next"); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {/* Year badge */}
                {selectedPhoto.year_taken && (
                  <Badge className="absolute top-4 right-4 bg-sepia/90 text-white border-0 text-base">
                    <Clock className="h-4 w-4 mr-1" />
                    {selectedPhoto.year_taken}
                  </Badge>
                )}
              </div>

              {/* Info section - Below image */}
              <div className="p-6">
                {/* Title and Location */}
                <DialogHeader className="mb-4">
                  <DialogTitle className="font-serif text-2xl text-granite">
                    {selectedPhoto.title}
                  </DialogTitle>
                  {selectedPhoto.location_name && (
                    <p className="text-stone flex items-center gap-1 text-sm mt-1">
                      <MapPin className="h-4 w-4" />
                      {selectedPhoto.location_name}
                    </p>
                  )}
                </DialogHeader>

                {/* Like & Stats - Prominent placement */}
                <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-bone">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(selectedPhoto.id, selectedPhoto.user_has_liked || false)}
                      disabled={!user || isLiking === selectedPhoto.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        selectedPhoto.user_has_liked 
                          ? "bg-red-50 text-red-500 border border-red-200" 
                          : "bg-cream text-stone border border-bone hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                      } disabled:opacity-50`}
                    >
                      <Heart className={`h-5 w-5 ${selectedPhoto.user_has_liked ? "fill-current" : ""}`} />
                      <span className="font-medium">{selectedPhoto.like_count || 0}</span>
                    </button>
                    <div className="flex items-center gap-1 text-stone text-sm">
                      <Eye className="h-4 w-4" />
                      {selectedPhoto.view_count || 0} views
                    </div>
                  </div>
                  <ShareButtons
                    url={`/lost-cornwall?photo=${selectedPhoto.id}`}
                    title={`Lost Cornwall: ${selectedPhoto.title}`}
                    description={selectedPhoto.description || `Historic photo from ${selectedPhoto.year_taken || 'Cornwall'}`}
                    variant="compact"
                  />
                </div>

                {/* Description */}
                {selectedPhoto.description && (
                  <p className="text-stone text-sm leading-relaxed mb-3">
                    {selectedPhoto.description}
                  </p>
                )}

                {selectedPhoto.source_credit && (
                  <p className="text-silver text-xs italic mb-4">
                    Source: {selectedPhoto.source_credit}
                  </p>
                )}

                {/* Memories/Comments */}
                <div className="pt-4 border-t border-bone">
                  <h4 className="font-medium text-granite mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Shared Memories ({selectedPhoto.memories?.length || 0})
                  </h4>

                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {selectedPhoto.memories?.length === 0 ? (
                      <p className="text-stone text-sm italic">
                        No memories shared yet. Be the first!
                      </p>
                    ) : (
                      selectedPhoto.memories?.map((memory) => (
                        <div 
                          key={memory.id} 
                          className={`p-3 rounded-lg ${
                            memory.is_featured 
                              ? "bg-yellow-50 border border-yellow-200" 
                              : "bg-cream border border-bone"
                          }`}
                        >
                          {memory.is_featured && (
                            <Badge className="bg-yellow-500 text-white text-xs mb-2">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <p className="text-sm text-granite">{memory.content}</p>
                          <p className="text-xs text-silver mt-2">
                            {memory.user?.display_name || "Anonymous"} · {new Date(memory.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add memory form */}
                  {user ? (
                    <div className="mt-4 pt-4 border-t border-bone">
                      <Textarea
                        placeholder="Do you remember this place? Share your memory..."
                        value={memoryText}
                        onChange={(e) => setMemoryText(e.target.value)}
                        className="border-bone bg-cream text-sm resize-none"
                        rows={2}
                      />
                      <Button
                        onClick={submitMemory}
                        disabled={!memoryText.trim() || isSubmitting}
                        className="w-full mt-2 bg-sepia text-white hover:bg-sepia/90"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Share Memory
                      </Button>
                      {submitMessage && (
                        <p className={`mt-2 text-sm text-center ${submitMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                          {submitMessage.text}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-bone text-center">
                      <a href="/login" className="text-sm text-atlantic hover:underline">
                        Login to share your memories
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default function LostCornwallPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-granite" />
        </main>
        <Footer />
      </div>
    }>
      <LostCornwallPageContent />
    </Suspense>
  );
}
