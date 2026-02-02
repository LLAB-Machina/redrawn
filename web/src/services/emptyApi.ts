import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Base API configuration
export const emptyApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    prepareHeaders: (headers, { getState }) => {
      // Add auth token if available
      const token = (getState() as any).auth?.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  endpoints: () => ({}),
  tagTypes: ['User', 'Album', 'Photo', 'Theme', 'Credit'],
})

// This will be extended with generated endpoints later
