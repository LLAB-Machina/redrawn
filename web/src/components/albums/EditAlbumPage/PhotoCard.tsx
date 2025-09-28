import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GeneratedPhoto,
  OriginalPhoto,
  useGeneratePhotoMutation,
} from "@/services/genApi";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ImageIcon, RefreshCw, Sparkles } from "lucide-react";
import Image from "next/image";
import { LoadingBar } from "@/components/ui/loading-bar";

interface PhotoCardProps {
  originalPhoto: OriginalPhoto;
  index: number;
  ensureFileUrl: (fileId?: string | null) => Promise<string | null>;
  selectedThemeId: string;
}

export default function PhotoCard({
  originalPhoto,
  index,
  ensureFileUrl,
  selectedThemeId,
}: PhotoCardProps) {
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [favoriteGeneratedPhoto, setFavoriteGeneratedPhoto] =
    useState<GeneratedPhoto | null>(null);

  const [generatePhoto] = useGeneratePhotoMutation();

  useEffect(() => {
    ensureFileUrl(originalPhoto.file_id).then(setOriginalImageUrl);
  }, [originalPhoto.file_id, ensureFileUrl]);

  useEffect(() => {
    ensureFileUrl(favoriteGeneratedPhoto?.file_id).then(setGeneratedImageUrl);
  }, [favoriteGeneratedPhoto?.file_id, ensureFileUrl]);

  useEffect(() => {
    if (
      originalPhoto.generated_photos &&
      originalPhoto.generated_photos.length > 0
    ) {
      const favoritePhoto =
        originalPhoto.generated_photos.find(
          (generated) => generated.is_favorite
        ) ?? originalPhoto.generated_photos[0];
      if (favoritePhoto.state === "finished") {
        setFavoriteGeneratedPhoto(favoritePhoto);
      }
    }
  }, [originalPhoto.generated_photos]);

  const noGeneratedPhotos = originalPhoto.generated_photos?.length === 0;

  const handleGeneratePhoto = async () => {
    if (!selectedThemeId) return;

    try {
      await generatePhoto({
        id: originalPhoto.id!,
        generateRequest: {
          theme_id: selectedThemeId,
        },
      }).unwrap();
    } catch (error) {
      console.error("Failed to generate photo:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group">
        <CardContent className="p-0">
          <div className="flex flex-row overflow-hidden rounded-lg">
            <div className="aspect-square bg-muted relative w-48 h-48">
              {originalImageUrl ? (
                <Image
                  src={originalImageUrl}
                  alt="Original photo"
                  fill
                  className="object-cover transition-transform"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="aspect-square bg-muted relative overflow-hidden w-48 h-48">
              {generatedImageUrl && (
                <Image
                  src={generatedImageUrl}
                  alt="Generated photo"
                  fill
                  className="object-cover transition-transform"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}
              {!generatedImageUrl && !noGeneratedPhotos && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <div className="w-full max-w-32">
                    <LoadingBar duration={30} />
                  </div>
                  <p className="text-xs text-muted-foreground">Generating...</p>
                </div>
              )}
              {noGeneratedPhotos && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      No generated images
                    </p>
                    <Button
                      size="sm"
                      onClick={handleGeneratePhoto}
                      disabled={!selectedThemeId}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
