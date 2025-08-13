import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { api, useGetV1AlbumsByIdQuery, usePatchV1AlbumsByIdMutation, useDeleteV1AlbumsByIdMutation, usePostV1AlbumsByIdUploadsMutation, usePostV1AlbumsByIdOriginalsMutation, useGetV1AlbumsByIdOriginalsQuery, useGetV1ThemesQuery, usePostV1OriginalsByIdGenerateMutation } from '../../../src/services/genApi'

export default function AlbumDetail() {
  const { query } = useRouter()
  const id = query.id as string

  const { data: album } = useGetV1AlbumsByIdQuery({ id }, { skip: !id })
  const { data: originals, refetch: refetchOriginals } = useGetV1AlbumsByIdOriginalsQuery({ id }, { skip: !id })
  const { data: themes } = useGetV1ThemesQuery(undefined as any)
  const [patchAlbumMutation] = usePatchV1AlbumsByIdMutation()
  const [deleteAlbumMutation] = useDeleteV1AlbumsByIdMutation()
  const [initUploadMutation] = usePostV1AlbumsByIdUploadsMutation()
  const [createOriginalMutation] = usePostV1AlbumsByIdOriginalsMutation()
  const [generateMutation] = usePostV1OriginalsByIdGenerateMutation()
  const [triggerFileUrl] = api.useLazyGetV1FilesByIdUrlQuery()
  const [triggerGenerated] = api.useLazyGetV1OriginalsByIdGeneratedQuery()

  const [selectedThemeId, setSelectedThemeId] = useState<string | undefined>(undefined)
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const [loadingAll, setLoadingAll] = useState<boolean>(false)

  useEffect(() => {
    if (!selectedThemeId && themes && themes.length > 0) setSelectedThemeId(themes[0].id)
  }, [themes, selectedThemeId])

  async function onPatchAlbum(e: any) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const name = (form.elements.namedItem('name') as HTMLInputElement).value || undefined
    const visibility = (form.elements.namedItem('visibility') as HTMLInputElement).value || undefined
    try {
      await patchAlbumMutation({ id, albumUpdateRequest: { name: name ?? null, visibility: visibility ?? null } }).unwrap()
    } catch (e) {}
  }

  async function onDeleteAlbum() {
    try {
      await deleteAlbumMutation({ id }).unwrap()
      window.location.href = '/app'
    } catch (e) {}
  }

  async function ensureFileUrl(fileId?: string | null): Promise<string | null> {
    if (!fileId) return null
    if (fileUrls[fileId]) return fileUrls[fileId]
    try {
      const data = await triggerFileUrl({ id: fileId }).unwrap()
      const url = data.url || null
      if (url) setFileUrls((m) => ({ ...m, [fileId]: url }))
      return url
    } catch {
      return null
    }
  }

  async function onFilesSelected(e: any) {
    const files: FileList | null = e.currentTarget.files
    if (!files || files.length === 0) return
    setLoadingAll(true)
    try {
      for (const file of Array.from(files)) {
        const init = await initUploadMutation({ id, uploadInitRequest: { name: file.name, mime: file.type, size: file.size } }).unwrap()
        if (!init.upload_url || !init.file_id) continue
        await fetch(init.upload_url, { method: 'PUT', body: file, headers: { 'content-type': file.type } })
        await createOriginalMutation({ id, createOriginalRequest: { file_id: init.file_id } }).unwrap()
      }
      await refetchOriginals()
    } finally {
      setLoadingAll(false)
      e.currentTarget.value = ''
    }
  }

  async function generateForOriginal(originalId?: string) {
    if (!originalId || !selectedThemeId) return
    await generateMutation({ id: originalId, generateRequest: { theme_id: selectedThemeId } }).unwrap()
  }

  async function generateForAll() {
    if (!originals || !selectedThemeId) return
    setLoadingAll(true)
    try {
      for (const o of originals) {
        await generateForOriginal(o.id)
      }
    } finally {
      setLoadingAll(false)
    }
  }

  const themeOptions = useMemo(() => themes || [], [themes])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">{album?.name || 'Album'} <span className="text-neutral-500">({id})</span></h2>
        <button className="inline-flex h-9 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-500" onClick={onDeleteAlbum}>Delete album</button>
      </div>

      <form onSubmit={onPatchAlbum} className="grid max-w-md gap-2">
        <div className="text-sm font-medium">Album settings</div>
        <input className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="name" placeholder="Rename (optional)" defaultValue={album?.name || ''} />
        <input className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" name="visibility" placeholder="visibility (public|unlisted|private)" defaultValue={album?.visibility || ''} />
        <button className="inline-flex h-10 items-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50" type="submit">Save</button>
      </form>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold">Upload photos</div>
          <div className="mt-2 text-sm text-neutral-600">Upload one or many images, or a .zip file.</div>
          <input className="mt-3 block text-sm" type="file" multiple accept="image/*,.zip" onChange={onFilesSelected} />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold">Select theme</div>
          <select className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10" value={selectedThemeId || ''} onChange={(e) => setSelectedThemeId(e.target.value)}>
            {themeOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button className="mt-3 inline-flex h-9 items-center rounded-md bg-black px-4 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 hover:bg-neutral-900 disabled:opacity-50" disabled={!originals || originals.length === 0 || !selectedThemeId || loadingAll} onClick={generateForAll}>Generate all (1 credit each)</button>
          <div className="mt-2 text-xs text-neutral-500">Tip: Invite collaborators to add photos and generate styles together.</div>
          <a className="mt-1 inline-block text-xs underline decoration-neutral-300 underline-offset-4 hover:text-black" href={`/app/albums/${id}/invites`}>Manage invites →</a>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold">Photos</div>
        {(originals && originals.length > 0) ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {originals.map((o) => (
            <div key={o.id} className="group rounded-lg border border-neutral-200 bg-white p-2">
              <div className="aspect-[4/3] overflow-hidden rounded-md bg-neutral-100">
                <AlbumImage fileId={o.file_id || undefined} ensureUrl={ensureFileUrl} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <button className="inline-flex h-8 items-center rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 disabled:opacity-50" disabled={!selectedThemeId} onClick={() => generateForOriginal(o.id)}>Generate</button>
                <LoadGenerated originalId={o.id!} ensureUrl={ensureFileUrl} />
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">No photos yet. Upload images to get started.</div>
        )}
      </div>
    </div>
  )
}

function AlbumImage({ fileId, ensureUrl }: { fileId?: string; ensureUrl: (id?: string | null) => Promise<string | null> }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => { ensureUrl(fileId).then(setSrc) }, [fileId])
  if (!fileId) return <div className="h-full w-full bg-neutral-200" />
  return src ? <img src={src} alt="photo" className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-neutral-200" />
}

