import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { 
  useGetV1AlbumsByIdQuery,
  usePatchV1AlbumsByIdMutation,
  useDeleteV1AlbumsByIdMutation,
  useGetV1AlbumsByIdOriginalsQuery,
  usePostV1AlbumsByIdUploadsMutation,
  usePostV1AlbumsByIdOriginalsMutation,
  useGetV1ThemesQuery,
  usePostV1OriginalsByIdGenerateMutation,
  api
} from "@/services/genApi";
import { useRouter } from "next/router";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Settings, 
  Trash2, 
  Image as ImageIcon, 
  Palette, 
  Users, 
  Share2,
  Eye,
  Globe,
  Lock,
  UserPlus,
  Zap,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view this album',
    icon: Globe
  },
  {
    value: 'unlisted',
    label: 'Unlisted',
    description: 'Only people with the link can view',
    icon: Eye
  },
  {
    value: 'invite-only',
    label: 'Invite-only',
    description: 'Only you and invited collaborators can view',
    icon: Lock
  },
];

export default function AlbumDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  
  const { data: album, refetch: refetchAlbum } = useGetV1AlbumsByIdQuery({ id }, { skip: !id });
  const { data: originals, refetch: refetchOriginals } = useGetV1AlbumsByIdOriginalsQuery({ id }, { skip: !id });
  const { data: themes } = useGetV1ThemesQuery({});
  
  const [patchAlbum] = usePatchV1AlbumsByIdMutation();
  const [deleteAlbum] = useDeleteV1AlbumsByIdMutation();
  const [initUpload] = usePostV1AlbumsByIdUploadsMutation();
  const [createOriginal] = usePostV1AlbumsByIdOriginalsMutation();
  const [generateImage] = usePostV1OriginalsByIdGenerateMutation();
  const [triggerFileUrl] = api.useLazyGetV1FilesByIdUrlQuery();
  const [triggerSlugCheck] = api.useLazyGetV1AlbumSlugsBySlugCheckQuery();
  
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumVisibility, setAlbumVisibility] = useState('public');
  const [albumSlug, setAlbumSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugMessage, setSlugMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize form values when album loads
  useEffect(() => {
    if (album) {
      setAlbumName(album.name || '');
      setAlbumVisibility(album.visibility || 'public');
      setAlbumSlug(album.slug || '');
      setSlugAvailable(true);
      setSlugMessage(null);
    }
  }, [album]);
  
  // Set default theme
  useEffect(() => {
    if (!selectedThemeId && themes && themes.length > 0) {
      setSelectedThemeId(themes[0].id || '');
    }
  }, [themes, selectedThemeId]);

  // Slug helpers and availability check
  const slugify = useCallback((value: string) => {
    const lower = value.toLowerCase();
    const replaced = lower
      .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
      .replace(/\s+/g, "-") // spaces to hyphens
      .replace(/-+/g, "-"); // collapse hyphens
    return replaced.replace(/^-+|-+$/g, ""); // trim hyphens
  }, []);

  const onSlugChange = (v: string) => {
    const s = slugify(v);
    setAlbumSlug(s);
  };

  useEffect(() => {
    let active = true;
    if (!albumSlug) {
      setSlugAvailable(null);
      setSlugMessage(null);
      return;
    }
    // If unchanged from current, consider available
    if (album && album.slug === albumSlug) {
      setSlugAvailable(true);
      setSlugMessage(null);
      return;
    }
    setSlugChecking(true);
    const t = setTimeout(async () => {
      try {
        const res = await triggerSlugCheck({ slug: albumSlug }).unwrap();
        if (!active) return;
        setSlugAvailable(!!res.available);
        setSlugMessage(res.available ? "Slug available" : "Slug is taken or reserved");
      } catch {
        if (!active) return;
        setSlugAvailable(false);
        setSlugMessage("Unable to check slug");
      } finally {
        if (active) setSlugChecking(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [albumSlug, album, triggerSlugCheck]);

  const ensureFileUrl = useCallback(async (fileId?: string | null): Promise<string | null> => {
    if (!fileId) return null;
    if (fileUrls[fileId]) return fileUrls[fileId];
    
    try {
      const data = await triggerFileUrl({ id: fileId }).unwrap();
      const url = data.url || null;
      if (url) {
        setFileUrls(prev => ({ ...prev, [fileId]: url }));
      }
      return url;
    } catch {
      return null;
    }
  }, [fileUrls, triggerFileUrl]);

  const handleFileUpload = useCallback(async (files: FileList) => {
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
          throw new Error('Failed to initialize upload');
        }

        // Upload file to storage
        await fetch(initResponse.upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'content-type': file.type },
        });

        // Create original photo record
        await createOriginal({
          id,
          createOriginalRequest: { file_id: initResponse.file_id },
        }).unwrap();

        return { success: true, fileName: file.name };
      } catch (error) {
        console.error('Upload failed for', file.name, error);
        return { success: false, fileName: file.name, error };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (successful > 0) {
      toast.success(`Successfully uploaded ${successful} file${successful > 1 ? 's' : ''}`);
      refetchOriginals();
    }
    
    if (failed > 0) {
      toast.error(`Failed to upload ${failed} file${failed > 1 ? 's' : ''}`);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [id, initUpload, createOriginal, refetchOriginals]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

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
      const successful = results.filter(r => r.success).length;
      
      toast.success(`Started generating ${successful} image${successful > 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to start generation');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (slugAvailable === false) {
        toast.error('Please choose a different slug');
        return;
      }
      await patchAlbum({
        id,
        albumUpdateRequest: {
          name: albumName || null,
          slug: albumSlug || null,
          visibility: albumVisibility || null,
        },
      }).unwrap();
      
      setShowSettings(false);
      toast.success('Album settings updated');
      refetchAlbum();
    } catch {
      toast.error('Failed to update album settings');
    }
  };

  const handleDeleteAlbum = async () => {
    try {
      await deleteAlbum({ id }).unwrap();
      router.push('/app');
      toast.success('Album deleted');
    } catch {
      toast.error('Failed to delete album');
    }
  };

  const totalProcessing = originals?.reduce((sum, original) => sum + (original.processing || 0), 0) || 0;
  const selectedVisibility = VISIBILITY_OPTIONS.find(opt => opt.value === albumVisibility);

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{album.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">/{album.slug}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {selectedVisibility?.icon && <selectedVisibility.icon className="h-3 w-3" />}
                {selectedVisibility?.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/a/${album.slug}`} target="_blank" rel="noopener noreferrer">
                <Share2 className="h-4 w-4 mr-2" />
                View Public
              </a>
            </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Album Settings</DialogTitle>
                  <DialogDescription>
                    Update your album name, public slug, and privacy settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="album-name">Album Name</Label>
                    <Input
                      id="album-name"
                      value={albumName}
                      onChange={(e) => setAlbumName(e.target.value)}
                      placeholder="Album name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="album-slug">Public Slug</Label>
                    <Input
                      id="album-slug"
                      value={albumSlug}
                      onChange={(e) => onSlugChange(e.target.value)}
                      placeholder="my-album"
                    />
                    <div className="text-xs text-muted-foreground">
                      Preview: /a/{albumSlug || '<slug>'}
                    </div>
                    {albumSlug && (
                      <div className="text-xs">
                        {slugChecking ? (
                          <span className="text-muted-foreground">Checking availability…</span>
                        ) : slugAvailable ? (
                          <span className="text-green-600">{slugMessage}</span>
                        ) : (
                          <span className="text-red-600">{slugMessage}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="album-visibility">Privacy</Label>
                    <Select value={albumVisibility} onValueChange={setAlbumVisibility}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={slugChecking || slugAvailable === false}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Album</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the album
                    and all associated photos and generated images.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAlbum} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Album
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Quick Actions */}
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
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
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
                  {totalProcessing} image{totalProcessing > 1 ? 's' : ''} processing...
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

        {/* Photos Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Photos</h2>
            <div className="text-sm text-muted-foreground">
              {originals?.length || 0} original{originals?.length !== 1 ? 's' : ''}
            </div>
          </div>

          {!originals?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload your first photos to get started with AI-powered styling.
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

function PhotoCard({ original, index, ensureFileUrl, selectedThemeId, onGenerate }: PhotoCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Array<{ file_id?: string | null; url?: string | null; state?: string; }>>([]);
  const [showGenerated, setShowGenerated] = useState(false);
  const [triggerGenerated] = api.useLazyGetV1OriginalsByIdGeneratedQuery();

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
      console.error('Failed to load generated images:', error);
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
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={!selectedThemeId}
            >
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
            {showGenerated ? 'Hide' : 'Show'} Generated
          </Button>
          
          {showGenerated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-2"
            >
              {generatedImages.map((img, i) => (
                <div key={i} className="aspect-square bg-muted rounded overflow-hidden">
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


