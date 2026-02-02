import Head from 'next/head'
import Link from 'next/link'
import Layout from '../src/components/Layout'
import { useListAlbumsQuery } from '../src/services/api'

export default function AlbumsPage() {
  const { data, isLoading, error } = useListAlbumsQuery()
  const albums = data?.albums ?? []

  return (
    <Layout title="Albums - Redrawn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Albums
            </h1>
            <p className="text-slate-600 mt-1">
              Organize and share your photos
            </p>
          </div>
          <Link
            href="/albums/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Album
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Failed to load albums. Please try again.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && albums.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No albums yet</h3>
            <p className="text-slate-600 mb-4">Create your first album to start organizing photos.</p>
            <Link
              href="/albums/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Create Album
            </Link>
          </div>
        )}

        {/* Albums grid */}
        {!isLoading && !error && albums.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums/${album.id}`}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all"
              >
                {/* Album cover placeholder */}
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:from-slate-200 group-hover:to-slate-300 transition-colors">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 truncate">{album.name}</h3>
                    {album.is_public && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                        Public
                      </span>
                    )}
                  </div>
                  {album.description && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{album.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(album.created_at).toLocaleDateString()}
                    </span>
                    {album.slug && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {album.slug}
                      </span>
                    )}
                  </div>
                  {album.status === 'staged' && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Draft
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
