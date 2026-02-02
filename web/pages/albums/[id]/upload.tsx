import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { useGetAlbumQuery, useCreatePhotoMutation } from '@/services/api'

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

export default function UploadPhotosPage() {
  const router = useRouter()
  const { id } = router.query
  const albumId = typeof id === 'string' ? id : ''

  const { data: albumData } = useGetAlbumQuery(albumId, { skip: !albumId })
  const [createPhoto] = useCreatePhotoMutation()

  const [files, setFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const album = albumData?.album

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = useCallback(async (fileList: FileList) => {
    const imageFiles = Array.from(fileList).filter(file => 
      file.type.startsWith('image/')
    )

    const newFiles: UploadingFile[] = imageFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading',
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Simulate upload and create photo records
    for (const uploadFile of newFiles) {
      try {
        // Simulate upload progress
        await new Promise(resolve => {
          const interval = setInterval(() => {
            setFiles(prev => prev.map(f => {
              if (f.id === uploadFile.id) {
                const newProgress = Math.min(f.progress + 20, 90)
                return { ...f, progress: newProgress }
              }
              return f
            }))
          }, 200)
          
          setTimeout(() => {
            clearInterval(interval)
            resolve(null)
          }, 1000)
        })

        // Create photo record (in real app, upload to S3 first)
        await createPhoto({
          album_id: albumId,
          storage_key: `uploads/${albumId}/${uploadFile.file.name}`,
          filename: uploadFile.file.name,
          mime_type: uploadFile.file.type,
          size_bytes: uploadFile.file.size,
        }).unwrap()

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress: 100, status: 'complete' }
            : f
        ))
      } catch (err) {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', error: 'Failed to upload' }
            : f
        ))
      }
    }
  }, [albumId, createPhoto])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }, [processFiles])

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const completedCount = files.filter(f => f.status === 'complete').length
  const allComplete = files.length > 0 && completedCount === files.length

  if (!albumId) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Upload Photos - ${album?.name ?? 'Album'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
          <Link href="/albums" className="hover:text-slate-900">Albums</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {album && (
            <>
              <Link href={`/albums/${albumId}`} className="hover:text-slate-900 truncate max-w-xs">{album.name}</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
          <span className="text-slate-900">Upload</span>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Upload Photos
        </h1>
        <p className="text-slate-600 mb-8">
          Add photos to {album?.name || 'this album'}
        </p>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-900 mb-2">
            Drag and drop photos here
          </p>
          <p className="text-slate-500 mb-4">
            or click to browse from your device
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Select Photos
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="font-medium text-slate-900">
              {completedCount} of {files.length} uploaded
            </h3>
            
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg"
              >
                {/* Thumbnail placeholder */}
                <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {/* Progress bar */}
                  {file.status === 'uploading' && (
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {file.status === 'uploading' && (
                    <span className="text-sm text-slate-500">{file.progress}%</span>
                  )}
                  {file.status === 'complete' && (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {file.status === 'error' && (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <Link
            href={`/albums/${albumId}`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to album
          </Link>

          {allComplete && (
            <button
              onClick={() => router.push(`/albums/${albumId}`)}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
