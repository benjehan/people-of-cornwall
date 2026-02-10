"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Trash2,
  Eye,
  Calendar,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { ImageCropDialog } from "@/components/story/image-crop-dialog";

interface Photo {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  year_taken: string | null;
  location_name: string | null;
  source_credit: string | null;
  is_published: boolean;
  is_pending: boolean;
  view_count: number;
  like_count: number;
  submitter_email: string | null;
  created_at: string;
  created_by: string | null;
  user?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

export default function AdminLostCornwallPage() {
  const router = useRouter();
  const { user, isAdmin, isModerator, isLoading: authLoading } = useUser();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Create photo state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    yearTaken: "",
    locationName: "",
    locationLat: null as number | null,
    locationLng: null as number | null,
    sourceCredit: "",
    imageUrl: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isModerator)) {
      router.push("/");
    }
  }, [authLoading, user, isModerator, router]);

  const loadPhotos = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await (supabase
      .from("lost_cornwall") as any)
      .select(`
        *,
        user:users!created_by (
          display_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading photos:", error);
    } else {
      setPhotos(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && isModerator) {
      loadPhotos();
    }
  }, [user, isModerator]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be less than 10MB");
      return;
    }
    
    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setShowCropDialog(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "admin-photo.jpg", { type: "image/jpeg" });
    setImageFile(croppedFile);
    setImagePreview(URL.createObjectURL(croppedBlob));
    setShowCropDialog(false);
    setImageToCrop(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return createForm.imageUrl || null;

    const supabase = createClient();
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `lost-cornwall/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("story-media")
      .upload(fileName, imageFile, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("story-media")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const createPhoto = async () => {
    if (!createForm.title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!imageFile && !createForm.imageUrl) {
      alert("Please upload an image or provide an image URL");
      return;
    }

    setIsCreating(true);
    try {
      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error("Failed to get image URL");

      const supabase = createClient();
      await (supabase.from("lost_cornwall") as any).insert({
        title: createForm.title.trim(),
        description: createForm.description.trim() || null,
        image_url: imageUrl,
        year_taken: createForm.yearTaken.trim() || null,
        location_name: createForm.locationName || null,
        location_lat: createForm.locationLat,
        location_lng: createForm.locationLng,
        source_credit: createForm.sourceCredit.trim() || null,
        created_by: user?.id,
        is_published: true, // Admin-created, publish immediately
        is_pending: false,
      });

      setShowCreateDialog(false);
      setCreateForm({
        title: "",
        description: "",
        yearTaken: "",
        locationName: "",
        locationLat: null,
        locationLng: null,
        sourceCredit: "",
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview(null);
      await loadPhotos();
    } catch (err) {
      console.error("Error creating photo:", err);
      alert("Failed to create photo");
    } finally {
      setIsCreating(false);
    }
  };

  const approvePhoto = async (photo: Photo) => {
    setIsProcessing(true);
    const supabase = createClient();

    await (supabase
      .from("lost_cornwall") as any)
      .update({
        is_pending: false,
        is_published: true,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", photo.id);

    await loadPhotos();
    setIsProcessing(false);
    setShowDetailDialog(false);
    setSelectedPhoto(null);
  };

  const unpublishPhoto = async (photo: Photo) => {
    setIsProcessing(true);
    const supabase = createClient();

    await (supabase
      .from("lost_cornwall") as any)
      .update({ is_published: false })
      .eq("id", photo.id);

    await loadPhotos();
    setIsProcessing(false);
  };

  const rejectPhoto = async () => {
    if (!selectedPhoto) return;
    setIsProcessing(true);
    const supabase = createClient();

    // Delete the photo
    await (supabase
      .from("lost_cornwall") as any)
      .delete()
      .eq("id", selectedPhoto.id);

    setShowRejectDialog(false);
    setSelectedPhoto(null);
    setRejectReason("");
    await loadPhotos();
    setIsProcessing(false);
  };

  const deletePhoto = async (photo: Photo) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    
    setIsProcessing(true);
    const supabase = createClient();

    await (supabase
      .from("lost_cornwall") as any)
      .delete()
      .eq("id", photo.id);

    await loadPhotos();
    setIsProcessing(false);
  };

  const pendingPhotos = photos.filter(p => p.is_pending);
  const publishedPhotos = photos.filter(p => p.is_published && !p.is_pending);
  const unpublishedPhotos = photos.filter(p => !p.is_published && !p.is_pending);

  if (authLoading || !isModerator) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-granite" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-1 text-sm text-stone hover:text-granite"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
            <h1 className="font-serif text-3xl text-granite">Lost Cornwall Management</h1>
            <p className="text-stone mt-1">Review submissions and manage the historic photo gallery</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-sepia text-white hover:bg-sepia/90 shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Photo
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-granite" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Submissions */}
            {pendingPhotos.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-granite mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Review ({pendingPhotos.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingPhotos.map((photo) => (
                    <Card key={photo.id} className="border-yellow-200 bg-yellow-50/50">
                      <div 
                        className="relative aspect-[4/3] cursor-pointer overflow-hidden"
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowDetailDialog(true);
                        }}
                      >
                        <img
                          src={photo.image_url}
                          alt={photo.title}
                          className="absolute inset-0 w-full h-full object-cover rounded-t-lg sepia-[0.2]"
                        />
                        {photo.year_taken && (
                          <Badge className="absolute top-2 right-2 bg-sepia/90 text-parchment">
                            {photo.year_taken}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-serif font-bold text-granite truncate">
                          {photo.title}
                        </h3>
                        {photo.location_name && (
                          <p className="text-sm text-stone flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {photo.location_name}
                          </p>
                        )}
                        <p className="text-xs text-silver mt-2">
                          By: {photo.user?.display_name || photo.submitter_email || "Unknown"}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => approvePhoto(photo)}
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedPhoto(photo);
                              setShowRejectDialog(true);
                            }}
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Published Photos */}
            {publishedPhotos.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-granite mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Published ({publishedPhotos.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {publishedPhotos.map((photo) => (
                    <Card key={photo.id} className="border-bone bg-cream">
                      <div 
                        className="relative aspect-[4/3] cursor-pointer overflow-hidden"
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowDetailDialog(true);
                        }}
                      >
                        <img
                          src={photo.image_url}
                          alt={photo.title}
                          className="absolute inset-0 w-full h-full object-cover rounded-t-lg sepia-[0.2]"
                        />
                        {photo.year_taken && (
                          <Badge className="absolute top-2 right-2 bg-sepia/90 text-parchment text-xs">
                            {photo.year_taken}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-granite text-sm truncate">
                          {photo.title}
                        </h3>
                        <div className="flex items-center justify-between mt-2 text-xs text-stone">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {photo.view_count || 0}
                          </span>
                          <span>❤️ {photo.like_count || 0}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => unpublishPhoto(photo)}
                            disabled={isProcessing}
                            className="flex-1 text-xs h-7"
                          >
                            Unpublish
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePhoto(photo)}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Unpublished/Draft Photos */}
            {unpublishedPhotos.length > 0 && (
              <section>
                <h2 className="font-serif text-xl text-granite mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-stone" />
                  Unpublished ({unpublishedPhotos.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {unpublishedPhotos.map((photo) => (
                    <Card key={photo.id} className="border-bone bg-cream/50 opacity-75">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={photo.image_url}
                          alt={photo.title}
                          className="absolute inset-0 w-full h-full object-cover rounded-t-lg sepia-[0.3]"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-granite text-sm truncate">
                          {photo.title}
                        </h3>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => approvePhoto(photo)}
                            disabled={isProcessing}
                            className="flex-1 text-xs h-7 bg-green-600 hover:bg-green-700 text-white"
                          >
                            Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePhoto(photo)}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {photos.length === 0 && (
              <Card className="border-bone bg-cream text-center py-12">
                <CardContent>
                  <Camera className="h-12 w-12 text-stone/30 mx-auto mb-4" />
                  <h3 className="font-serif text-xl text-granite mb-2">No Photos Yet</h3>
                  <p className="text-stone">
                    Historic photos will appear here when users submit them.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif">{selectedPhoto.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                  <img
                    src={selectedPhoto.image_url}
                    alt={selectedPhoto.title}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-granite">Year:</span>
                    <span className="text-stone ml-2">{selectedPhoto.year_taken || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-granite">Location:</span>
                    <span className="text-stone ml-2">{selectedPhoto.location_name || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-granite">Source:</span>
                    <span className="text-stone ml-2">{selectedPhoto.source_credit || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-granite">Submitted by:</span>
                    <span className="text-stone ml-2">
                      {selectedPhoto.user?.display_name || selectedPhoto.submitter_email || "Unknown"}
                    </span>
                  </div>
                </div>
                {selectedPhoto.description && (
                  <div>
                    <span className="font-medium text-granite">Description:</span>
                    <p className="text-stone mt-1">{selectedPhoto.description}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                {selectedPhoto.is_pending && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowDetailDialog(false);
                        setShowRejectDialog(true);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => approvePhoto(selectedPhoto)}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & Publish"}
                    </Button>
                  </>
                )}
                {!selectedPhoto.is_pending && (
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Photo</DialogTitle>
            <DialogDescription>
              This will permanently delete the photo. Optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={rejectPhoto}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject & Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Photo Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Historic Photo
            </DialogTitle>
            <DialogDescription>
              Add a new photo to the Lost Cornwall gallery
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Photo *</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-bone sepia-[0.2]"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById("admin-photo-upload")?.click()}
                  className="border-2 border-dashed border-sepia/30 rounded-lg p-6 text-center cursor-pointer hover:border-sepia transition-colors bg-sepia/5"
                >
                  <Upload className="h-8 w-8 text-sepia/60 mx-auto mb-2" />
                  <p className="text-sm text-stone">Click to upload image</p>
                </div>
              )}
              <input
                id="admin-photo-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-xs text-stone">Or provide an image URL:</p>
              <Input
                value={createForm.imageUrl}
                onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="border-bone"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g., Newlyn Harbour, fishing boats"
                className="border-bone"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Tell us about this photo..."
                className="border-bone"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Year */}
              <div className="space-y-2">
                <Label>Approximate Date/Year</Label>
                <Input
                  value={createForm.yearTaken}
                  onChange={(e) => setCreateForm({ ...createForm, yearTaken: e.target.value })}
                  placeholder="e.g., 1920s, circa 1950"
                  className="border-bone"
                />
              </div>

              {/* Source */}
              <div className="space-y-2">
                <Label>Source/Credit</Label>
                <Input
                  value={createForm.sourceCredit}
                  onChange={(e) => setCreateForm({ ...createForm, sourceCredit: e.target.value })}
                  placeholder="e.g., Cornwall Record Office"
                  className="border-bone"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location (if known)</Label>
              <LocationAutocomplete
                value={createForm.locationName}
                onChange={(location) => {
                  setCreateForm({
                    ...createForm,
                    locationName: location.name,
                    locationLat: location.lat,
                    locationLng: location.lng,
                  });
                }}
                placeholder="Search for location..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={createPhoto}
              disabled={isCreating}
              className="bg-sepia text-white hover:bg-sepia/90"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={showCropDialog && !!imageToCrop}
        onOpenChange={(open) => {
          if (!open) {
            setShowCropDialog(false);
            setImageToCrop(null);
          }
        }}
        imageSrc={imageToCrop || ""}
        onCropComplete={handleCropComplete}
        aspectRatio={4 / 3}
      />

      <Footer />
    </div>
  );
}
