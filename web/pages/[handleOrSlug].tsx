import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api, useGetV1PublicAlbumsBySlugQuery } from "../src/services/genApi";
import Image from "next/image";

export default function PublicAlbum() {
  const { query } = useRouter();
  const key = query.handleOrSlug as string;
  const { data: album } = useGetV1PublicAlbumsBySlugQuery(
    key ? { slug: key } : (undefined as any),
    { skip: !key },
  );
  const [triggerFileUrl] = api.useLazyGetV1FilesByIdUrlQuery();
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {album?.name || key}
        </h1>
        <p className="text-neutral-600">Shareable album page.</p>
      </div>
      {album?.photos && album.photos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {album.photos.map((p) => (
            <PublicAlbumImage
              key={p.id}
              fileId={p.file_id || undefined}
              ensureUrl={ensureFileUrl}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">
          No photos yet.
        </div>
      )}
    </div>
  );
}

function PublicAlbumImage({
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
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-200 ring-1 ring-inset ring-neutral-300">
      {src ? (
        <Image
          src={src}
          alt="photo"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      ) : null}
    </div>
  );
}
