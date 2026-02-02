import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { 
  useListGeneratedPhotosQuery,
  useGetCreditBalanceQuery,
} from '@/services/api'

export default function GeneratedPhotosPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'error'>('all')
  
  const { data: generatedData, isLoading } = useListGeneratedPhotosQuery()
  const { data: creditsData } = useGetCreditBalanceQuery()
  
  const generatedPhotos = generatedData?.generated_photos ?? []
  const credits = creditsData?.balance ?? 0
  
  const filteredPhotos = filter === 'all' 
    ? generatedPhotos 
    : generatedPhotos.filter(p => p.status === filter)

  const statusCounts = {
    all: generatedPhotos.length,
    completed: generatedPhotos.filter(p => p.status === 'completed').length,
    processing: generatedPhotos.filter(p => p.status === 'processing').length,
    error: generatedPhotos.filter(p => p.status === 'error').length,
  }

  return (
    <Layout title="Generated Photos - Redrawn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Generated Photos
            </h1>
            <p className="text-slate-600 mt-1">
              Your AI-transformed images
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <span className="text-sm text-amber-800">{credits} credits</span>
            </div>
            <Link
              href="/themes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Apply Theme
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'completed', 'processing', 'error'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === status ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>

        {/* Photo Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {filter === 'all' ? 'No generated photos yet' : `No ${filter} photos`}
            </h3>
            <p className="text-slate-600 mb-4 max-w-md mx-auto">
              {filter === 'all' 
                ? "Apply a theme to your photos to see AI-generated transformations here."
                : `No photos with "${filter}" status.`}
            </p>
            {filter === 'all' && (
              <Link
                href="/themes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Browse Themes
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden"
              >
                {/* Placeholder for generated image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    photo.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : photo.status === 'processing'
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

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-4">
                  <p className="text-white font-medium text-center mb-1">
                    Theme: {photo.theme_id.slice(0, 8)}...
                  </p>
                  <p className="text-white/70 text-xs text-center mb-3">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </p>
                  {photo.status === 'completed' && (
                    <button className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                      View Original
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Placeholder */}
        {filteredPhotos.length > 0 && (
          <div className="flex justify-center mt-8">
            <button className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">
              Load More
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
