import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetV1AlbumsQuery } from "@/services/genApi";
import React from "react";
import { Plus, Users, Eye, Lock } from "lucide-react";
import Link from "next/link";
import { AlbumCollage } from "@/components/albums/AlbumCollage";
// import { formatDistanceToNow } from "date-fns";

export default function AlbumsPage() {
  const { data: albums, isLoading, error } = useGetV1AlbumsQuery({});

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Albums</h1>
              <p className="text-muted-foreground">Manage your photo albums</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Albums</h1>
              <p className="text-muted-foreground">Manage your photo albums</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load albums. Please try again.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Albums</h1>
            <p className="text-muted-foreground">Manage your photo albums</p>
          </div>
          <Button asChild>
            <Link href="/app/albums/new">
              <Plus className="h-4 w-4 mr-2" />
              New Album
            </Link>
          </Button>
        </div>

        {!albums || albums.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No albums yet</h3>
                  <p className="text-muted-foreground">Create your first album to get started</p>
                </div>
                <Button asChild>
                  <Link href="/app/albums/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Album
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <Card key={album.id} className="hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                  <AlbumCollage fileIds={(album as { preview_file_ids?: string[] }).preview_file_ids || []} sizes="(max-width: 1200px) 50vw, 25vw" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">
                        <Link 
                          href={`/app/albums/${album.id}`}
                          className="hover:underline"
                        >
                          {album.name}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        Album ID: {album.id}
                      </CardDescription>
                    </div>
                    <Badge variant={album.visibility === 'public' ? 'default' : 'secondary'}>
                      {album.visibility === 'public' ? (
                        <><Eye className="h-3 w-3 mr-1" /> Public</>
                      ) : (
                        <><Lock className="h-3 w-3 mr-1" /> Private</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {(album as { photo_count?: number }).photo_count || 0} photo{(((album as { photo_count?: number }).photo_count || 0) === 1) ? '' : 's'}
                    </div>
                    <div>
                      {album.visibility || 'private'}
                    </div>
                  </div>
                  {album.slug && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        /{album.slug}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// inline AlbumCollageSmall removed in favor of shared component