function LoadGenerated({ originalId, ensureUrl }: { originalId: string; ensureUrl: (id?: string | null) => Promise<string | null> }) {
  const [triggerGenerated] = api.useLazyGetV1OriginalsByIdGeneratedQuery()
  const [images, setImages] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [filterThemeId, setFilterThemeId] = useState<string | 'all'>('all')

  async function load() {
    const data = await triggerGenerated({ id: originalId }).unwrap()
    const urls: string[] = []
    for (const g of data) {
      if (filterThemeId !== 'all' && g.theme_id !== filterThemeId) continue
      const url = await ensureUrl(g.file_id || undefined)
      if (url) urls.push(url)
    }
    setImages(urls)
  }

  return (
    <div className="text-xs">
      <div className="mb-1 flex items-center gap-2">
        <button className="underline decoration-neutral-300 underline-offset-4 hover:text-black" onClick={async () => { setOpen(!open); if (!open) await load() }}>
        {open ? 'Hide generated' : 'Show generated'}
        </button>
        {open && (
          <select className="h-7 rounded-md border border-neutral-300 px-2 text-xs outline-none focus:ring-2 focus:ring-black/10" value={filterThemeId} onChange={async (e) => { setFilterThemeId(e.target.value as any); await load() }}>
            <option value="all">all themes</option>
            {/* We could list album themes here; for now this is a per-image filter using returned theme_id */}
            <option value="">current album theme</option>
          </select>
        )}
      </div>
      {open && images.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-1">
          {images.map((src, i) => (
            <img key={i} src={src} alt="generated" className="aspect-square rounded object-cover" />
          ))}
        </div>
      )}
    </div>
  )
}

