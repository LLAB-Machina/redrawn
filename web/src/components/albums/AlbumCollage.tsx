import React from "react";
import Image from "next/image";
import { api } from "@/services/genApi";

type ResolveFileUrl = (id?: string | null) => Promise<string | null>;

type PropsByIds = {
  fileIds: string[];
  resolveFileUrl?: ResolveFileUrl;
  sizes?: string;
  emptyIcon?: React.ReactNode;
};

type PropsByPhotos = {
  photos: Array<{ file_id?: string | null }>;
  resolveFileUrl: ResolveFileUrl;
  sizes?: string;
  emptyIcon?: React.ReactNode;
};

export type AlbumCollageProps = PropsByIds | PropsByPhotos;

export function AlbumCollage(props: AlbumCollageProps) {
  const [triggerFileUrl] = api.useLazyGetPhotoFileUrlQuery();
  const [urls, setUrls] = React.useState<string[]>([]);

  const sizes =
    "sizes" in props && props.sizes
      ? props.sizes
      : "(max-width: 1200px) 50vw, 25vw";

  const ids = React.useMemo(() => {
    if ("fileIds" in props) {
      return (props.fileIds || []).slice(0, 4);
    }
    const fromPhotos = (props.photos || [])
      .map((p) => p.file_id)
      .filter(Boolean) as string[];
    return fromPhotos.slice(0, 4);
  }, [props]);

  React.useEffect(() => {
    let isCancelled = false;
    async function load() {
      const results: string[] = [];
      for (const id of ids) {
        try {
          let url: string | null = null;
          if ("resolveFileUrl" in props && props.resolveFileUrl) {
            url = await props.resolveFileUrl(id);
          } else {
            const data = await triggerFileUrl({ id }).unwrap();
            url = data.url || null;
          }
          if (url) results.push(url);
        } catch {
          // ignore individual failures
        }
      }
      if (!isCancelled) setUrls(results);
    }
    if (ids.length) load();
    return () => {
      isCancelled = true;
    };
  }, [ids, props, triggerFileUrl]);

  if (!ids.length || !urls.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        {"emptyIcon" in props && props.emptyIcon ? (
          props.emptyIcon
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6 text-muted-foreground"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
            <circle cx="8.5" cy="10.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>
    );
  }

  const gridClass = urls.length <= 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className={`w-full h-full grid ${gridClass} gap-[2px] bg-background`}>
      {urls.map((u, i) => (
        <div
          key={i}
          className={urls.length === 3 && i === 0 ? "row-span-2" : ""}
        >
          <div className="relative w-full h-full min-h-full">
            <Image
              src={u}
              alt="preview"
              fill
              className="object-cover"
              sizes={sizes}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
