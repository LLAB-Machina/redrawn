import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  useGetAlbumByIdQuery,
  useInitPhotoUploadMutation,
  useCreateOriginalPhotoMutation,
  useListThemesQuery,
  useGeneratePhotoMutation,
  useListOriginalPhotosQuery,
} from "@/services/genApi";
import { useRouter } from "next/router";
import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Palette, Users, UserPlus, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function EditAlbumQuickActions() {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: album } = useGetAlbumByIdQuery({ id }, { skip: !id });
  const { data: originals, refetch: refetchOriginals } =
    useListOriginalPhotosQuery({ id }, { skip: !id });
  const { data: themes } = useListThemesQuery({});

  const [initUpload] = useInitPhotoUploadMutation();
  const [createOriginal] = useCreateOriginalPhotoMutation();
  const [generateImage] = useGeneratePhotoMutation();

  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default theme
  useEffect(() => {
    if (!selectedThemeId && themes && themes.length > 0) {
      setSelectedThemeId(themes[0].id || "");
    }
  }, [themes, selectedThemeId]);

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (!files.length) return;

      setUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Initialize upload
          const initResponse = await initUpload({
            id,
            uploadInitRequest: {
              name: file.name,
              mime: file.type,
              size: file.size,
            },
          }).unwrap();

          if (!initResponse.upload_url || !initResponse.file_id) {
            throw new Error("Failed to initialize upload");
          }

          // Upload file to storage
          await fetch(initResponse.upload_url, {
            method: "PUT",
            body: file,
            headers: { "content-type": file.type },
          });

          // Create original photo record
          await createOriginal({
            id,
            createOriginalRequest: { file_id: initResponse.file_id },
          }).unwrap();

          return { success: true, fileName: file.name };
        } catch (error) {
          console.error("Upload failed for", file.name, error);
          return { success: false, fileName: file.name, error };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      if (successful > 0) {
        toast.success(
          `Successfully uploaded ${successful} file${successful > 1 ? "s" : ""}`
        );
        refetchOriginals();
      }

      if (failed > 0) {
        toast.error(`Failed to upload ${failed} file${failed > 1 ? "s" : ""}`);
      }

      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [id, initUpload, createOriginal, refetchOriginals]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleGenerateAll = async () => {
    if (!originals?.length || !selectedThemeId) return;

    setGenerating(true);
    try {
      const generatePromises = originals.map(async (original) => {
        try {
          await generateImage({
            id: original.id!,
            generateRequest: { theme_id: selectedThemeId },
          }).unwrap();
          return { success: true, id: original.id };
        } catch (err) {
          return { success: false, id: original.id, error: err };
        }
      });

      const results = await Promise.all(generatePromises);
      const successful = results.filter((r) => r.success).length;

      toast.success(
        `Started generating ${successful} image${successful > 1 ? "s" : ""}`
      );
    } catch {
      toast.error("Failed to start generation");
    } finally {
      setGenerating(false);
    }
  };

  const totalProcessing =
    originals?.reduce((sum, original) => sum + (original.processing || 0), 0) ||
    0;

  if (!album) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Photos
          </CardTitle>
          <CardDescription>
            Add images to your album. Supports JPG, PNG, and ZIP files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag and drop files here
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.zip"
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFileUpload(e.target.files)
              }
            />
          </div>
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Uploading files...
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Generate Images
          </CardTitle>
          <CardDescription>
            Apply AI themes to transform your photos with consistent styling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Theme</Label>
            <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a theme" />
              </SelectTrigger>
              <SelectContent>
                {themes?.map((theme) => (
                  <SelectItem key={theme.id} value={theme.id!}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={handleGenerateAll}
            disabled={!originals?.length || !selectedThemeId || generating}
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate All ({originals?.length || 0} photos)
              </>
            )}
          </Button>
          {totalProcessing > 0 && (
            <div className="text-sm text-blue-600 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {totalProcessing} image{totalProcessing > 1 ? "s" : ""}{" "}
              processing...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration
          </CardTitle>
          <CardDescription>
            Invite others to contribute photos and generate styles together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" asChild>
            <a href={`/app/albums/${id}/invites`}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Invites
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
