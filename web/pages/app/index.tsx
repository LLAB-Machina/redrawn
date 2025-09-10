import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetV1AlbumsQuery,
  usePostV1AlbumsMutation,
  usePatchV1MeMutation,
  type Album,
} from "@/services/genApi";
import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Plus, FolderOpen, Users, Image, Palette } from "lucide-react";
import { toast } from "sonner";
import { AlbumCollage } from "@/components/albums/AlbumCollage";

export default function AppDashboard() {
  const { user } = useAuth();
  const { data: albums, refetch: refetchAlbums } = useGetV1AlbumsQuery({});
  const [createAlbum] = usePostV1AlbumsMutation();
  const [updateProfile] = usePatchV1MeMutation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [albumSlug, setAlbumSlug] = useState("");
  const [profileName, setProfileName] = useState(user?.name || "");

  const albumList = (albums ?? []) as Album[];
  const needsProfile = user && (!user.name || user.name.trim() === "");

  const handleCreateAlbum = async () => {
    if (!albumName.trim() || !albumSlug.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createAlbum({
        albumCreateRequest: {
          name: albumName.trim(),
          slug: albumSlug.trim(),
          visibility: "public",
        },
      }).unwrap();

      setShowCreateDialog(false);
      setAlbumName("");
      setAlbumSlug("");
      refetchAlbums();
      toast.success("Album created successfully!");
    } catch {
      toast.error("Failed to create album");
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      await updateProfile({
        patchMeRequest: { name: profileName.trim() },
      }).unwrap();

      setShowProfileDialog(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your photo albums and AI-generated themes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Credits</div>
              <div className="text-2xl font-bold">{user?.credits || 0}</div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {user?.plan || "Free"}
            </Badge>
          </div>
        </div>

        {/* Profile completion prompt */}
        {needsProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">
                  Complete your profile
                </CardTitle>
                <CardDescription className="text-orange-700">
                  We couldn&apos;t get your name from Google. Please enter your
                  name to continue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowProfileDialog(true)}>
                  Complete Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Albums
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{albumList.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Credits Available
              </CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.credits || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.plan || "Free"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Generated Images
              </CardTitle>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        </div>

        {/* Albums Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Your Albums
            </h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Album
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Album</DialogTitle>
                  <DialogDescription>
                    Set up a new photo album with custom themes and privacy
                    settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="album-name">Album Name</Label>
                    <Input
                      id="album-name"
                      value={albumName}
                      onChange={(e) => {
                        setAlbumName(e.target.value);
                        setAlbumSlug(generateSlug(e.target.value));
                      }}
                      placeholder="My Amazing Album"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="album-slug">URL Slug</Label>
                    <Input
                      id="album-slug"
                      value={albumSlug}
                      onChange={(e) => setAlbumSlug(e.target.value)}
                      placeholder="my-amazing-album"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be used in the album URL: /a/{albumSlug}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAlbum}>Create Album</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {albumList.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No albums yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first album to start organizing and styling your
                  photos with AI.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Album
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {albumList.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={`/app/albums/${album.id}`}>
                    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                      <div className="aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                        <AlbumCollage
                          fileIds={
                            (album as { preview_file_ids?: string[] })
                              .preview_file_ids || []
                          }
                          sizes="(max-width: 1200px) 50vw, 25vw"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {album.name || "Untitled Album"}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          /{album.slug}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {album.visibility || "public"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {(album as { photo_count?: number }).photo_count ||
                              0}{" "}
                            photo
                            {((album as { photo_count?: number }).photo_count ||
                              0) === 1
                              ? ""
                              : "s"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Your Profile</DialogTitle>
              <DialogDescription>
                Please enter your name to complete your profile setup.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Your Name</Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowProfileDialog(false)}
              >
                Skip for now
              </Button>
              <Button onClick={handleUpdateProfile}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// inline AlbumCollage removed in favor of shared component
