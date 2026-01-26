"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  GraduationCap, 
  Calendar, 
  MapPin, 
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Filter,
  X,
  Grid3X3,
  LayoutGrid,
  School,
  Users,
  Heart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";
import { ShareButtons } from "@/components/ui/share-buttons";

interface SchoolPhoto {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  school_name: string;
  school_type: string;
  location_name: string;
  year_taken: number | null;
  class_name: string | null;
  source_credit: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  user_has_liked?: boolean;
  identifications?: Identification[];
}

interface Identification {
  id: string;
  person_name: string;
  relationship: string | null;
}

interface FilterState {
  school: string;
  location: string;
  yearFrom: string;
  yearTo: string;
  search: string;
}

type ViewMode = "grid" | "large";

function SchoolPhotosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, isLoading: authLoading } = useUser();
  const [photos, setPhotos] = useState<SchoolPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<SchoolPhoto | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isLiking, setIsLiking] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    school: "",
    location: "",
    yearFrom: "",
    yearTo: "",
    search: "",
  });

  // Unique values for filter dropdowns
  const [schools, setSchools] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      const supabase = createClient();
      
      const { data } = await (supabase
        .from("school_photos") as any)
        .select("school_name, location_name, year_taken")
        .eq("is_published", true);

      if (data) {
        const uniqueSchools = [...new Set(data.map((d: any) => d.school_name))].sort() as string[];
        const uniqueLocations = [...new Set(data.map((d: any) => d.location_name))].sort() as string[];
        const uniqueYears = [...new Set(data.filter((d: any) => d.year_taken).map((d: any) => d.year_taken))]
          .sort((a, b) => (b as number) - (a as number)) as number[];

        setSchools(uniqueSchools);
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
      .from("school_photos") as any)
      .select(`
        *,
        identifications:school_photo_identifications (
          id,
          person_name,
          relationship
        )
      `)
      .eq("is_published", true);

    // Apply filters
    if (filters.school) {
      query = query.eq("school_name", filters.school);
    }
    if (filters.location) {
      query = query.eq("location_name", filters.location);
    }
    if (filters.yearFrom) {
      query = query.gte("year_taken", parseInt(filters.yearFrom));
    }
    if (filters.yearTo) {
      query = query.lte("year_taken", parseInt(filters.yearTo));
    }
    if (filters.search) {
      query = query.or(`school_name.ilike.%${filters.search}%,title.ilike.%${filters.search}%,class_name.ilike.%${filters.search}%`);
    }

    query = query.order("year_taken", { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error loading photos:", error);
      setIsLoading(false);
      return;
    }

    // Check if user has liked each photo
    const photosWithLikes = await Promise.all(
      (data || []).map(async (photo: any) => {
        let userHasLiked = false;
        if (user) {
          const { data: like } = await (supabase
            .from("likes") as any)
            .select("id")
            .eq("content_type", "school_photo")
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

  const openPhoto = async (photo: SchoolPhoto) => {
    setSelectedPhoto(photo);
    // Update URL without navigation
    window.history.pushState(null, "", `/school-photos?photo=${photo.id}`);
    
    // Increment view count
    const supabase = createClient();
    await (supabase
      .from("school_photos") as any)
      .update({ view_count: (photo.view_count || 0) + 1 })
      .eq("id", photo.id);
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
    window.history.pushState(null, "", "/school-photos");
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    const newIndex = direction === "prev" 
      ? (currentIndex - 1 + photos.length) % photos.length
      : (currentIndex + 1) % photos.length;
    const newPhoto = photos[newIndex];
    setSelectedPhoto(newPhoto);
    window.history.pushState(null, "", `/school-photos?photo=${newPhoto.id}`);
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
        .eq("content_type", "school_photo")
        .eq("content_id", photoId)
        .eq("user_id", user.id);
    } else {
      await (supabase
        .from("likes") as any)
        .insert({
          content_type: "school_photo",
          content_id: photoId,
          user_id: user.id,
        });
    }

    // Update local state
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
      school: "",
      location: "",
      yearFrom: "",
      yearTo: "",
      search: "",
    });
  };

  const hasActiveFilters = filters.school || filters.location || filters.yearFrom || filters.yearTo || filters.search;

  // Generate decade options for year filter
  const decadeOptions = useMemo(() => {
    if (years.length === 0) return [];
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const startDecade = Math.floor(minYear / 10) * 10;
    const endDecade = Math.floor(maxYear / 10) * 10;
    const decades: number[] = [];
    for (let d = startDecade; d <= endDecade; d += 10) {
      decades.push(d);
    }
    return decades.reverse();
  }, [years]);

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-atlantic/10 text-atlantic text-sm font-medium mb-4">
            <GraduationCap className="h-4 w-4" />
            School Photos
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-granite mb-4">
            Class of Cornwall
          </h1>
          <p className="text-stone max-w-2xl mx-auto text-lg mb-6">
            Explore school photographs from across Cornwall's history. 
            Find old classmates, remember your teachers, and relive school days gone by.
          </p>
          {user && (
            <Link href="/school-photos/submit">
              <Button className="bg-atlantic text-white hover:bg-atlantic/90 shadow-md">
                <GraduationCap className="h-4 w-4 mr-2" />
                Share a School Photo
              </Button>
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div className="bg-cream border border-bone rounded-lg p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <Input
                placeholder="Search schools, classes..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9 border-bone"
              />
            </div>

            {/* Quick filters */}
            <Select
              value={filters.school}
              onValueChange={(v) => setFilters(f => ({ ...f, school: v }))}
            >
              <SelectTrigger className="w-[180px] border-bone">
                <School className="h-4 w-4 mr-2 text-stone" />
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Schools</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school} value={school}>{school}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.location}
              onValueChange={(v) => setFilters(f => ({ ...f, location: v }))}
            >
              <SelectTrigger className="w-[160px] border-bone">
                <MapPin className="h-4 w-4 mr-2 text-stone" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
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
                  <SelectItem value="">From</SelectItem>
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
                  <SelectItem value="">To</SelectItem>
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

            {/* View mode toggle */}
            <div className="flex border border-bone rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-none ${viewMode === "grid" ? "bg-atlantic text-white" : ""}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("large")}
                className={`rounded-none ${viewMode === "large" ? "bg-atlantic text-white" : ""}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.school && (
                <Badge variant="secondary" className="bg-atlantic/10 text-atlantic">
                  {filters.school}
                  <button onClick={() => setFilters(f => ({ ...f, school: "" }))} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="bg-atlantic/10 text-atlantic">
                  {filters.location}
                  <button onClick={() => setFilters(f => ({ ...f, location: "" }))} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.yearFrom || filters.yearTo) && (
                <Badge variant="secondary" className="bg-atlantic/10 text-atlantic">
                  {filters.yearFrom || "..."} - {filters.yearTo || "..."}
                  <button onClick={() => setFilters(f => ({ ...f, yearFrom: "", yearTo: "" }))} className="ml-1">
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
            Showing {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Photo Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-granite" />
          </div>
        ) : photos.length === 0 ? (
          <Card className="border-bone bg-cream text-center py-12">
            <CardContent>
              <GraduationCap className="h-12 w-12 text-stone mx-auto mb-4" />
              <h3 className="font-serif text-xl text-granite mb-2">
                {hasActiveFilters ? "No photos match your filters" : "No Photos Yet"}
              </h3>
              <p className="text-stone mb-4">
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more results."
                  : "Be the first to share a school photo from Cornwall!"}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : user ? (
                <Link href="/school-photos/submit">
                  <Button className="bg-atlantic text-white hover:bg-atlantic/90">
                    Share a Photo
                  </Button>
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${
            viewMode === "grid" 
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" 
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}>
            {photos.map((photo) => (
              <Card 
                key={photo.id} 
                className="border-bone bg-cream overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
                onClick={() => openPhoto(photo)}
              >
                <div className={`relative ${viewMode === "grid" ? "aspect-square" : "aspect-[4/3]"} bg-stone/10 overflow-hidden`}>
                  <img
                    src={photo.image_url}
                    alt={photo.title || photo.school_name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Year badge */}
                  {photo.year_taken && (
                    <Badge className="absolute top-2 right-2 bg-atlantic/90 text-white border-0 text-xs">
                      {photo.year_taken}
                    </Badge>
                  )}

                  {/* Hover info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <h3 className="font-medium text-white text-sm line-clamp-1">
                      {photo.school_name}
                    </h3>
                    <p className="text-xs text-white/80">
                      {photo.location_name}
                    </p>
                  </div>
                </div>

                {viewMode === "large" && (
                  <CardContent className="p-3">
                    <h3 className="font-medium text-granite line-clamp-1 mb-1">
                      {photo.title || photo.school_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {photo.location_name}
                      </span>
                      {photo.class_name && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {photo.class_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-stone">
                      <button
                        onClick={(e) => handleLike(photo.id, photo.user_has_liked || false, e)}
                        disabled={!user || isLiking === photo.id}
                        className={`flex items-center gap-1 ${
                          photo.user_has_liked ? "text-red-500" : "hover:text-red-500"
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${photo.user_has_liked ? "fill-current" : ""}`} />
                        {photo.like_count}
                      </button>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {photo.view_count}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ShareButtons
                          url={`/school-photos?photo=${photo.id}`}
                          title={`${photo.school_name} - ${photo.year_taken || "School Photo"}`}
                          description={`Class photo from ${photo.school_name}, ${photo.location_name}`}
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
      </main>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && closePhoto()}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-parchment max-h-[90vh] overflow-y-auto">
          {selectedPhoto && (
            <div className="flex flex-col">
              {/* Image section */}
              <div className="relative bg-black">
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.title || selectedPhoto.school_name}
                  className="w-full max-h-[60vh] object-contain"
                />
                
                {/* Navigation */}
                {photos.length > 1 && (
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
              </div>

              {/* Info section */}
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="font-serif text-2xl text-granite">
                    {selectedPhoto.title || selectedPhoto.school_name}
                  </DialogTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="border-atlantic text-atlantic">
                      <School className="h-3 w-3 mr-1" />
                      {selectedPhoto.school_name}
                    </Badge>
                    <Badge variant="outline" className="border-stone text-stone">
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedPhoto.location_name}
                    </Badge>
                    {selectedPhoto.year_taken && (
                      <Badge variant="outline" className="border-stone text-stone">
                        <Calendar className="h-3 w-3 mr-1" />
                        {selectedPhoto.year_taken}
                      </Badge>
                    )}
                    {selectedPhoto.class_name && (
                      <Badge variant="outline" className="border-stone text-stone">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedPhoto.class_name}
                      </Badge>
                    )}
                  </div>
                </DialogHeader>

                {/* Like & Stats */}
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
                    url={`/school-photos?photo=${selectedPhoto.id}`}
                    title={`${selectedPhoto.school_name} - ${selectedPhoto.year_taken || "School Photo"}`}
                    description={`Class photo from ${selectedPhoto.school_name}, ${selectedPhoto.location_name}`}
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

                {/* Identifications */}
                {selectedPhoto.identifications && selectedPhoto.identifications.length > 0 && (
                  <div className="pt-4 border-t border-bone">
                    <h4 className="font-medium text-granite mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      People Identified ({selectedPhoto.identifications.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.identifications.map((id) => (
                        <Badge key={id.id} variant="secondary" className="bg-cream">
                          {id.person_name}
                          {id.relationship && <span className="text-stone ml-1">({id.relationship})</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to action */}
                <div className="mt-6 pt-4 border-t border-bone text-center">
                  <p className="text-sm text-stone mb-2">
                    Recognize someone in this photo?
                  </p>
                  <Button variant="outline" className="border-atlantic text-atlantic hover:bg-atlantic hover:text-white">
                    Identify Someone
                  </Button>
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

export default function SchoolPhotosPage() {
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
      <SchoolPhotosPageContent />
    </Suspense>
  );
}
