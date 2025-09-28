import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/genApi";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Zap, RefreshCw } from "lucide-react";
import Image from "next/image";

interface PhotoCardProps {
  original: {
    id?: string;
    file_id?: string | null;
    processing?: number | null;
  };
  index: number;
  ensureFileUrl: (fileId?: string | null) => Promise<string | null>;
  selectedThemeId: string;
  onGenerate: () => void;
}

export default function PhotoCard({
  original,
  index,
  ensureFileUrl,
  selectedThemeId,
  onGenerate,
}: PhotoCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<
    Array<{ file_id?: string | null; url?: string | null; state?: string }>
  >([]);
  const [showGenerated, setShowGenerated] = useState(false);
  const [triggerGenerated] = api.useLazyListGeneratedPhotosQuery();

  useEffect(() => {
    ensureFileUrl(original.file_id).then(setImageUrl);
  }, [original.file_id, ensureFileUrl]);

  const loadGenerated = async () => {
    if (!original.id) return;

    try {
      const data = await triggerGenerated({ id: original.id }).unwrap();
      const imagesWithUrls = await Promise.all(
        data.map(async (img) => ({
          ...img,
          url: await ensureFileUrl(img.file_id),
        }))
      );
      setGeneratedImages(imagesWithUrls);
    } catch (error) {
      console.error("Failed to load generated images:", error);
    }
  };

  const handleShowGenerated = () => {
    if (!showGenerated) {
      loadGenerated();
    }
    setShowGenerated(!showGenerated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Original photo"
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Button size="sm" onClick={onGenerate} disabled={!selectedThemeId}>
              <Zap className="h-4 w-4 mr-1" />
              Generate
            </Button>
            {(original.processing ?? 0) > 0 && (
              <Badge variant="secondary" className="text-xs">
                Processing ×{original.processing}
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={handleShowGenerated}
          >
            {showGenerated ? "Hide" : "Show"} Generated
          </Button>

          {showGenerated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-2"
            >
              {generatedImages.map((img, i) => (
                <div
                  key={i}
                  className="aspect-square bg-muted rounded overflow-hidden"
                >
                  {img.url ? (
                    <Image
                      src={img.url}
                      alt="Generated"
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      {img.state}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
