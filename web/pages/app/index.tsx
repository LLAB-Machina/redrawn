import Link from 'next/link'
import { useState } from 'react'
import { useGetV1AlbumsQuery, usePostV1AlbumsMutation, useGetV1MeQuery } from '../../src/services/genApi'

export default function AppHome() {
  const { data: me, error: meError } = useGetV1MeQuery()
  const { data: albums, refetch } = useGetV1AlbumsQuery()
  const [createAlbumMutation, { isLoading: isCreating }] = usePostV1AlbumsMutation()
  const [error, setError] = useState<string | null>(null)

  async function createAlbum(e: any) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget as HTMLFormElement
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const slug = (form.elements.namedItem('slug') as HTMLInputElement).value
    const visibility = (form.elements.namedItem('visibility') as HTMLSelectElement).value || undefined
    try {
      await createAlbumMutation({ name, slug, visibility }).unwrap()
      form.reset()
      await refetch()
    } catch (e: any) {
      if (e && e.status === 401) {
        window.location.href = '/signup?next=/app'
        return
      }
      setError(typeof e === 'string' ? e : 'Failed to create album')
    }
  }

  const isAuthed = !(meError && (meError as any).status === 401)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Your albums</h2>
        <div className="text-sm text-neutral-700">
          {isAuthed && me ? (
            <span>Credits: <span className="font-medium">{me.credits ?? 0}</span></span>
          ) : (
            <Link className="underline decoration-neutral-300 underline-offset-4 hover:text-black" href="/signup">Sign in — 10 free credits</Link>
          )}
        </div>
      </div>

      <form onSubmit={createAlbum} className="grid max-w-md gap-2">
        <div className="text-sm font-medium">Create album</div>
        <input className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="name" placeholder="Album name" required />
        <input className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="slug" placeholder="my-summer-trip" required />
        <select className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="visibility" defaultValue="public">
          <option value="public">public</option>
          <option value="unlisted">unlisted</option>
          <option value="private">private</option>
        </select>
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</div>}
        <button className="inline-flex h-10 items-center rounded-md bg-black px-4 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 hover:bg-neutral-900 disabled:opacity-50" type="submit" disabled={isCreating}>
          {isCreating ? 'Creating…' : 'Create album'}
        </button>
      </form>

      {(!albums || albums.length === 0) ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">
          You don’t have any albums yet. Create your first album above.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {albums.map((a) => (
            <Link key={a.id} href={`/app/albums/${a.id}`} className="group">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-neutral-200 ring-1 ring-inset ring-neutral-300"></div>
              <div className="mt-2 text-sm">
                <div className="font-medium">{a.name || 'Untitled album'}</div>
                <div className="text-neutral-600">/{a.slug}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

