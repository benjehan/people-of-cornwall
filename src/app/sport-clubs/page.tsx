"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, Trophy, Users, MapPin, Calendar, ChevronLeft, ChevronRight, Eye, Heart, MessageCircle, Search, Filter, X, Grid3X3, LayoutGrid, Camera, Info, Star } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";
import { ShareButtons } from "@/components/ui/share-buttons";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";

interface SportClubPhoto {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  club_name: string | null;
  sport_type: string | null;
  team_name: string | null;
  year_taken: string | null;
  season: string | null;
  location_name: string | null;
  source_credit: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  user_has_liked?: boolean;
  additional_images?: Array<{
    id: string;
    image_url: string;
    caption: string | null;
    display_order: number;
  }>;
}

type SortOption = "popular" | "recent" | "views" | "oldest";
type ViewMode = "grid" | "large";

interface FilterState {
  club: string;
  sportType: string;
  location: string;
  yearFrom: string;
  yearTo: string;
  search: string;
}

function SportClubsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [photos, setPhotos] = useState<SportClubPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<SportClubPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLiking, setIsLiking] = useState<string | null>(null);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    club: "",
    sportType: "",
    location: "",
    yearFrom: "",
    yearTo: "",
    search: "",
  });

  const [clubs, setClubs] = useState<string[]>([]);
  const [sportTypes, setSportTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      const supabase = createClient();
      const { data } = await (supabase
        .from("sport_clubs") as any)
        .select("club_name, sport_type, location_name, year_taken")
        .eq("is_published", true);

      if (data) {
        const uniqueClubs = [...new Set(data.filter((d: any) => d.club_name).map((d: any) => d.club_name))].sort() as string[];
        const uniqueSportTypes = [...new Set(data.filter((d: any) => d.sport_type).map((d: any) => d.sport_type))].sort() as string[];
        const uniqueLocations = [...new Set(data.filter((d: any) => d.location_name).map((d: any) => d.location_name))].sort() as string[];
        const uniqueYears = [...new Set(data.filter((d: any) => d.year_taken).map((d: any) => d.year_taken))].sort((a, b) => {
          const yearA = parseInt((a as string).match(/\d{4}/)?.[0] || "0");
          const yearB = parseInt((b as string).match(/\d{4}/)?.[0] || "0");
          return yearB - yearA;
        }) as string[];

        setClubs(uniqueClubs);
        setSportTypes(uniqueSportTypes);
        setLocations(uniqueLocations);
        setYears(uniqueYears);
      }
    };
    loadFilterOptions();
  }, []);

  // Reset comparison mode when photo changes
  useEffect(() => {
    setIsComparisonMode(false);
  }, [selectedPhoto?.id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedPhoto]);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    let query = (supabase
      .from("sport_clubs") as any)
      .select(`
        *,
        additional_images:sport_clubs_images (
          id,
          image_url,
          caption,
          display_order
        )
      `)
      .eq("is_published", true);

    // Apply filters
    if (filters.club) {
      query = query.eq("club_name", filters.club);
    }
    if (filters.sportType) {
      query = query.eq("sport_type", filters.sportType);
    }
    if (filters.location) {
      query = query.eq("location_name", filters.location);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,club_name.ilike.%${filters.search}%,team_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading photos:", error);
      setPhotos([]);
    } else {
      // Add user likes
      let photosWithLikes = data || [];
      if (user) {
        const { data: likes } = await (supabase
          .from("likes") as any)
          .select("content_id")
          .eq("content_type", "sport_club")
          .eq("user_id", user.id);

        const likedIds = new Set(likes?.map((l: any) => l.content_id) || []);
        photosWithLikes = photosWithLikes.map((p: any) => ({
          ...p,
          user_has_liked: likedIds.has(p.id),
        }));
      }
      setPhotos(photosWithLikes);
    }

    setIsLoading(false);
  }, [filters, user]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Handle URL photo parameter
  useEffect(() => {
    const photoId = searchParams.get("photo");
    if (photoId && photos.length > 0) {
      const photo = photos.find(p => p.id === photoId);
      if (photo) {
        handlePhotoClick(photo);
      }
    }
  }, [searchParams, photos]);

  const sortedPhotos = useMemo(() => {
    let sorted = [...photos];

    // Apply year range filter
    if (filters.yearFrom || filters.yearTo) {
      sorted = sorted.filter(p => {
        if (!p.year_taken) return false;
        const year = parseInt(p.year_taken.match(/\d{4}/)?.[0] || "0");
        if (filters.yearFrom && year < parseInt(filters.yearFrom)) return false;
        if (filters.yearTo && year > parseInt(filters.yearTo)) return false;
        return true;
      });
    }

    // Sort
    switch (sortBy) {
      case "popular":
        sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      case "recent":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "views":
        sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case "oldest":
        sorted.sort((a, b) => {
          const yearA = parseInt((a.year_taken || "0").match(/\d{4}/)?.[0] || "0");
          const yearB = parseInt((b.year_taken || "0").match(/\d{4}/)?.[0] || "0");
          return yearA - yearB;
        });
        break;
    }

    return sorted;
  }, [photos, sortBy, filters.yearFrom, filters.yearTo]);

  const handlePhotoClick = async (photo: SportClubPhoto) => {
    setSelectedPhoto(photo);
    window.history.pushState(null, "", `/sport-clubs?photo=${photo.id}`);

    // Increment view count
    const supabase = createClient();
    await (supabase
      .from("sport_clubs") as any)
      .update({ view_count: (photo.view_count || 0) + 1 })
      .eq("id", photo.id);
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
    window.history.pushState(null, "", "/sport-clubs");
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (!selectedPhoto) return;
    const currentIndex = sortedPhotos.findIndex(p => p.id === selectedPhoto.id);
    const newIndex = direction === "prev"
      ? (currentIndex - 1 + sortedPhotos.length) % sortedPhotos.length
      : (currentIndex + 1) % sortedPhotos.length;
    const newPhoto = sortedPhotos[newIndex];
    setSelectedPhoto(newPhoto);
    window.history.pushState(null, "", `/sport-clubs?photo=${newPhoto.id}`);
  };

  // Touch handlers for mobile swipe
  const handleModalTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleModalTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleModalTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && sortedPhotos.length > 1) {
      navigatePhoto("next");
    } else if (isRightSwipe && sortedPhotos.length > 1) {
      navigatePhoto("prev");
    }

    setTouchStart(0);
    setTouchEnd(0);
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
        .eq("content_type", "sport_club")
        .eq("content_id", photoId)
        .eq("user_id", user.id);
    } else {
      await (supabase
        .from("likes") as any)
        .insert({
          content_type: "sport_club",
          content_id: photoId,
          user_id: user.id,
        });
    }

    await loadPhotos();
    if (selectedPhoto && selectedPhoto.id === photoId) {
      const updated = photos.find(p => p.id === photoId);
      if (updated) setSelectedPhoto(updated);
    }

    setIsLiking(null);
  };

  const clearFilters = () => {
    setFilters({
      club: "",
      sportType: "",
      location: "",
      yearFrom: "",
      yearTo: "",
      search: "",
    });
  };

  const hasActiveFilters = filters.club || filters.sportType || filters.location || filters.yearFrom || filters.yearTo || filters.search;
  const decadeOptions = Array.from(new Set(years.map(y => Math.floor(parseInt(y.match(/\d{4}/)?.[0] || "0") / 10) * 10))).filter(d => d > 0).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-copper/10 border border-copper/20 text-copper text-sm font-medium mb-6">
            <Trophy className="h-4 w-4" />
            Sport & Clubs
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-granite mb-4 tracking-tight">
            Sport & Clubs Photo Archive
          </h1>
          <p className="text-stone text-lg max-w-2xl mx-auto">
            Celebrating Cornwall's sporting heritage and club memories. From football teams to sailing clubs,
            rugby squads to cricket sides - these photos capture the passion and camaraderie of Cornish sport.
          </p>
          {user && (
            <Link href="/sport-clubs/submit">
              <Button className="bg-copper text-white hover:bg-copper/90 mt-6">
                <Camera className="h-4 w-4 mr-2" />
                Share a Photo
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-cream border border-bone rounded-lg p-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full mb-4 justify-between text-granite hover:bg-bone"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters & Sort
            </span>
            <ChevronRight className={`h-4 w-4 transition-transform ${showFilters ? "rotate-90" : ""}`} />
          </Button>

          <div className={`flex flex-wrap gap-4 items-center ${showFilters ? "" : "hidden md:flex"}`}>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <Input
                placeholder="Search photos..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9 border-bone"
              />
            </div>

            <Select value={filters.club} onValueChange={(v) => setFilters(f => ({ ...f, club: v }))}>
              <SelectTrigger className="w-[180px] border-bone">
                <Users className="h-4 w-4 mr-2 text-stone" />
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club} value={club}>{club}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.sportType} onValueChange={(v) => setFilters(f => ({ ...f, sportType: v }))}>
              <SelectTrigger className="w-[160px] border-bone">
                <Trophy className="h-4 w-4 mr-2 text-stone" />
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sportTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.location} onValueChange={(v) => setFilters(f => ({ ...f, location: v }))}>
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

            <div className="flex items-center gap-2">
              <Select value={filters.yearFrom} onValueChange={(v) => setFilters(f => ({ ...f, yearFrom: v }))}>
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
              <Select value={filters.yearTo} onValueChange={(v) => setFilters(f => ({ ...f, yearTo: v }))}>
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

            <div className="flex border border-bone rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-none ${viewMode === "grid" ? "bg-copper text-white" : ""}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("large")}
                className={`rounded-none ${viewMode === "large" ? "bg-copper text-white" : ""}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

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
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-silver mx-auto mb-4" />
            <p className="text-stone text-lg">No photos found</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="mt-4">
                Clear filters
              </Button>
            )}
          </div>
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
                onClick={() => handlePhotoClick(photo)}
              >
                <div className="relative">
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="w-full object-cover sepia-[0.2] group-hover:sepia-0 transition-all"
                  />
                  {photo.additional_images && photo.additional_images.length > 0 && (
                    <Badge className="absolute top-2 left-2 bg-black/70 text-white border-0 text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      {photo.additional_images.length + 1}
                    </Badge>
                  )}
                  {photo.year_taken && (
                    <Badge className="absolute top-2 right-2 bg-copper/90 text-white border-0 text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {photo.year_taken}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-granite text-sm mb-1 line-clamp-2">{photo.title}</h3>
                  {photo.club_name && (
                    <p className="text-xs text-stone mb-2">{photo.club_name}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-stone">
                    <button
                      onClick={(e) => handleLike(photo.id, photo.user_has_liked || false, e)}
                      disabled={!user || isLiking === photo.id}
                      className={`flex items-center gap-1 transition-colors ${
                        photo.user_has_liked ? "text-red-500" : "text-stone hover:text-red-500"
                      } disabled:opacity-50`}
                    >
                      <Heart className={`h-4 w-4 ${photo.user_has_liked ? "fill-current" : ""}`} />
                      {photo.like_count || 0}
                    </button>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {photo.view_count || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Photo Detail Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && closePhoto()}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-parchment max-h-[90vh] md:max-h-[90vh] h-screen md:h-auto overflow-y-auto">
          {selectedPhoto && (
            <div
              className="flex flex-col"
              onTouchStart={handleModalTouchStart}
              onTouchMove={handleModalTouchMove}
              onTouchEnd={handleModalTouchEnd}
            >
              <div className="relative bg-black">
                {(() => {
                  const allImages = [
                    { url: selectedPhoto.image_url, caption: null },
                    ...(selectedPhoto.additional_images || [])
                      .sort((a, b) => a.display_order - b.display_order)
                      .map(img => ({ url: img.image_url, caption: img.caption }))
                  ];
                  const hasMultipleImages = allImages.length >= 2;

                  return (
                    <>
                      {hasMultipleImages && (
                        <Button
                          onClick={() => setIsComparisonMode(!isComparisonMode)}
                          size="sm"
                          className="absolute top-4 right-4 bg-black/70 text-white hover:bg-black/90 z-20 text-xs h-9 md:h-8 px-4 md:px-3"
                        >
                          {isComparisonMode ? "Show All" : "Compare"}
                        </Button>
                      )}

                      {isComparisonMode && hasMultipleImages ? (
                        <BeforeAfterSlider
                          beforeImage={allImages[0].url}
                          afterImage={allImages[1].url}
                          beforeLabel={allImages[0].caption || "Before"}
                          afterLabel={allImages[1].caption || "After"}
                          className="aspect-[4/3]"
                        />
                      ) : (
                        <ImageCarousel images={allImages} className="aspect-[4/3]" />
                      )}

                      {sortedPhotos.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); navigatePhoto("prev"); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/90 z-10 h-12 w-12 md:h-10 md:w-10"
                          >
                            <ChevronLeft className="h-8 w-8 md:h-6 md:w-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); navigatePhoto("next"); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/90 z-10 h-12 w-12 md:h-10 md:w-10"
                          >
                            <ChevronRight className="h-8 w-8 md:h-6 md:w-6" />
                          </Button>
                        </>
                      )}

                      {selectedPhoto.year_taken && (
                        <Badge className="absolute top-4 left-4 bg-copper/90 text-white border-0 text-base z-10">
                          <Calendar className="h-4 w-4 mr-1" />
                          {selectedPhoto.year_taken}
                        </Badge>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="font-serif text-2xl text-granite">
                    {selectedPhoto.title}
                  </DialogTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPhoto.club_name && (
                      <Badge variant="secondary" className="bg-copper/10 text-copper">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedPhoto.club_name}
                      </Badge>
                    )}
                    {selectedPhoto.sport_type && (
                      <Badge variant="secondary" className="bg-copper/10 text-copper">
                        <Trophy className="h-3 w-3 mr-1" />
                        {selectedPhoto.sport_type}
                      </Badge>
                    )}
                    {selectedPhoto.location_name && (
                      <Badge variant="secondary" className="bg-bone text-stone">
                        <MapPin className="h-3 w-3 mr-1" />
                        {selectedPhoto.location_name}
                      </Badge>
                    )}
                  </div>
                </DialogHeader>

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
                    url={`/sport-clubs?photo=${selectedPhoto.id}`}
                    title={`Sport & Clubs: ${selectedPhoto.title}`}
                    description={selectedPhoto.description || `${selectedPhoto.club_name || "Cornwall"} photo from ${selectedPhoto.year_taken || "the past"}`}
                    variant="compact"
                  />
                </div>

                {selectedPhoto.description && (
                  <p className="text-stone text-sm leading-relaxed mb-3">
                    {selectedPhoto.description}
                  </p>
                )}

                {selectedPhoto.source_credit && (
                  <p className="text-silver text-xs italic">
                    Source: {selectedPhoto.source_credit}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default function SportClubsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SportClubsPageContent />
    </Suspense>
  );
}
