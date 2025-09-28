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
import Link from "next/link";
import { useRouter } from "next/router";
import { useListThemesQuery } from "@/services/genApi";
import { useMemo } from "react";

export default function ThemeDetailsPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const { data: themes, isLoading, isFetching, error } = useListThemesQuery({});

  const theme = useMemo(() => {
    if (!id || !themes) return undefined;
    return themes.find((t) => t.id === id);
  }, [id, themes]);

  if (isLoading || isFetching) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Theme</h1>
              <p className="text-muted-foreground">Loading theme details…</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/app/themes">Back</Link>
            </Button>
          </div>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
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
              <h1 className="text-3xl font-bold tracking-tight">Theme</h1>
              <p className="text-muted-foreground">Unable to load theme.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/app/themes">Back</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load themes. Please try again.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!theme) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Theme not found
              </h1>
              <p className="text-muted-foreground">
                The requested theme does not exist.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/app/themes">Back</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{theme.name}</h1>
            <p className="text-muted-foreground">
              Inspect your generation theme
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/app/themes">Back</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Theme metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Theme ID
                </p>
                <Badge variant="outline" className="text-xs break-all">
                  {theme.id}
                </Badge>
              </div>
              {theme.slug ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Slug
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    /{theme.slug}
                  </Badge>
                </div>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Prompt
              </p>
              <div className="rounded-md border p-3 text-sm bg-muted/30">
                {theme.prompt || "No prompt provided"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
