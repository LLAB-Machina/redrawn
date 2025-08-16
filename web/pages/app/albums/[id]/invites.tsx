import { useRouter } from 'next/router';
import {
  usePostV1AlbumsByIdInvitesMutation,
  usePostV1AlbumsByIdMembersAndUserIdMutation,
  useDeleteV1AlbumsByIdMembersAndUserIdMutation,
  useGetV1AlbumsByIdMembershipsQuery,
  usePostV1AlbumsByIdInviteLinksMutation,
  useDeleteV1AlbumsByIdInviteLinksAndLinkIdMutation,
  useGetV1AlbumsByIdQuery,
} from '../../../../src/services/genApi';
import { Select, SelectOption } from '../../../../components/Select';
import Link from 'next/link';

const ROLE_OPTIONS: SelectOption[] = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Can view photos and albums',
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Can add photos and edit content',
  },
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full access including deleting album',
  },
];

export default function AlbumInvites() {
  const { query } = useRouter();
  const id = query.id as string;
  const [invite] = usePostV1AlbumsByIdInvitesMutation();
  const [setRole] = usePostV1AlbumsByIdMembersAndUserIdMutation();
  const [removeMember] = useDeleteV1AlbumsByIdMembersAndUserIdMutation();
  const { data: memberships, refetch } = useGetV1AlbumsByIdMembershipsQuery(
    id ? { id } : (undefined as any),
    { skip: !id },
  );
  const [createLink] = usePostV1AlbumsByIdInviteLinksMutation();
  const [revokeLink] = useDeleteV1AlbumsByIdInviteLinksAndLinkIdMutation();
  const { data: album } = useGetV1AlbumsByIdQuery(id ? { id } : (undefined as any), { skip: !id });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = album?.slug ? `${baseUrl}/a/${album.slug}` : `${baseUrl}/a/[album-slug]`;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Invites & Members</h2>

      {/* Public album URL (slug) */}
      <div className="card">
        <div className="text-sm font-semibold tracking-tight">Public Album URL</div>
        <p className="mt-1 text-xs text-neutral-600">Share this link for public viewing.</p>
        <div className="mt-2 flex items-center gap-2">
          <input className="input h-9 flex-1" readOnly value={publicUrl} />
          <button
            className="btn btn-neutral h-9"
            onClick={() => navigator.clipboard.writeText(publicUrl)}
            type="button"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invite by email */}
        <form
          className="card"
          onSubmit={async (e: any) => {
            e.preventDefault();
            const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
            const role = (e.currentTarget.elements.namedItem('role') as HTMLInputElement).value;
            try {
              await invite({ id, inviteRequest: { email, role } }).unwrap();
              await refetch();
              e.currentTarget.reset();
              alert('Invite sent');
            } catch (err: any) {
              alert(String(err));
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold tracking-tight">Invite by Email</div>
              <p className="mt-1 text-xs text-neutral-600">Send an invitation to join this album</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Email Address
                </label>
                <input
                  className="input h-9 w-full"
                  name="email"
                  placeholder="person@example.com"
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">Role</label>
                <Select
                  name="role"
                  options={ROLE_OPTIONS}
                  defaultValue="viewer"
                  className="h-9 w-full"
                />
              </div>
            </div>
            <button className="btn btn-primary h-9 w-full" type="submit">
              Send Invite
            </button>
          </div>
        </form>

        {/* Create invite link */}
        <form
          className="card"
          onSubmit={async (e: any) => {
            e.preventDefault();
            const role = (e.currentTarget.elements.namedItem('role') as HTMLInputElement).value;
            try {
              await createLink({
                id,
                createInviteLinkRequest: { role },
              }).unwrap();
              await refetch();
            } catch (err: any) {
              alert(String(err));
            }
          }}
        >
          <div className="space-y-4">
            <div className="text-sm font-semibold tracking-tight">Create Share Link</div>
            <p className="mt-1 text-xs text-neutral-600">
              Generates a link that grants a role to anyone who signs in
            </p>
            <Select
              name="role"
              options={ROLE_OPTIONS}
              defaultValue="viewer"
              className="h-9 w-full"
            />
            <button className="btn btn-neutral h-9 w-full" type="submit">
              Create Link
            </button>
          </div>
        </form>
      </div>

      {/* Active invite links */}
      <div className="card">
        <div className="text-sm font-semibold tracking-tight">Active Invite Links</div>
        <div className="mt-3 space-y-2">
          {memberships?.links?.length ? (
            memberships.links.map((l) => {
              const joinUrl = `${baseUrl}/join/${id}/${l.token}`;
              return (
                <div key={l.id} className="flex items-center gap-2">
                  <input className="input h-9 flex-1" readOnly value={joinUrl} />
                  <button
                    className="btn btn-neutral h-9"
                    onClick={() => navigator.clipboard.writeText(joinUrl)}
                    type="button"
                  >
                    Copy
                  </button>
                  <button
                    className="btn btn-danger h-9"
                    type="button"
                    onClick={async () => {
                      if (!l.id) return;
                      await revokeLink({ id, linkId: l.id }).unwrap();
                      await refetch();
                    }}
                  >
                    Revoke
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-neutral-600">No invite links yet.</div>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="card">
        <div className="text-sm font-semibold tracking-tight">Members</div>
        <div className="mt-2 space-y-2">
          {memberships?.members?.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between gap-3">
              <div className="text-sm">
                {m.email} — <span className="text-neutral-600">{m.role}</span>
              </div>
              <button
                className="btn btn-danger h-8"
                onClick={async () => {
                  if (!m.user_id) return;
                  await removeMember({ id, userId: m.user_id }).unwrap();
                  await refetch();
                }}
              >
                Remove
              </button>
            </div>
          )) || <div className="text-sm text-neutral-600">No members yet.</div>}
        </div>
      </div>

      {/* Pending email invites */}
      <div className="card">
        <div className="text-sm font-semibold tracking-tight">Pending Email Invites</div>
        <div className="mt-2 space-y-2">
          {memberships?.invites?.length ? (
            memberships.invites.map((i) => (
              <div key={i.id} className="text-sm">
                {i.email} — <span className="text-neutral-600">{i.role}</span>{' '}
                <span className="ml-1 text-xs">({i.status})</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-600">No pending invites.</div>
          )}
        </div>
      </div>

      {/* Manual role set/remove (keep for now) */}
      <div className="grid max-w-md gap-6">
        <form
          className="card grid gap-2"
          onSubmit={async (e: any) => {
            e.preventDefault();
            const userId = (e.currentTarget.elements.namedItem('user_id') as HTMLInputElement)
              .value;
            const role = (e.currentTarget.elements.namedItem('role') as HTMLInputElement).value;
            try {
              const data = await setRole({
                id,
                userId,
                roleRequest: { role },
              }).unwrap();
              alert(JSON.stringify(data));
            } catch (err: any) {
              alert(String(err));
            }
          }}
        >
          <div className="text-sm font-semibold tracking-tight">Set Role</div>
          <input className="input h-9" name="user_id" placeholder="user id" />
          <Select name="role" options={ROLE_OPTIONS} defaultValue="viewer" className="h-9" />
          <button className="btn btn-neutral h-9" type="submit">
            Set Role
          </button>
        </form>

        <form
          className="card grid gap-2"
          onSubmit={async (e: any) => {
            e.preventDefault();
            const userId = (e.currentTarget.elements.namedItem('user_id') as HTMLInputElement)
              .value;
            try {
              const data = await removeMember({ id, userId }).unwrap();
              alert(JSON.stringify(data));
            } catch (err: any) {
              alert(String(err));
            }
          }}
        >
          <div className="text-sm font-semibold tracking-tight">Remove Member</div>
          <input className="input h-9" name="user_id" placeholder="user id" />
          <button className="btn btn-danger h-9" type="submit">
            Remove
          </button>
        </form>
      </div>
    </div>
  );
}
