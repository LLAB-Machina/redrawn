import { useRouter } from 'next/router'
import { usePostV1AlbumsByIdInvitesMutation, usePostV1AlbumsByIdMembersAndUserIdMutation, useDeleteV1AlbumsByIdMembersAndUserIdMutation } from '../../../../src/services/genApi'

export default function AlbumInvites() {
  const { query } = useRouter()
  const id = query.id as string
  const [invite] = usePostV1AlbumsByIdInvitesMutation()
  const [setRole] = usePostV1AlbumsByIdMembersAndUserIdMutation()
  const [removeMember] = useDeleteV1AlbumsByIdMembersAndUserIdMutation()
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Manage Invites for {id}</h2>
      <div className="grid max-w-md gap-6">
        <form className="grid gap-2" onSubmit={async (e: any) => {
          e.preventDefault()
          const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
          const role = (e.currentTarget.elements.namedItem('role') as HTMLInputElement).value
          try {
            const data = await invite({ id, inviteRequest: { email, role } }).unwrap(); alert(JSON.stringify(data))
          } catch (err: any) { alert(String(err)) }
        }}>
          <div className="text-sm font-medium">Invite</div>
          <input className="h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="email" placeholder="email" />
          <input className="h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="role" placeholder="role (viewer|editor|owner)" />
          <button className="inline-flex h-9 items-center rounded-md bg-black px-4 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 hover:bg-neutral-900" type="submit">Send Invite</button>
        </form>

        <form className="grid gap-2" onSubmit={async (e: any) => {
          e.preventDefault()
          const userId = (e.currentTarget.elements.namedItem('user_id') as HTMLInputElement).value
          const role = (e.currentTarget.elements.namedItem('role') as HTMLInputElement).value
          try {
            const data = await setRole({ id, userId, roleRequest: { role } }).unwrap(); alert(JSON.stringify(data))
          } catch (err: any) { alert(String(err)) }
        }}>
          <div className="text-sm font-medium">Set Role</div>
          <input className="h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="user_id" placeholder="user id" />
          <input className="h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="role" placeholder="role" />
          <button className="inline-flex h-9 items-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50" type="submit">Set Role</button>
        </form>

        <form className="grid gap-2" onSubmit={async (e: any) => {
          e.preventDefault()
          const userId = (e.currentTarget.elements.namedItem('user_id') as HTMLInputElement).value
          try {
            const data = await removeMember({ id, userId }).unwrap(); alert(JSON.stringify(data))
          } catch (err: any) { alert(String(err)) }
        }}>
          <div className="text-sm font-medium">Remove Member</div>
          <input className="h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="user_id" placeholder="user id" />
          <button className="inline-flex h-9 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-500" type="submit">Remove</button>
        </form>
      </div>
    </div>
  )
}

