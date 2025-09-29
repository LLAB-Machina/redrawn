import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  GeneratedPhoto,
  useMarkGeneratedPhotoAsFavoriteMutation,
  useGeneratePhotoMutation,
} from "@/services/genApi";
import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Check, Star, Sparkles, RefreshCw } from "lucide-react";
import Image from "next/image";
import { LoadingBar } from "@/components/ui/loading-bar";

interface PhotoSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPhotoId: string;
  generatedPhotos: GeneratedPhoto[];
  ensureFileUrl: (fileId?: string | null) => Promise<string | null>;
  selectedThemeId: string;
}

export default function PhotoSettingsDialog({
  open,
  onOpenChange,
  originalPhotoId,
  generatedPhotos,
  ensureFileUrl,
  selectedThemeId,
}: PhotoSettingsDialogProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [markAsFavorite] = useMarkGeneratedPhotoAsFavoriteMutation();
  const [generatePhoto] = useGeneratePhotoMutation();

  const finishedPhotos = useMemo(
    () => generatedPhotos.filter((photo) => photo.state === "finished"),
    [generatedPhotos]
  );

  const processingPhotos = useMemo(
    () => generatedPhotos.filter((photo) => photo.state === "processing"),
    [generatedPhotos]
  );

  const allRelevantPhotos = useMemo(
    () => [...finishedPhotos, ...processingPhotos],
    [finishedPhotos, processingPhotos]
  );

  useEffect(() => {
    if (!open || finishedPhotos.length === 0) {
      return;
    }

    const loadImageUrls = async () => {
      const urls: Record<string, string> = {};
      for (const photo of finishedPhotos) {
        if (photo.file_id) {
          const url = await ensureFileUrl(photo.file_id);
          if (url) {
            urls[photo.id!] = url;
          }
        }
      }
      setImageUrls(urls);
    };

    loadImageUrls();
  }, [open, finishedPhotos, ensureFileUrl]);

  const handleSetFavorite = async (generatedPhotoId: string) => {
    try {
      await markAsFavorite({
        markAsFavoriteRequest: {
          original_photo_id: originalPhotoId,
          generated_photo_id: generatedPhotoId,
        },
      }).unwrap();
    } catch (error) {
      console.error("Failed to mark as favorite:", error);
    }
  };

  const handleGeneratePhoto = async () => {
    if (!selectedThemeId) return;

    try {
      await generatePhoto({
        id: originalPhotoId,
        generateRequest: {
          theme_id: selectedThemeId,
        },
      }).unwrap();
    } catch (error) {
      console.error("Failed to generate photo:", error);
    }
  };

  if (allRelevantPhotos.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Photo Settings</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-6">
              No generated photos available yet.
            </p>
          </div>
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative w-48"
            >
              <div
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary/50 bg-muted/30 cursor-pointer transition-all hover:border-primary hover:bg-muted/50"
                onClick={handleGeneratePhoto}
              >
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium text-center">
                    Generate New Photo
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={handleGeneratePhoto}
                disabled={!selectedThemeId}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose Favorite Photo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {allRelevantPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="relative"
            >
              <div
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  photo.state === "processing"
                    ? "border-orange-400 bg-muted cursor-default"
                    : photo.is_favorite
                    ? "border-primary ring-2 ring-primary/20 cursor-pointer"
                    : "border-muted hover:border-primary/50 cursor-pointer"
                }`}
                onClick={() =>
                  photo.state === "finished" && handleSetFavorite(photo.id!)
                }
              >
                {photo.state === "finished" && imageUrls[photo.id!] && (
                  <Image
                    src={imageUrls[photo.id!]}
                    alt="Generated photo option"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                )}
                {photo.state === "processing" && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <div className="w-full max-w-32">
                      <LoadingBar duration={30} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Generating...
                    </p>
                  </div>
                )}
                {photo.state === "finished" && photo.is_favorite && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                )}
                {photo.state === "finished" && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                )}
              </div>
              <Button
                variant={photo.is_favorite ? "default" : "outline"}
                size="sm"
                className="w-full mt-2"
                onClick={() =>
                  photo.state === "finished" && handleSetFavorite(photo.id!)
                }
                disabled={photo.state === "processing"}
              >
                {photo.state === "processing" ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : photo.is_favorite ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Current Favorite
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Set as Favorite
                  </>
                )}
              </Button>
            </motion.div>
          ))}
          {/* Generate New Photo Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.2,
              delay: allRelevantPhotos.length * 0.05,
            }}
            className="relative"
          >
            <div
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary/50 bg-muted/30 cursor-pointer transition-all hover:border-primary hover:bg-muted/50"
              onClick={handleGeneratePhoto}
            >
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                <Sparkles className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium text-center">
                  Generate New Photo
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleGeneratePhoto}
              disabled={!selectedThemeId}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
