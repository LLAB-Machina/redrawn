import { PublicLayout } from "@/components/layouts/PublicLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAcceptAlbumInviteLinkMutation,
  useMeQuery,
  usePreviewInviteLinkQuery,
} from "@/services/genApi";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function JoinAlbumInvitationPage() {
  const router = useRouter();
  const { albumId, token } = router.query as {
    albumId?: string;
    token?: string;
  };

  const [acceptInvite] = useAcceptAlbumInviteLinkMutation();
  const { data: me, isLoading: meLoading } = useMeQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );
  const [message, setMessage] = useState<string>("Accepting invite…");
  const { data: preview } = usePreviewInviteLinkQuery(
    albumId && token ? { id: albumId, token } : { id: "", token: "" },
    { skip: !albumId || !token }
  );

  useEffect(() => {
    if (!albumId || !token) return;

    // If we don't yet know auth state, wait
    if (meLoading) return;

    // If unauthenticated, show preview and a call-to-action
    if (!me || !me?.id) return;

    (async () => {
      try {
        await acceptInvite({ id: albumId, token }).unwrap();
        setMessage("Success! Redirecting…");
        router.replace(`/app/albums/${albumId}`);
      } catch (e: unknown) {
        const error = e as {
          status?: number;
          data?: { detail?: string; message?: string };
        };
        const status = error?.status;
        const detail: string = String(
          error?.data?.detail || error?.data?.message || ""
        );
        const isUnauthorized =
          status === 401 || detail.toLowerCase().includes("unauthorized");

        if (isUnauthorized) {
          const next = encodeURIComponent(`/join/${albumId}/${token}`);
          setMessage("Please sign in to accept this invite. Redirecting…");
          router.replace(`/auth/signin?next=${next}`);
          return;
        }

        setMessage("This invite link is invalid or expired.");
      }
    })();
  }, [albumId, token, acceptInvite, router, me, meLoading]);

  return (
    <PublicLayout>
      {!me || !me?.id ? (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle>You&apos;ve been invited</CardTitle>
              <CardDescription>
                {preview?.album_name ? (
                  <>to collaborate on &quot;{preview.album_name}&quot;.</>
                ) : (
                  <>to collaborate on this album.</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              {preview && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {preview.album_slug && (
                    <div>Public page: /a/{preview.album_slug}</div>
                  )}
                  {preview.role && <div>Role: {preview.role}</div>}
                  {!preview.valid && preview.reason && (
                    <div className="text-red-600">
                      This link is {preview.reason}.
                    </div>
                  )}
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => {
                  const next = encodeURIComponent(`/join/${albumId}/${token}`);
                  router.push(`/auth/signin?next=${next}`);
                }}
                disabled={preview !== undefined && preview.valid === false}
              >
                Sign in to start collaborating
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="py-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg font-medium">{message}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </PublicLayout>
  );
}
