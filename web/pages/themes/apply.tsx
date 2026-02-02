import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { 
  useListThemesQuery,
  useListAlbumsQuery,
  useListAlbumPhotosQuery,
  useGetPhotoQuery,
  useGetCreditBalanceQuery,
  useCreateGeneratedPhotoMutation,
} from '@/services/api'

interface SelectedPhoto {
  id: string
  albumId: string
  filename?: string
}

export default function ApplyThemePage() {
  const router = useRouter()
  const { theme: themeQuery, photo: photoQuery } = router.query
  
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [selectedAlbum, setSelectedAlbum] = useState<string>('')
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([])
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  // Pre-select from query params
  useEffect(() => {
    if (themeQuery && typeof themeQuery === 'string') {
      setSelectedTheme(themeQuery)
      setStep(2)
    }
  }, [themeQuery])
  
  const { data: preselectedPhotoData } = useGetPhotoQuery(photoQuery as string, { skip: !photoQuery })
  
  useEffect(() => {
    if (preselectedPhotoData && photoQuery) {
      setSelectedPhotos([{
        id: preselectedPhotoData.id,
        albumId: preselectedPhotoData.album_id,
        filename: preselectedPhotoData.filename,
      }])
      setSelectedAlbum(preselectedPhotoData.album_id)
    }
  }, [preselectedPhotoData, photoQuery])
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: themesData, isLoading: themesLoading } = useListThemesQuery()
  const { data: albumsData, isLoading: albumsLoading } = useListAlbumsQuery()
  const { data: photosData, isLoading: photosLoading } = useListAlbumPhotosQuery(selectedAlbum, { skip: !selectedAlbum })
  const { data: creditsData } = useGetCreditBalanceQuery()
  const [createGeneratedPhoto] = useCreateGeneratedPhotoMutation()

  const themes = themesData?.themes ?? []
  const albums = albumsData?.albums ?? []
  const photos = photosData?.photos ?? []
  const credits = creditsData?.balance ?? 0
  const creditsNeeded = selectedPhotos.length * 1 // 1 credit per photo

  const handlePhotoToggle = (photo: { id: string; filename?: string }) => {
    const exists = selectedPhotos.find(p => p.id === photo.id)
    if (exists) {
      setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id))
    } else {
      setSelectedPhotos([...selectedPhotos, { id: photo.id, albumId: selectedAlbum, filename: photo.filename }])
    }
  }

  const handleGenerate = async () => {
    if (!selectedTheme || selectedPhotos.length === 0) return
    
    setIsGenerating(true)
    try {
      // Generate photos one by one
      for (const photo of selectedPhotos) {
        await createGeneratedPhoto({
          original_photo_id: photo.id,
          theme_id: selectedTheme,
          storage_key: `generated/${photo.albumId}/${selectedTheme}/${photo.id}`,
          credits_used: 1,
        }).unwrap()
      }
      
      // Navigate to album page
      router.push(`/albums/${selectedAlbum}`)
    } catch (err) {
      console.error('Generation failed:', err)
      alert('Some generations failed. Please check your credit balance and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Layout title="Apply Theme - Redrawn">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Apply Theme
          </h1>
          <p className="text-slate-600 mt-1">
            Transform your photos with AI-generated styles
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-slate-900' : 'text-slate-500'}`}>
                {s === 1 ? 'Select Theme' : s === 2 ? 'Choose Photos' : 'Generate'}
              </span>
              {s < 3 && <div className="w-8 h-px bg-slate-300 mx-2"></div>}
            </div>
          ))}
        </div>

        {/* Step 1: Select Theme */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">1. Choose a Theme</h2>
            
            {themesLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-slate-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : themes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">No themes available yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTheme === theme.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{theme.name}</span>
                      {theme.is_public && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Public</span>
                      )}
                    </div>
                    {theme.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{theme.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedTheme}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Photos */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">2. Select Photos</h2>

            {/* Album Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Album</label>
              <select
                value={selectedAlbum}
                onChange={(e) => {
                  setSelectedAlbum(e.target.value)
                  setSelectedPhotos([])
                }}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="">Choose an album...</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>{album.name}</option>
                ))}
              </select>
            </div>

            {/* Photo Grid */}
            {selectedAlbum && (
              <>
                {photosLoading ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <p className="text-slate-600">No photos in this album.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {photos.map((photo) => {
                      const isSelected = selectedPhotos.find(p => p.id === photo.id)
                      return (
                        <button
                          key={photo.id}
                          onClick={() => handlePhotoToggle(photo)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          {isSelected && (
                            <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center">
                              <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 text-slate-700 font-medium hover:text-slate-900"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedPhotos.length === 0}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue ({selectedPhotos.length} selected)
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Generate */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">3. Review & Generate</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Selected Theme</span>
                <span className="font-medium text-slate-900">
                  {themes.find(t => t.id === selectedTheme)?.name}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Photos to Process</span>
                <span className="font-medium text-slate-900">{selectedPhotos.length}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Cost</span>
                <span className="font-medium text-slate-900">{creditsNeeded} credits</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-600">Your Balance</span>
                <span className={`font-medium ${credits >= creditsNeeded ? 'text-green-600' : 'text-red-600'}`}>
                  {credits} credits
                </span>
              </div>
            </div>

            {credits < creditsNeeded && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">
                  You don&apos;t have enough credits. <a href="/credits" className="underline">Purchase more credits</a> to continue.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 text-slate-700 font-medium hover:text-slate-900"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || credits < creditsNeeded}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>Generate {selectedPhotos.length} Photo{selectedPhotos.length !== 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
