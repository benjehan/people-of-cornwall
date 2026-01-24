"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Camera, 
  Clock, 
  MapPin, 
  MessageCircle, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Info,
  Star,
  Heart,
  SortAsc,
  TrendingUp,
  ArrowDownAZ,
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

type SortOption = "popular" | "recent" | "views";

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

export default function LostCornwallPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, isLoading: authLoading } = useUser();
  const [photos, setPhotos] = useState<LostCornwallPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<LostCornwallPhoto | null>(null);
  const [memoryText, setMemoryText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [isLiking, setIsLiking] = useState<string | null>(null);

  // Temporarily admin-only while polishing
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [authLoading, isAdmin, router]);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await (supabase
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
  }, [user]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const openPhoto = async (photo: LostCornwallPhoto) => {
    setSelectedPhoto(photo);
    // Increment view count
    const supabase = createClient();
    await (supabase
      .from("lost_cornwall") as any)
      .update({ view_count: (photo.view_count || 0) + 1 })
      .eq("id", photo.id);
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
      // Reload photos to get new memory
      await loadPhotos();
      // Update selected photo
      const updated = photos.find(p => p.id === selectedPhoto.id);
      if (updated) setSelectedPhoto(updated);
      // Clear message after 3 seconds
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
    setSelectedPhoto(sortedPhotos[newIndex]);
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

    // Update selected photo if viewing
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(prev => prev ? {
        ...prev,
        like_count: hasLiked ? prev.like_count - 1 : prev.like_count + 1,
        user_has_liked: !hasLiked,
      } : null);
    }

    setIsLiking(null);
  };

  // Sort photos based on selected option
  const sortedPhotos = [...photos].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.like_count || 0) - (a.like_count || 0);
      case "views":
        return (b.view_count || 0) - (a.view_count || 0);
      case "recent":
      default:
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
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

        {/* Sort Controls */}
        {photos.length > 0 && (
          <div className="flex justify-center gap-2 mb-8">
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("popular")}
              className={sortBy === "popular" ? "bg-sepia text-parchment" : "border-bone"}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Most Loved
            </Button>
            <Button
              variant={sortBy === "views" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("views")}
              className={sortBy === "views" ? "bg-sepia text-parchment" : "border-bone"}
            >
              <Eye className="h-4 w-4 mr-1" />
              Most Viewed
            </Button>
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("recent")}
              className={sortBy === "recent" ? "bg-sepia text-parchment" : "border-bone"}
            >
              <Clock className="h-4 w-4 mr-1" />
              Recent
            </Button>
          </div>
        )}

        {/* Photo Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-granite" />
          </div>
        ) : photos.length === 0 ? (
          <Card className="border-bone bg-cream text-center py-12">
            <CardContent>
              <Camera className="h-12 w-12 text-stone mx-auto mb-4" />
              <h3 className="font-serif text-xl text-granite mb-2">Coming Soon</h3>
              <p className="text-stone">
                Historic photographs will be added soon. Check back!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPhotos.map((photo) => (
              <Card 
                key={photo.id} 
                className="border-bone bg-cream overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
                onClick={() => openPhoto(photo)}
              >
                <div className="relative aspect-[4/3] bg-stone/10 overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 sepia-[0.3]"
                  />
                  {/* Vintage overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Year badge */}
                  {photo.year_taken && (
                    <Badge className="absolute top-3 right-3 bg-sepia/90 text-parchment border-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {photo.year_taken}
                    </Badge>
                  )}

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-serif text-lg text-parchment font-bold line-clamp-1">
                      {photo.title}
                    </h3>
                    {photo.location_name && (
                      <p className="text-sm text-parchment/80 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {photo.location_name}
                      </p>
                    )}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-stone">
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
              <a href="mailto:hello@peopleofcornwall.com?subject=Lost Cornwall Photo Contribution">
                <Button variant="outline" className="border-sepia text-sepia hover:bg-sepia hover:text-parchment">
                  Contact Us
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
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
