"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  MapPin,
  Calendar,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";

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
  is_published: boolean;
  created_at: string;
  user_id: string;
  view_count: number;
  like_count: number;
}

export default function AdminSportClubsPage() {
  const router = useRouter();
  const { user, isAdmin, isModerator, isLoading: authLoading } = useUser();
  const [photos, setPhotos] = useState<SportClubPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Redirect non-moderators
  useEffect(() => {
    if (!authLoading && !isModerator) {
      router.push("/");
    }
  }, [authLoading, isModerator, router]);

  const loadPhotos = async () => {
    setIsLoading(true);
    const supabase = createClient();

    let query = (supabase.from("sport_clubs") as any).select("*");

    if (activeTab === "pending") {
      query = query.eq("is_published", false);
    } else {
      query = query.eq("is_published", true);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error loading photos:", error);
    } else {
      setPhotos(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isModerator) {
      loadPhotos();
    }
  }, [isModerator, activeTab]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const supabase = createClient();

    const { error } = await (supabase.from("sport_clubs") as any)
      .update({ is_published: true })
      .eq("id", id);

    if (error) {
      console.error("Error approving photo:", error);
    } else {
      loadPhotos();
    }
    setProcessingId(null);
  };

  const handleUnpublish = async (id: string) => {
    setProcessingId(id);
    const supabase = createClient();

    const { error } = await (supabase.from("sport_clubs") as any)
      .update({ is_published: false })
      .eq("id", id);

    if (error) {
      console.error("Error unpublishing photo:", error);
    } else {
      loadPhotos();
    }
    setProcessingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this photo?")) return;

    setProcessingId(id);
    const supabase = createClient();

    const { error } = await (supabase.from("sport_clubs") as any)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting photo:", error);
    } else {
      loadPhotos();
    }
    setProcessingId(null);
  };

  if (authLoading || !isModerator) {
    return (
      <div className="flex min-h-screen flex-col bg-parchment">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-granite" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back to Admin */}
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-granite mb-2 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-copper" />
              Sport & Clubs Photos
            </h1>
            <p className="text-stone">Review and manage sport & clubs photo submissions</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Pending Review
              {!isLoading && (
                <Badge variant="secondary" className="bg-copper/20 text-copper">
                  {photos.filter(p => !p.is_published).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              Published
              {!isLoading && (
                <Badge variant="secondary">
                  {photos.filter(p => p.is_published).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-granite" />
              </div>
            ) : photos.filter(p => !p.is_published).length === 0 ? (
              <Card className="border-bone">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <p className="text-lg font-medium text-granite">All caught up!</p>
                  <p className="text-stone">No photos pending review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {photos.filter(p => !p.is_published).map((photo) => (
                  <Card key={photo.id} className="border-bone overflow-hidden">
                    <div className="relative">
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-48 object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-copper/90 text-white">
                        Pending
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-granite mb-2">{photo.title}</h3>

                      <div className="space-y-1 text-sm text-stone mb-4">
                        {photo.club_name && (
                          <p className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {photo.club_name}
                          </p>
                        )}
                        {photo.sport_type && (
                          <p className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {photo.sport_type}
                          </p>
                        )}
                        {photo.location_name && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {photo.location_name}
                          </p>
                        )}
                        {photo.year_taken && (
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {photo.year_taken}
                          </p>
                        )}
                      </div>

                      {photo.description && (
                        <p className="text-xs text-stone mb-4 line-clamp-2">
                          {photo.description}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(photo.id)}
                          disabled={processingId === photo.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          {processingId === photo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDelete(photo.id)}
                          disabled={processingId === photo.id}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-granite" />
              </div>
            ) : photos.filter(p => p.is_published).length === 0 ? (
              <Card className="border-bone">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-silver mb-4" />
                  <p className="text-lg font-medium text-granite">No published photos yet</p>
                  <p className="text-stone">Approved photos will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {photos.filter(p => p.is_published).map((photo) => (
                  <Card key={photo.id} className="border-bone overflow-hidden">
                    <div className="relative">
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-48 object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                        Published
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-granite mb-2">{photo.title}</h3>

                      <div className="space-y-1 text-sm text-stone mb-4">
                        {photo.club_name && (
                          <p className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {photo.club_name}
                          </p>
                        )}
                        {photo.sport_type && (
                          <p className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {photo.sport_type}
                          </p>
                        )}
                        <p className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {photo.view_count} views, {photo.like_count} likes
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUnpublish(photo.id)}
                          disabled={processingId === photo.id}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {processingId === photo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Unpublish
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDelete(photo.id)}
                          disabled={processingId === photo.id}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
