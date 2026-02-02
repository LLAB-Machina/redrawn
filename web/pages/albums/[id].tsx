import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../src/components/Layout'
import { 
  useGetAlbumQuery, 
  useListAlbumPhotosQuery,
  useDeleteAlbumMutation,
  useConfirmAlbumMutation,
} from '../../src/services/api'

export default function AlbumDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const albumId = typeof id === 'string' ? id : ''
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const { data: albumData, isLoading: albumLoading, error: albumError } = useGetAlbumQuery(albumId, { skip: !albumId })
  const { data: photosData, isLoading: photosLoading } = useListAlbumPhotosQuery(albumId, { skip: !albumId })
  
  const [deleteAlbum, { isLoading: isDeleting }] = useDeleteAlbumMutation()
  const [confirmAlbum, { isLoading: isConfirming }] = useConfirmAlbumMutation()

  const album = albumData?.album
  const photos = photosData?.photos ?? []
  const isLoading = albumLoading || photosLoading

  const handleDelete = async () => {
    try {
      await deleteAlbum(albumId).unwrap()
      router.push('/albums')
    } catch (err) {
      console.error('Failed to delete album:', err)
    }
  }

  const handleConfirm = async () => {
    try {
      await confirmAlbum(albumId).unwrap()
    } catch (err) {
      console.error('Failed to confirm album:', err)
    }
  }

  if (!albumId || isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (albumError || !album) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Album not found or you don&apos;t have access.
          </div>
          <Link href="/albums" className="inline-flex items-center gap-2 mt-4 text-slate-600 hover:text-slate-900">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to albums
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`${album.name} - Redrawn`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          <Link href="/albums" className="hover:text-slate-900">Albums</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 truncate max-w-xs">{album.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                {album.name}
              </h1>
              {album.is_public && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Public
                </span>
              )}
              {album.status === 'staged' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Draft
                </span>
              )}
            </div>
            {album.description && (
              <p className="text-slate-600">{album.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span>{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>Created {new Date(album.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {album.status === 'staged' && (
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isConfirming ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Publish
              </button>
            )}
            
            <Link
              href={`/albums/${albumId}/upload`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Photos
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete album"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Photos grid */}
        {photos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No photos yet</h3>
            <p className="text-slate-600 mb-4">Add photos to start building your album.</p>
            <Link
              href={`/albums/${albumId}/upload`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Upload Photos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden"
              >
                {/* Placeholder for actual image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Status overlay */}
                {photo.status !== 'ready' && (
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      photo.status === 'processing' 
                        ? 'bg-blue-100 text-blue-800' 
                        : photo.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {photo.status === 'processing' && (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {photo.status.charAt(0).toUpperCase() + photo.status.slice(1)}
                    </span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button className="p-2 bg-white rounded-full text-slate-900 hover:bg-slate-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete album?</h3>
            <p className="text-slate-600 mb-6">
              This will delete &quot;{album.name}&quot; and all its photos. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-slate-700 font-medium hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Album'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
