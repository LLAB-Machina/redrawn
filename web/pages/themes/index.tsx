import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { useListThemesQuery } from '@/services/api'

// Generate consistent colors from string (theme ID)
function stringToColor(str: string, index: number): string {
  const colors = [
    ['#667eea', '#764ba2'], // purple
    ['#f093fb', '#f5576c'], // pink-red
    ['#4facfe', '#00f2fe'], // blue-cyan
    ['#43e97b', '#38f9d7'], // green
    ['#fa709a', '#fee140'], // pink-yellow
    ['#30cfd0', '#330867'], // teal-purple
    ['#ff9a9e', '#fecfef'], // rose
    ['#ffecd2', '#fcb69f'], // peach
    ['#a18cd1', '#fbc2eb'], // lavender
    ['#fad0c4', '#ffd1ff'], // coral-pink
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorPair = colors[Math.abs(hash) % colors.length]
  return colorPair[index]
}

// Get a readable theme display name
function getThemeDisplayName(theme: { id: string; name?: string }): string {
  if (theme.name && !theme.name.startsWith('Theme-')) {
    return theme.name
  }
  // Map hash to artistic style names
  const styleNames = [
    'Oil Painting',
    'Watercolor',
    'Pencil Sketch',
    'Pop Art',
    'Impressionist',
    'Neon Glow',
    'Vintage Film',
    'Cyberpunk',
    'Minimalist',
    'Dreamy Haze',
    'High Contrast',
    'Soft Pastel',
  ]
  let hash = 0
  for (let i = 0; i < theme.id.length; i++) {
    hash = theme.id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return styleNames[Math.abs(hash) % styleNames.length]
}

export default function ThemesPage() {
  const router = useRouter()
  const { data, isLoading, error } = useListThemesQuery()
  const themes = data?.themes ?? []
  
  const handleUseTheme = (themeId: string) => {
    router.push(`/themes/apply?theme=${themeId}`)
  }

  return (
    <Layout title="Themes - Redrawn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Themes
          </h1>
          <p className="text-slate-600 mt-1">
            Apply artistic styles to your photos
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="h-40 bg-slate-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Failed to load themes. Please try again.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && themes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No themes yet</h3>
            <p className="text-slate-600">Themes will appear here once they&apos;re created.</p>
          </div>
        )}

        {/* Themes grid */}
        {!isLoading && !error && themes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all"
              >
                {/* Theme preview with colorful gradient */}
                <div 
                  className="aspect-video relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${stringToColor(theme.id, 0)} 0%, ${stringToColor(theme.id, 1)} 100%)`
                  }}
                >
                  {/* Pattern overlay */}
                  <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                    }}
                  />
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{getThemeDisplayName(theme)}</h3>
                    {theme.is_public && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Public
                      </span>
                    )}
                  </div>
                  {theme.description && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{theme.description}</p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <button 
                      onClick={() => handleUseTheme(theme.id)}
                      className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm"
                    >
                      Use Theme
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
