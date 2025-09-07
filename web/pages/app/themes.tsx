import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetV1ThemesQuery } from "@/services/genApi";
import { Plus, Palette, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ThemesPage() {
  const { data: themes, isLoading, error } = useGetV1ThemesQuery({});

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Themes</h1>
              <p className="text-muted-foreground">Browse and manage AI generation themes</p>
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
              <h1 className="text-3xl font-bold tracking-tight">Themes</h1>
              <p className="text-muted-foreground">Browse and manage AI generation themes</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load themes. Please try again.</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Themes</h1>
            <p className="text-muted-foreground">Browse and manage AI generation themes</p>
          </div>
          <Button asChild>
            <Link href="/app/themes/new">
              <Plus className="h-4 w-4 mr-2" />
              New Theme
            </Link>
          </Button>
        </div>

        {!themes || themes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Palette className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No themes available</h3>
                  <p className="text-muted-foreground">Create or import themes to generate styled photos</p>
                </div>
                <Button asChild>
                  <Link href="/app/themes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Theme
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <Card key={theme.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                        {theme.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {theme.prompt || "No description available"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {theme.slug && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Slug</p>
                        <Badge variant="outline" className="text-xs">
                          /{theme.slug}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        Theme
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/app/themes/${theme.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
