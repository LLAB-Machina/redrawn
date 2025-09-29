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
import { Check, Star, Sparkles } from "lucide-react";
import Image from "next/image";

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

  if (finishedPhotos.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Photo Settings</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No generated photos available yet.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Favorite Photo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {finishedPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="relative"
            >
              <div
                className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                  photo.is_favorite
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-muted hover:border-primary/50"
                }`}
                onClick={() => handleSetFavorite(photo.id!)}
              >
                {imageUrls[photo.id!] && (
                  <Image
                    src={imageUrls[photo.id!]}
                    alt="Generated photo option"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                )}
                {photo.is_favorite && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
              </div>
              <Button
                variant={photo.is_favorite ? "default" : "outline"}
                size="sm"
                className="w-full mt-2"
                onClick={() => handleSetFavorite(photo.id!)}
              >
                {photo.is_favorite ? (
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
        </div>
        <div className="flex justify-center pt-4 border-t">
          <Button onClick={handleGeneratePhoto} disabled={!selectedThemeId}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate New Photo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
