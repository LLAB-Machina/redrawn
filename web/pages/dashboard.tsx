import Link from 'next/link'
import Layout from '@/components/Layout'
import { 
  useListAlbumsQuery, 
  useListThemesQuery,
  useGetCreditBalanceQuery,
} from '@/services/api'

export default function DashboardPage() {
  const { data: albumsData, isLoading: albumsLoading } = useListAlbumsQuery()
  const { data: themesData, isLoading: themesLoading } = useListThemesQuery()
  const { data: creditsData } = useGetCreditBalanceQuery()

  const albums = albumsData?.albums?.slice(0, 4) ?? []
  const themes = themesData?.themes?.slice(0, 3) ?? []
  const credits = creditsData?.balance ?? 0

  const recentAlbums = albums.slice(0, 3)

  return (
    <Layout title="Dashboard - Redrawn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Welcome back
          </h1>
          <p className="text-slate-600 mt-1">
            Manage your albums, generate themed photos, and share your work.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">
              {albumsLoading ? '-' : albumsData?.albums?.length ?? 0}
            </div>
            <div className="text-sm text-slate-500">Albums</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">
              {credits}
            </div>
            <div className="text-sm text-slate-500">Credits</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">
              {themesLoading ? '-' : themesData?.themes?.length ?? 0}
            </div>
            <div className="text-sm text-slate-500">Themes</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">0</div>
            <div className="text-sm text-slate-500">Generated</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Albums */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Albums</h2>
              <Link href="/albums" className="text-sm text-slate-600 hover:text-slate-900">
                View all →
              </Link>
            </div>

            {albumsLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                    <div className="h-32 bg-slate-200 rounded-lg mb-4"></div>
                    <div className="h-5 bg-slate-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentAlbums.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-slate-600 mb-4">No albums yet. Create your first album to get started.</p>
                <Link
                  href="/albums/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  Create Album
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {recentAlbums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/albums/${album.id}`}
                    className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all"
                  >
                    <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                        {album.name}
                      </h3>
                      {album.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{album.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/albums/new"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">New Album</p>
                    <p className="text-xs text-slate-500">Create a photo collection</p>
                  </div>
                </Link>
                <Link
                  href="/themes"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Browse Themes</p>
                    <p className="text-xs text-slate-500">Find photo styles</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Credits */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-amber-900">Credit Balance</h3>
                <span className="text-2xl font-bold text-amber-900">{credits}</span>
              </div>
              <p className="text-sm text-amber-700 mb-4">
                Credits are used for AI photo generation.
              </p>
              <button className="w-full py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm">
                Buy Credits
              </button>
            </div>

            {/* Available Themes */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Themes</h3>
                <Link href="/themes" className="text-sm text-slate-600 hover:text-slate-900">
                  Browse →
                </Link>
              </div>
              
              {themesLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : themes.length === 0 ? (
                <p className="text-sm text-slate-500">No themes available yet.</p>
              ) : (
                <div className="space-y-2">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{theme.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
