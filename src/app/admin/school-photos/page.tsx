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
  GraduationCap,
  MapPin,
  Calendar,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  ArrowLeft,
  School,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";

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
  is_published: boolean;
  is_pending: boolean;
  created_at: string;
  created_by: string;
  submitter_email: string | null;
}

export default function AdminSchoolPhotosPage() {
  const router = useRouter();
  const { user, isAdmin, isModerator, isLoading: authLoading } = useUser();
  const [photos, setPhotos] = useState<SchoolPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
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

    let query = (supabase.from("school_photos") as any).select("*");

    if (activeTab === "pending") {
      query = query.eq("is_pending", true).eq("is_published", false);
    } else if (activeTab === "approved") {
      query = query.eq("is_published", true);
    } else {
      query = query.eq("is_pending", false).eq("is_published", false);
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
    if (isAdmin) {
      loadPhotos();
    }
  }, [isAdmin, activeTab]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const supabase = createClient();

    const { error } = await (supabase.from("school_photos") as any)
      .update({ is_published: true, is_pending: false })
      .eq("id", id);

    if (error) {
      console.error("Error approving photo:", error);
    } else {
      loadPhotos();
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const supabase = createClient();

    const { error } = await (supabase.from("school_photos") as any)
      .update({ is_published: false, is_pending: false })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting photo:", error);
    } else {
      loadPhotos();
    }
    setProcessingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    
    setProcessingId(id);
    const supabase = createClient();

    const { error } = await (supabase.from("school_photos") as any)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting photo:", error);
    } else {
      loadPhotos();
    }
    setProcessingId(null);
  };

  if (authLoading || !isAdmin) {
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
              <GraduationCap className="h-8 w-8 text-atlantic" />
              School Photos
            </h1>
            <p className="text-stone">Review and manage school photo submissions</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-granite" />
              </div>
            ) : photos.length === 0 ? (
              <Card className="border-bone bg-cream text-center py-12">
                <CardContent>
                  <GraduationCap className="h-12 w-12 text-stone mx-auto mb-4" />
                  <h3 className="font-serif text-xl text-granite mb-2">
                    No {activeTab} photos
                  </h3>
                  <p className="text-stone">
                    {activeTab === "pending" 
                      ? "No school photos waiting for review."
                      : activeTab === "approved"
                      ? "No approved school photos yet."
                      : "No rejected school photos."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo) => (
                  <Card key={photo.id} className="border-bone bg-cream overflow-hidden">
                    <div className="relative aspect-[4/3] bg-stone/10">
                      <img
                        src={photo.image_url}
                        alt={photo.title || photo.school_name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-medium text-granite line-clamp-1">
                          {photo.title || photo.school_name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <School className="h-3 w-3 mr-1" />
                            {photo.school_name}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {photo.location_name}
                          </Badge>
                          {photo.year_taken && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {photo.year_taken}
                            </Badge>
                          )}
                          {photo.class_name && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {photo.class_name}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {photo.description && (
                        <p className="text-sm text-stone line-clamp-2">
                          {photo.description}
                        </p>
                      )}

                      <div className="text-xs text-stone">
                        Submitted: {new Date(photo.created_at).toLocaleDateString()}
                        {photo.submitter_email && (
                          <span className="block truncate">{photo.submitter_email}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {activeTab === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(photo.id)}
                              disabled={processingId === photo.id}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                              {processingId === photo.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(photo.id)}
                              disabled={processingId === photo.id}
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {activeTab === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(photo.id)}
                            disabled={processingId === photo.id}
                            className="flex-1"
                          >
                            Unpublish
                          </Button>
                        )}
                        {activeTab === "rejected" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(photo.id)}
                              disabled={processingId === photo.id}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(photo.id)}
                              disabled={processingId === photo.id}
                              className="flex-1"
                            >
                              Delete
                            </Button>
                          </>
                        )}
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
