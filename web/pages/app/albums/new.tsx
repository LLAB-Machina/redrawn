import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  usePostV1AlbumsMutation,
  useLazyGetV1AlbumSlugsBySlugCheckQuery,
} from "@/services/genApi";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function NewAlbumPage() {
  const router = useRouter();
  const [createAlbum] = usePostV1AlbumsMutation();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [triggerSlugCheck, { data: slugStatus, isFetching: checkingSlug }] =
    useLazyGetV1AlbumSlugsBySlugCheckQuery();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const checkingDelayRef = useRef<NodeJS.Timeout | null>(null);
  const [showChecking, setShowChecking] = useState(false);

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const created = await createAlbum({
        albumCreateRequest: {
          name: name.trim(),
          slug: slug.trim(),
          visibility,
        },
      }).unwrap();
      toast.success("Album created");
      if (created?.id) {
        router.replace(`/app/albums/${created.id}`);
      } else {
        router.replace("/app");
      }
    } catch {
      toast.error("Failed to create album");
    }
  };

  // Debounce slug checks and delay the checking indicator by 500ms to avoid flicker
  useEffect(() => {
    if (!slug) return;
    // Debounce API call (100ms)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerSlugCheck({ slug });
    }, 250);

    // Delay showing the spinner by 500ms
    if (checkingDelayRef.current) clearTimeout(checkingDelayRef.current);
    setShowChecking(false);
    checkingDelayRef.current = setTimeout(() => setShowChecking(true), 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (checkingDelayRef.current) clearTimeout(checkingDelayRef.current);
    };
  }, [slug, triggerSlugCheck]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>New Album</CardTitle>
            <CardDescription>Create a new photo album</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug((prev) =>
                    prev ? prev : generateSlug(e.target.value)
                  );
                }}
                placeholder="My Album"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  const next = generateSlug(e.target.value);
                  setSlug(next);
                }}
                placeholder="my-album"
              />
              {slug && (
                <p className="text-xs mt-1">
                  {checkingSlug && showChecking ? (
                    <span className="text-muted-foreground">
                      Checking availability…
                    </span>
                  ) : slugStatus?.available === true ? (
                    <span className="text-green-600">Available ✓</span>
                  ) : slugStatus?.available === false ? (
                    <span className="text-destructive">Taken ✗</span>
                  ) : null}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="invite-only">Invite-only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={
                  !name.trim() ||
                  !slug.trim() ||
                  slugStatus?.available === false ||
                  checkingSlug
                }
              >
                Create Album
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
