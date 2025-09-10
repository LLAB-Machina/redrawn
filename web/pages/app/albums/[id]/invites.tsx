import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useGetV1AlbumsByIdMembershipsQuery,
  usePostV1AlbumsByIdInvitesMutation,
  usePostV1AlbumsByIdInviteLinksMutation,
  useDeleteV1AlbumsByIdInviteLinksAndLinkIdMutation,
  useDeleteV1AlbumsByIdMembersAndUserIdMutation,
  useGetV1AlbumsByIdQuery,
} from "@/services/genApi";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "owner", label: "Owner" },
] as const;

export default function AlbumInvitesPage() {
  const router = useRouter();
  const id = (router.query.id as string) || "";

  const { data: album } = useGetV1AlbumsByIdQuery(id ? { id } : { id: '' }, { skip: !id });
  const { data: memberships, refetch, isLoading } = useGetV1AlbumsByIdMembershipsQuery(id ? { id } : { id: '' }, { skip: !id });

  const [invite] = usePostV1AlbumsByIdInvitesMutation();
  const [createLink] = usePostV1AlbumsByIdInviteLinksMutation();
  const [revokeLink] = useDeleteV1AlbumsByIdInviteLinksAndLinkIdMutation();
  const [removeMember] = useDeleteV1AlbumsByIdMembersAndUserIdMutation();

  const baseUrl = useMemo(() => (typeof window !== "undefined" ? window.location.origin : ""), []);
  const publicUrl = useMemo(() => {
    return album?.slug ? `${baseUrl}/a/${album.slug}` : `${baseUrl}/a/[album-slug]`;
  }, [album?.slug, baseUrl]);

  const [inviteRole, setInviteRole] = useState<string>("viewer");
  const [linkRole, setLinkRole] = useState<string>("viewer");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invites & Members</h1>
            <p className="text-muted-foreground">Manage access to this album</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/app/albums/${id}`}>Back to Album</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Public Album URL</CardTitle>
            <CardDescription>Share this link for public viewing.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input readOnly value={publicUrl} />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success("Copied link to clipboard");
              }}
              variant="secondary"
            >
              Copy
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invite by email</CardTitle>
              <CardDescription>Send an invitation to join this album</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="person@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={async () => {
                  const input = document.getElementById("email") as HTMLInputElement | null;
                  const email = input?.value?.trim();
                  if (!email) {
                    toast.error("Enter an email");
                    return;
                  }
                  try {
                    await invite({ id, inviteRequest: { email, role: inviteRole } }).unwrap();
                    toast.success("Invite sent");
                    input!.value = "";
                    await refetch();
                  } catch (err: unknown) {
                    const errorData = err as { data?: { detail?: string } };
                    toast.error(errorData?.data?.detail || "Failed to send invite");
                  }
                }}
              >
                Send Invite
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create share link</CardTitle>
              <CardDescription>Generates a link anyone can use after sign-in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={linkRole} onValueChange={setLinkRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await createLink({ id, createInviteLinkRequest: { role: linkRole } }).unwrap();
                    toast.success("Link created");
                    await refetch();
                  } catch (err: unknown) {
                    const errorData = err as { data?: { detail?: string } };
                    toast.error(errorData?.data?.detail || "Failed to create link");
                  }
                }}
              >
                Create Link
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active invite links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {memberships?.links?.length ? (
              memberships.links.map((l) => {
                const joinUrl = `${baseUrl}/join/${id}/${l.token}`;
                return (
                  <div key={l.id} className="flex items-center gap-2">
                    <Input readOnly value={joinUrl} />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(joinUrl);
                        toast.success("Copied link");
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (!l.id) return;
                        await revokeLink({ id, linkId: l.id }).unwrap();
                        await refetch();
                      }}
                    >
                      Revoke
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">No invite links yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {memberships?.members?.length ? (
              memberships.members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    {m.email} <span className="text-muted-foreground">— {m.role}</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!m.user_id) return;
                      await removeMember({ id, userId: m.user_id }).unwrap();
                      await refetch();
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No members yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending email invites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {memberships?.invites?.length ? (
              memberships.invites.map((i) => (
                <div key={i.id} className="text-sm">
                  {i.email} <Badge variant="secondary" className="ml-2">{i.role}</Badge>
                  <span className="ml-2 text-xs text-muted-foreground">{i.status}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No pending invites.</div>
            )}
          </CardContent>
        </Card>

        {isLoading ? <div className="text-sm text-muted-foreground">Refreshing…</div> : null}
      </div>
    </AppLayout>
  );
}


