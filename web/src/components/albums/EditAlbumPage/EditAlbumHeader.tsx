import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useGetAlbumByIdQuery,
  useUpdateAlbumMutation,
  useDeleteAlbumMutation,
  useListThemesQuery,
  api,
} from "@/services/genApi";
import { useRouter } from "next/router";
import { useState, useCallback, useEffect } from "react";
import { Settings, Trash2, Share2, Eye, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can view this album",
    icon: Globe,
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Only people with the link can view",
    icon: Eye,
  },
  {
    value: "invite-only",
    label: "Invite-only",
    description: "Only you and invited collaborators can view",
    icon: Lock,
  },
];

export default function EditAlbumHeader() {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: album, refetch: refetchAlbum } = useGetAlbumByIdQuery(
    { id },
    { skip: !id }
  );
  const { data: themes } = useListThemesQuery({});

  const [patchAlbum] = useUpdateAlbumMutation();
  const [deleteAlbum] = useDeleteAlbumMutation();
  const [triggerSlugCheck] = api.useLazySlugAvailabilityQuery();

  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [albumVisibility, setAlbumVisibility] = useState("public");
  const [albumSlug, setAlbumSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugMessage, setSlugMessage] = useState<string | null>(null);

  // Initialize form values when album loads
  useEffect(() => {
    if (album) {
      setAlbumName(album.name || "");
      setAlbumVisibility(album.visibility || "public");
      setAlbumSlug(album.slug || "");
      setSlugAvailable(true);
      setSlugMessage(null);
    }
  }, [album]);

  // Set default theme
  useEffect(() => {
    if (!selectedThemeId && themes && themes.length > 0) {
      setSelectedThemeId(themes[0].id || "");
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
        setSlugMessage(
          res.available ? "Slug available" : "Slug is taken or reserved"
        );
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

  const handleSaveSettings = async () => {
    try {
      if (slugAvailable === false) {
        toast.error("Please choose a different slug");
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
      toast.success("Album settings updated");
      refetchAlbum();
    } catch {
      toast.error("Failed to update album settings");
    }
  };

  const handleDeleteAlbum = async () => {
    try {
      await deleteAlbum({ id }).unwrap();
      router.push("/app");
      toast.success("Album deleted");
    } catch {
      toast.error("Failed to delete album");
    }
  };

  const selectedVisibility = VISIBILITY_OPTIONS.find(
    (opt) => opt.value === albumVisibility
  );

  if (!album) return null;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{album.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary">/{album.slug}</Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {selectedVisibility?.icon && (
              <selectedVisibility.icon className="h-3 w-3" />
            )}
            {selectedVisibility?.label}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a
            href={`/a/${album.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
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
                  Preview: /a/{albumSlug || "<slug>"}
                </div>
                {albumSlug && (
                  <div className="text-xs">
                    {slugChecking ? (
                      <span className="text-muted-foreground">
                        Checking availability…
                      </span>
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
                <Select
                  value={albumVisibility}
                  onValueChange={setAlbumVisibility}
                >
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
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
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
              <Button
                onClick={handleSaveSettings}
                disabled={slugChecking || slugAvailable === false}
              >
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
                This action cannot be undone. This will permanently delete the
                album and all associated photos and generated images.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAlbum}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Album
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
