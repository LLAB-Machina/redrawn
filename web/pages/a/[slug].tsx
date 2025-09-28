import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetPublicAlbumBySlugQuery, api } from "@/services/genApi";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Image as ImageIcon, Share2, Download, Eye, Users } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function PublicAlbumPage() {
  const router = useRouter();
  const { slug } = router.query as { slug: string };

  const { data: album, error } = useGetPublicAlbumBySlugQuery(
    { slug },
    { skip: !slug }
  );
  const [triggerFileUrl] = api.useLazyGetPhotoFileUrlQuery();
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  const ensureFileUrl = useCallback(
    async (fileId?: string | null): Promise<string | null> => {
      if (!fileId) return null;
      if (fileUrls[fileId]) return fileUrls[fileId];

      try {
        const data = await triggerFileUrl({ id: fileId }).unwrap();
        const url = data.url || null;
        if (url) {
          setFileUrls((prev) => ({ ...prev, [fileId]: url }));
        }
        return url;
      } catch {
        return null;
      }
    },
    [fileUrls, triggerFileUrl]
  );

  const handleShare = async () => {
    try {
      await navigator.share({
        title: album?.name || "Photo Album",
        text: `Check out this photo album: ${album?.name}`,
        url: window.location.href,
      });
    } catch {
      // Fallback to copying URL
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Album link copied to clipboard!");
    }
  };

  if (error) {
    return (
      <PublicLayout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="text-center py-12">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Album not found</h2>
              <p className="text-muted-foreground mb-4">
                This album doesn&apos;t exist or is not publicly accessible.
              </p>
              <Button onClick={() => router.push("/")}>Back to Home</Button>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (!album) {
    return (
      <PublicLayout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading album...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const canOpen =
    album.member_role === "contributor" || album.member_role === "editor";
  const photoCount = album.photo_count ?? (album.photos?.length || 0);
  const contributorCount = album.contributor_count ?? 0;

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto py-8 space-y-8">
        {/* Album Header with collage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="aspect-[4/2] bg-muted rounded-lg overflow-hidden">
            <PublicAlbumCollage
              photos={album.photos || []}
              ensureFileUrl={ensureFileUrl}
            />
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">{album.name}</h1>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary">/{album.slug}</Badge>
              <Badge variant="outline">{photoCount} photos</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {contributorCount} contributor
                {contributorCount === 1 ? "" : "s"}
              </Badge>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Album
              </Button>
              {canOpen && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/app/albums/${album.id}`)}
                >
                  Open (contributors only)
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Photos Grid */}
        {!album.photos?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                <p className="text-muted-foreground text-center">
                  This album is empty. Check back later for updates!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {album.photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                ensureFileUrl={ensureFileUrl}
              />
            ))}
          </motion.div>
        )}
      </div>
    </PublicLayout>
  );
}

interface PhotoCardProps {
  photo: {
    id?: string;
    file_id?: string | null;
  };
  index: number;
  ensureFileUrl: (fileId?: string | null) => Promise<string | null>;
}

function PhotoCard({ photo, index, ensureFileUrl }: PhotoCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ensureFileUrl(photo.file_id).then((url) => {
      setImageUrl(url);
      setIsLoading(false);
    });
  }, [photo.file_id, ensureFileUrl]);

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photo-${photo.id || "unknown"}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Photo downloaded!");
    } catch {
      toast.error("Failed to download photo");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt="Photo"
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {/* Overlay with download button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              disabled={!imageUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function PublicAlbumCollage({
  photos,
  ensureFileUrl,
}: {
  photos: Array<{ id?: string; file_id?: string | null }>;
  ensureFileUrl: (fileId?: string | null) => Promise<string | null>;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      const top = (photos || []).slice(0, 4);
      const out: string[] = [];
      for (const p of top) {
        const url = await ensureFileUrl(p.file_id);
        if (url) out.push(url);
      }
      if (!isCancelled) setUrls(out);
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [photos, ensureFileUrl]);

  if (!urls.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  const gridClass = urls.length <= 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className={`w-full h-full grid ${gridClass} gap-[2px] bg-background`}>
      {urls.map((u, i) => (
        <div
          key={i}
          className={urls.length === 3 && i === 0 ? "row-span-2" : ""}
        >
          <div className="relative w-full h-full min-h-full">
            <Image
              src={u}
              alt="preview"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
