import { useRouter } from 'next/router';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  api,
  useGetV1AlbumsByIdQuery,
  usePatchV1AlbumsByIdMutation,
  useDeleteV1AlbumsByIdMutation,
  usePostV1AlbumsByIdUploadsMutation,
  usePostV1AlbumsByIdOriginalsMutation,
  useGetV1AlbumsByIdOriginalsQuery,
  useGetV1ThemesQuery,
  usePostV1OriginalsByIdGenerateMutation,
} from '../../../src/services/genApi';
import { Select, SelectOption } from '../../../components/Select';
import { toast } from 'sonner';

const VISIBILITY_OPTIONS: SelectOption[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view this album',
  },
  {
    value: 'unlisted',
    label: 'Unlisted',
    description: 'Only people with the link can view',
  },
  {
    value: 'invite-only',
    label: 'Invite-only',
    description: 'Only you and invited collaborators can view',
  },
];

export default function AlbumDetail() {
  const { query } = useRouter();
  const id = query.id as string;

  const { data: album } = useGetV1AlbumsByIdQuery({ id }, { skip: !id });
  const { data: originals, refetch: refetchOriginals } = useGetV1AlbumsByIdOriginalsQuery(
    { id },
    { skip: !id },
  );
  const { data: themes } = useGetV1ThemesQuery(undefined as any);
  const [patchAlbumMutation] = usePatchV1AlbumsByIdMutation();
  const [deleteAlbumMutation] = useDeleteV1AlbumsByIdMutation();
  const [initUploadMutation] = usePostV1AlbumsByIdUploadsMutation();
  const [createOriginalMutation] = usePostV1AlbumsByIdOriginalsMutation();
  const [generateMutation] = usePostV1OriginalsByIdGenerateMutation();
  const [triggerFileUrl] = api.useLazyGetV1FilesByIdUrlQuery();
  const [triggerGenerated] = api.useLazyGetV1OriginalsByIdGeneratedQuery();
  const [triggerTask] = api.useLazyGetV1TasksByIdQuery();

  const [selectedThemeId, setSelectedThemeId] = useState<string | undefined>(undefined);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [loadingAll, setLoadingAll] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Check for theme parameter in URL
    const themeParam = query.theme as string;
    if (themeParam && themes) {
      const themeExists = themes.find((t) => t.id === themeParam);
      if (themeExists) {
        setSelectedThemeId(themeParam);
        return;
      }
    }

    if (!selectedThemeId && themes && themes.length > 0) setSelectedThemeId(themes[0].id);
  }, [themes, selectedThemeId, query.theme]);

  async function onPatchAlbum(e: any) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value || undefined;
    const visibility =
      (form.elements.namedItem('visibility') as HTMLInputElement).value || undefined;
    try {
      await patchAlbumMutation({
        id,
        albumUpdateRequest: {
          name: name ?? null,
          visibility: visibility ?? null,
        },
      }).unwrap();
    } catch (e) {}
  }

  async function onDeleteAlbum() {
    try {
      await deleteAlbumMutation({ id }).unwrap();
      window.location.href = '/app';
    } catch (e) {}
  }

  async function ensureFileUrl(fileId?: string | null): Promise<string | null> {
    if (!fileId) return null;
    if (fileUrls[fileId]) return fileUrls[fileId];
    try {
      const data = await triggerFileUrl({ id: fileId }).unwrap();
      const url = data.url || null;
      if (url) setFileUrls((m) => ({ ...m, [fileId]: url }));
      return url;
    } catch {
      return null;
    }
  }

  async function onFilesSelected(e: any) {
    const input = e.currentTarget as HTMLInputElement | null;
    const selectedFiles = input?.files ? Array.from(input.files) : [];
    if (selectedFiles.length === 0) return;
    setLoadingAll(true);
    try {
      for (const file of selectedFiles) {
        try {
          const init = await initUploadMutation({
            id,
            uploadInitRequest: {
              name: file.name,
              mime: file.type,
              size: file.size,
            },
          }).unwrap();
          if (!init.upload_url || !init.file_id) continue;
          await fetch(init.upload_url, {
            method: 'PUT',
            body: file,
            headers: { 'content-type': file.type },
          });
          await createOriginalMutation({
            id,
            createOriginalRequest: { file_id: init.file_id },
          }).unwrap();
        } catch (err) {
          console.error('Upload failed', err);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      await refetchOriginals();
    } finally {
      setLoadingAll(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function generateForOriginal(originalId?: string) {
    if (!originalId || !selectedThemeId) return;
    const resp = await generateMutation({
      id: originalId,
      generateRequest: { theme_id: selectedThemeId },
    }).unwrap();
    // Optional: poll task status for quick UI feedback
    if (resp.task_id) {
      let attempts = 0;
      const max = 10;
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
      while (attempts < max) {
        try {
          const ts = await triggerTask({ id: resp.task_id }).unwrap();
          if (ts.status === 'succeeded' || ts.status === 'failed') break;
        } catch {}
        attempts++;
        await delay(500);
      }
    }
  }

  async function generateForAll() {
    if (!originals || !selectedThemeId) return;
    setLoadingAll(true);
    try {
      for (const o of originals) {
        await generateForOriginal(o.id);
      }
    } finally {
      setLoadingAll(false);
    }
  }

  const themeOptions = useMemo(() => themes || [], [themes]);

  const totalProcessing = useMemo(
    () => (originals || []).reduce((n, o: any) => n + (o.processing || 0), 0),
    [originals],
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          {album?.name || 'Album'} <span className="text-neutral-500">({id})</span>
        </h2>
        <button
          className="inline-flex h-9 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-500"
          onClick={onDeleteAlbum}
        >
          Delete album
        </button>
      </div>

      <form onSubmit={onPatchAlbum} className="card max-w-md">
        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold tracking-tight">Album settings</div>
            <p className="mt-1 text-xs text-neutral-600">
              Update your album name and privacy settings
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Album Name</label>
              <input
                className="input w-full"
                name="name"
                placeholder="Rename (optional)"
                defaultValue={album?.name || ''}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Privacy</label>
              <Select
                name="visibility"
                options={VISIBILITY_OPTIONS}
                defaultValue={album?.visibility || 'public'}
                className="input w-full"
              />
            </div>
          </div>

          <button className="btn btn-neutral h-10 w-full" type="submit">
            Save Changes
          </button>
        </div>
      </form>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card">
          <div className="text-sm font-semibold">Upload photos</div>
          <div className="mt-2 text-sm text-neutral-600">
            Upload one or many images, or a .zip file.
          </div>
          <input
            className="mt-3 block text-sm"
            type="file"
            multiple
            accept="image/*,.zip"
            ref={fileInputRef}
            onChange={onFilesSelected}
          />
        </div>
        <div className="card">
          <div className="text-sm font-semibold">Select theme</div>
          <select
            className="select mt-2 w-full"
            value={selectedThemeId || ''}
            onChange={(e) => setSelectedThemeId(e.target.value)}
          >
            {themeOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary mt-3 h-9 disabled:opacity-50"
            disabled={!originals || originals.length === 0 || !selectedThemeId || loadingAll}
            onClick={generateForAll}
          >
            Generate all (1 credit each)
          </button>
          <div className="mt-2 text-xs text-neutral-500">
            Tip: Invite collaborators to add photos and generate styles together.
          </div>
          {totalProcessing > 0 && (
            <div className="mt-2 text-xs text-blue-700">
              {totalProcessing} image{totalProcessing === 1 ? '' : 's'} processing…
            </div>
          )}
          <a
            className="mt-1 inline-block text-xs underline decoration-neutral-300 underline-offset-4 hover:text-black"
            href={`/app/albums/${id}/invites`}
          >
            Manage invites →
          </a>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold">Photos</div>
        {originals && originals.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {originals.map((o: any) => (
              <div key={o.id} className="group rounded-lg border border-neutral-200 bg-white p-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-neutral-100">
                  <AlbumImage fileId={o.file_id || undefined} ensureUrl={ensureFileUrl} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <button
                    className="btn btn-neutral h-8 px-3 text-xs disabled:opacity-50"
                    disabled={!selectedThemeId}
                    onClick={() => generateForOriginal(o.id)}
                  >
                    Generate
                  </button>
                  <div className="flex items-center gap-2">
                    {o.processing > 0 && (
                      <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-blue-800 uppercase">
                        processing ×{o.processing}
                      </span>
                    )}
                    <LoadGenerated originalId={o.id!} ensureUrl={ensureFileUrl} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">
            No photos yet. Upload images to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function AlbumImage({
  fileId,
  ensureUrl,
}: {
  fileId?: string;
  ensureUrl: (id?: string | null) => Promise<string | null>;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    ensureUrl(fileId).then(setSrc);
  }, [fileId, ensureUrl]);
  if (!fileId) return <div className="h-full w-full bg-neutral-200" />;
  return src ? (
    <Image
      src={src}
      alt="photo"
      fill
      sizes="(max-width: 768px) 100vw, 33vw"
      className="object-cover"
    />
  ) : (
    <div className="h-full w-full animate-pulse bg-neutral-200" />
  );
}

function LoadGenerated({
  originalId,
  ensureUrl,
}: {
  originalId: string;
  ensureUrl: (id?: string | null) => Promise<string | null>;
}) {
  const [triggerGenerated] = api.useLazyGetV1OriginalsByIdGeneratedQuery();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [filterThemeId, setFilterThemeId] = useState<string | 'all'>('all');

  async function load() {
    const data = await triggerGenerated({ id: originalId }).unwrap();
    const out: any[] = [];
    for (const g of data) {
      if (filterThemeId !== 'all' && g.theme_id !== filterThemeId) continue;
      const url = await ensureUrl(g.file_id || undefined);
      out.push({ id: g.id, state: g.state, url, error: g.error || null });
    }
    setItems(out);
  }

  return (
    <div className="text-xs">
      <div className="mb-1 flex items-center gap-2">
        <button
          className="underline decoration-neutral-300 underline-offset-4 hover:text-black"
          onClick={async () => {
            setOpen(!open);
            if (!open) await load();
          }}
        >
          {open ? 'Hide generated' : 'Show generated'}
        </button>
        {open && (
          <select
            className="h-7 rounded-md border border-neutral-300 px-2 text-xs outline-none focus:ring-2 focus:ring-black/10"
            value={filterThemeId}
            onChange={async (e) => {
              setFilterThemeId(e.target.value as any);
              await load();
            }}
          >
            <option value="all">all themes</option>
            {/* We could list album themes here; for now this is a per-image filter using returned theme_id */}
            <option value="">current album theme</option>
          </select>
        )}
      </div>
      {open && items.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-1">
          {items.map((it, i) => (
            <div key={i} className="relative aspect-square">
              {it.url ? (
                <Image
                  src={it.url}
                  alt="generated"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="rounded object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded bg-neutral-100 text-[10px] tracking-wide text-neutral-500 uppercase">
                  {it.state}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
