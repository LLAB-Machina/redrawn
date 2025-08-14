import { useRouter } from "next/router";
import {
  usePostV1AlbumsByIdInvitesMutation,
  usePostV1AlbumsByIdMembersAndUserIdMutation,
  useDeleteV1AlbumsByIdMembersAndUserIdMutation,
} from "../../../../src/services/genApi";
import { Select, SelectOption } from "../../../../components/Select";

const ROLE_OPTIONS: SelectOption[] = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Can view photos and albums",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Can add photos and edit content",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Full access including deleting album",
  },
];

export default function AlbumInvites() {
  const { query } = useRouter();
  const id = query.id as string;
  const [invite] = usePostV1AlbumsByIdInvitesMutation();
  const [setRole] = usePostV1AlbumsByIdMembersAndUserIdMutation();
  const [removeMember] = useDeleteV1AlbumsByIdMembersAndUserIdMutation();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">
        Manage Invites for {id}
      </h2>
      <div className="grid max-w-md gap-6">
        <form
          className="card"
          onSubmit={async (e: any) => {
            e.preventDefault();
            const email = (
              e.currentTarget.elements.namedItem("email") as HTMLInputElement
            ).value;
            const role = (
              e.currentTarget.elements.namedItem("role") as HTMLInputElement
            ).value;
            try {
              const data = await invite({
                id,
                inviteRequest: { email, role },
              }).unwrap();
              alert(JSON.stringify(data));
            } catch (err: any) {
              alert(String(err));
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Invite Collaborator
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Send an invitation to someone to join this album
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
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
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Role
                </label>
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

        <form
          className="card grid gap-2"
          onSubmit={async (e: any) => {
            e.preventDefault();
            const userId = (
              e.currentTarget.elements.namedItem("user_id") as HTMLInputElement
            ).value;
            const role = (
              e.currentTarget.elements.namedItem("role") as HTMLInputElement
            ).value;
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
          <Select
            name="role"
            options={ROLE_OPTIONS}
            defaultValue="viewer"
            className="h-9"
          />
          <button className="btn btn-neutral h-9" type="submit">
            Set Role
          </button>
        </form>

        <form
          className="card grid gap-2"
          onSubmit={async (e: any) => {
            e.preventDefault();
            const userId = (
              e.currentTarget.elements.namedItem("user_id") as HTMLInputElement
            ).value;
            try {
              const data = await removeMember({ id, userId }).unwrap();
              alert(JSON.stringify(data));
            } catch (err: any) {
              alert(String(err));
            }
          }}
        >
          <div className="text-sm font-semibold tracking-tight">
            Remove Member
          </div>
          <input className="input h-9" name="user_id" placeholder="user id" />
          <button className="btn btn-danger h-9" type="submit">
            Remove
          </button>
        </form>
      </div>
    </div>
  );
}
