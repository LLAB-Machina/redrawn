import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useGetAlbumByIdQuery,
  useListThemesQuery,
  useGenerateOriginalPhotoMutation,
  api,
  useListOriginalPhotosQuery,
} from "@/services/genApi";
import { useRouter } from "next/router";
import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { Upload, Image as ImageIcon, RefreshCw } from "lucide-react";
import PhotoCard from "@/components/albums/EditAlbumPage/PhotoCard";
import EditAlbumHeader from "@/components/albums/EditAlbumPage/EditAlbumHeader";
import EditAlbumQuickActions from "@/components/albums/EditAlbumPage/EditAlbumQuickActions";

export default function EditAlbumPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: album } = useGetAlbumByIdQuery({ id }, { skip: !id });
  const { data: originals } = useListOriginalPhotosQuery({ id }, { skip: !id });
  const { data: themes } = useListThemesQuery({});

  const [generateImage] = useGenerateOriginalPhotoMutation();
  const [triggerFileUrl] = api.useLazyGetPhotoFileUrlQuery();

  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default theme
  useEffect(() => {
    if (!selectedThemeId && themes && themes.length > 0) {
      setSelectedThemeId(themes[0].id || "");
    }
  }, [themes, selectedThemeId]);

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

  if (!album) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <EditAlbumHeader />
        <EditAlbumQuickActions />

        {/* Photos Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Photos</h2>
            <div className="text-sm text-muted-foreground">
              {originals?.length || 0} original
              {originals?.length !== 1 ? "s" : ""}
            </div>
          </div>

          {!originals?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload your first photos to get started with AI-powered
                  styling.
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {originals.map((original, index) => (
                  <PhotoCard
                    key={original.id}
                    original={original}
                    index={index}
                    ensureFileUrl={ensureFileUrl}
                    selectedThemeId={selectedThemeId}
                    onGenerate={() => {
                      if (original.id && selectedThemeId) {
                        generateImage({
                          id: original.id,
                          generateRequest: { theme_id: selectedThemeId },
                        });
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
