import { emptyApi } from './emptyApi'

// Album types
export interface Album {
  id: string
  group_id: string
  user_id: string
  name: string
  slug?: string
  description?: string
  is_public: boolean
  status: 'staged' | 'confirmed' | 'deleted'
  version: number
  created_at: string
  updated_at: string
}

export interface AlbumMember {
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joined_at: string
}

export interface CreateAlbumRequest {
  name: string
  slug?: string
  description?: string
  is_public?: boolean
}

export interface UpdateAlbumRequest {
  name?: string
  slug?: string
  description?: string
  is_public?: boolean
}

// Photo types
export interface Photo {
  id: string
  group_id: string
  album_id: string
  user_id: string
  storage_key: string
  filename?: string
  mime_type?: string
  size_bytes?: number
  width?: number
  height?: number
  status: 'uploaded' | 'processing' | 'ready' | 'error'
  version: number
  created_at: string
  updated_at: string
}

export interface CreatePhotoRequest {
  album_id: string
  storage_key: string
  filename?: string
  mime_type?: string
  size_bytes?: number
  width?: number
  height?: number
}

export interface UpdatePhotoRequest {
  filename?: string
  width?: number
  height?: number
}

// Theme types
export interface Theme {
  id: string
  group_id: string
  user_id: string
  name: string
  slug?: string
  description?: string
  css_tokens?: Record<string, string>
  prompt_template?: string
  is_public: boolean
  status: 'staged' | 'confirmed' | 'deleted'
  version: number
  created_at: string
  updated_at: string
}

// Credit types
export interface CreditTransaction {
  id: string
  user_id: string
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  amount: number
  balance_after: number
  description?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface CreditBalance {
  balance: number
}

// Extended API
export const api = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    // Album endpoints
    listAlbums: builder.query<{ albums: Album[] }, void>({
      query: () => '/albums',
      providesTags: ['Album'],
    }),
    getAlbum: builder.query<{ album: Album }, string>({
      query: (id) => `/albums/${id}`,
      providesTags: (result, error, id) => [{ type: 'Album', id }],
    }),
    createAlbum: builder.mutation<{ album: Album }, CreateAlbumRequest>({
      query: (body) => ({
        url: '/albums',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Album'],
    }),
    updateAlbum: builder.mutation<{ album: Album }, { id: string } & UpdateAlbumRequest>({
      query: ({ id, ...body }) => ({
        url: `/albums/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Album', id }],
    }),
    deleteAlbum: builder.mutation<{ status: string }, string>({
      query: (id) => ({
        url: `/albums/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Album'],
    }),
    confirmAlbum: builder.mutation<{ album: Album }, string>({
      query: (id) => ({
        url: `/albums/${id}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Album', id }],
    }),
    listAlbumMembers: builder.query<{ members: AlbumMember[] }, string>({
      query: (id) => `/albums/${id}/members`,
    }),

    // Photo endpoints
    listPhotos: builder.query<{ photos: Photo[] }, void>({
      query: () => '/photos',
      providesTags: ['Photo'],
    }),
    listAlbumPhotos: builder.query<{ photos: Photo[] }, string>({
      query: (albumId) => `/albums/${albumId}/photos`,
      providesTags: (result, error, albumId) => 
        result?.photos?.map((p) => ({ type: 'Photo', id: p.id })) || [{ type: 'Photo', id: albumId }],
    }),
    getPhoto: builder.query<Photo, string>({
      query: (id) => `/photos/${id}`,
      providesTags: (result, error, id) => [{ type: 'Photo', id }],
    }),
    createPhoto: builder.mutation<Photo, CreatePhotoRequest>({
      query: (body) => ({
        url: '/photos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Photo'],
    }),
    updatePhoto: builder.mutation<Photo, { id: string } & UpdatePhotoRequest>({
      query: ({ id, ...body }) => ({
        url: `/photos/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Photo', id }],
    }),
    deletePhoto: builder.mutation<{ status: string }, string>({
      query: (id) => ({
        url: `/photos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Photo'],
    }),

    // Theme endpoints
    listThemes: builder.query<{ themes: Theme[] }, void>({
      query: () => '/themes',
      providesTags: ['Theme'],
    }),
    getTheme: builder.query<Theme, string>({
      query: (id) => `/themes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Theme', id }],
    }),

    // Credit endpoints
    getCreditBalance: builder.query<CreditBalance, void>({
      query: () => '/credits/balance',
    }),
    listCreditTransactions: builder.query<{ transactions: CreditTransaction[]; has_more: boolean }, { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 }) => `/credits/transactions?limit=${limit}&offset=${offset}`,
    }),
  }),
})

export const {
  // Album hooks
  useListAlbumsQuery,
  useGetAlbumQuery,
  useCreateAlbumMutation,
  useUpdateAlbumMutation,
  useDeleteAlbumMutation,
  useConfirmAlbumMutation,
  useListAlbumMembersQuery,
  // Photo hooks
  useListPhotosQuery,
  useListAlbumPhotosQuery,
  useGetPhotoQuery,
  useCreatePhotoMutation,
  useUpdatePhotoMutation,
  useDeletePhotoMutation,
  // Theme hooks
  useListThemesQuery,
  useGetThemeQuery,
  // Credit hooks
  useGetCreditBalanceQuery,
  useListCreditTransactionsQuery,
} = api
