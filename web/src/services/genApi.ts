import { emptySplitApi as api } from "./emptyApi";
export const addTagTypes = [] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getV1Albums: build.query<GetV1AlbumsApiResponse, GetV1AlbumsApiArg>({
        query: (queryArg) => ({
          url: `/v1/albums`,
          headers: {
            Accept: queryArg,
          },
        }),
      }),
      postV1Albums: build.mutation<PostV1AlbumsApiResponse, PostV1AlbumsApiArg>(
        {
          query: (queryArg) => ({
            url: `/v1/albums`,
            method: "POST",
            body: queryArg.albumCreateRequest,
            headers: {
              Accept: queryArg.accept,
            },
          }),
        },
      ),
      deleteV1AlbumsById: build.mutation<
        DeleteV1AlbumsByIdApiResponse,
        DeleteV1AlbumsByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}`,
          method: "DELETE",
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      getV1AlbumsById: build.query<
        GetV1AlbumsByIdApiResponse,
        GetV1AlbumsByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}`,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      patchV1AlbumsById: build.mutation<
        PatchV1AlbumsByIdApiResponse,
        PatchV1AlbumsByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.albumUpdateRequest,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      postV1AlbumsByIdInvites: build.mutation<
        PostV1AlbumsByIdInvitesApiResponse,
        PostV1AlbumsByIdInvitesApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/invites`,
          method: "POST",
          body: queryArg.inviteRequest,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      deleteV1AlbumsByIdMembersAndUserId: build.mutation<
        DeleteV1AlbumsByIdMembersAndUserIdApiResponse,
        DeleteV1AlbumsByIdMembersAndUserIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/members/${queryArg.userId}`,
          method: "DELETE",
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      postV1AlbumsByIdMembersAndUserId: build.mutation<
        PostV1AlbumsByIdMembersAndUserIdApiResponse,
        PostV1AlbumsByIdMembersAndUserIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/members/${queryArg.userId}`,
          method: "POST",
          body: queryArg.roleRequest,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      getV1AlbumsByIdOriginals: build.query<
        GetV1AlbumsByIdOriginalsApiResponse,
        GetV1AlbumsByIdOriginalsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/originals`,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      postV1AlbumsByIdOriginals: build.mutation<
        PostV1AlbumsByIdOriginalsApiResponse,
        PostV1AlbumsByIdOriginalsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/originals`,
          method: "POST",
          body: queryArg.createOriginalRequest,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      postV1AlbumsByIdUploads: build.mutation<
        PostV1AlbumsByIdUploadsApiResponse,
        PostV1AlbumsByIdUploadsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/uploads`,
          method: "POST",
          body: queryArg.uploadInitRequest,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      postV1AuthLogout: build.mutation<
        PostV1AuthLogoutApiResponse,
        PostV1AuthLogoutApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/auth/logout`,
          method: "POST",
          headers: {
            Accept: queryArg,
          },
        }),
      }),
      postV1AuthRequestMagicLink: build.mutation<
        PostV1AuthRequestMagicLinkApiResponse,
        PostV1AuthRequestMagicLinkApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/auth/request-magic-link`,
          method: "POST",
          body: queryArg.magicLinkRequest,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      postV1AuthVerify: build.mutation<
        PostV1AuthVerifyApiResponse,
        PostV1AuthVerifyApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/auth/verify`,
          method: "POST",
          body: queryArg.verifyRequest,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      postV1BillingCreateCheckoutSession: build.mutation<
        PostV1BillingCreateCheckoutSessionApiResponse,
        PostV1BillingCreateCheckoutSessionApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/billing/create-checkout-session`,
          method: "POST",
          headers: {
            Accept: queryArg,
          },
        }),
      }),
      getV1FilesByIdUrl: build.query<
        GetV1FilesByIdUrlApiResponse,
        GetV1FilesByIdUrlApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/files/${queryArg.id}/url`,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      getV1Health: build.query<GetV1HealthApiResponse, GetV1HealthApiArg>({
        query: (queryArg) => ({
          url: `/v1/health`,
          headers: {
            Accept: queryArg,
          },
        }),
      }),
      getV1Me: build.query<GetV1MeApiResponse, GetV1MeApiArg>({
        query: (queryArg) => ({
          url: `/v1/me`,
          headers: {
            Accept: queryArg,
          },
        }),
      }),
      patchV1Me: build.mutation<PatchV1MeApiResponse, PatchV1MeApiArg>({
        query: (queryArg) => ({
          url: `/v1/me`,
          method: "PATCH",
          body: queryArg.patchMeRequest,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      postV1OriginalsByIdGenerate: build.mutation<
        PostV1OriginalsByIdGenerateApiResponse,
        PostV1OriginalsByIdGenerateApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/originals/${queryArg.id}/generate`,
          method: "POST",
          body: queryArg.generateRequest,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      getV1OriginalsByIdGenerated: build.query<
        GetV1OriginalsByIdGeneratedApiResponse,
        GetV1OriginalsByIdGeneratedApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/originals/${queryArg.id}/generated`,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      getV1PublicAlbumsBySlug: build.query<
        GetV1PublicAlbumsBySlugApiResponse,
        GetV1PublicAlbumsBySlugApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/public/albums/${queryArg.slug}`,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      postV1StripeWebhook: build.mutation<
        PostV1StripeWebhookApiResponse,
        PostV1StripeWebhookApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/stripe/webhook`,
          method: "POST",
          headers: {
            Accept: queryArg,
          },
        }),
      }),
      getV1TasksById: build.query<
        GetV1TasksByIdApiResponse,
        GetV1TasksByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/tasks/${queryArg.id}`,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
      getV1Themes: build.query<GetV1ThemesApiResponse, GetV1ThemesApiArg>({
        query: (queryArg) => ({
          url: `/v1/themes`,
          headers: {
            Accept: queryArg,
          },
        }),
      }),
      postV1Themes: build.mutation<PostV1ThemesApiResponse, PostV1ThemesApiArg>(
        {
          query: (queryArg) => ({
            url: `/v1/themes`,
            method: "POST",
            body: queryArg.createThemeRequest,
            headers: {
              Accept: queryArg.accept,
            },
          }),
        },
      ),
      getV1UsersByHandleAlbums: build.query<
        GetV1UsersByHandleAlbumsApiResponse,
        GetV1UsersByHandleAlbumsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/users/${queryArg.handle}/albums`,
          headers: {
            Accept: queryArg.accept,
          },
        }),
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as api };
export type GetV1AlbumsApiResponse = /** status 200 OK */ Album[];
export type GetV1AlbumsApiArg = string | undefined;
export type PostV1AlbumsApiResponse = /** status 200 OK */ Album;
export type PostV1AlbumsApiArg = {
  accept?: string;
  /** Request body for api.AlbumCreateRequest */
  albumCreateRequest: AlbumCreateRequest;
};
export type DeleteV1AlbumsByIdApiResponse = /** status 200 OK */ OkResponse;
export type DeleteV1AlbumsByIdApiArg = {
  accept?: string;
  id: string;
};
export type GetV1AlbumsByIdApiResponse = /** status 200 OK */ Album;
export type GetV1AlbumsByIdApiArg = {
  accept?: string;
  id: string;
};
export type PatchV1AlbumsByIdApiResponse = /** status 200 OK */ OkResponse;
export type PatchV1AlbumsByIdApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.AlbumUpdateRequest */
  albumUpdateRequest: AlbumUpdateRequest;
};
export type PostV1AlbumsByIdInvitesApiResponse =
  /** status 200 OK */ StatusResponse;
export type PostV1AlbumsByIdInvitesApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.InviteRequest */
  inviteRequest: InviteRequest;
};
export type DeleteV1AlbumsByIdMembersAndUserIdApiResponse =
  /** status 200 OK */ OkResponse;
export type DeleteV1AlbumsByIdMembersAndUserIdApiArg = {
  accept?: string;
  id: string;
  userId: string;
};
export type PostV1AlbumsByIdMembersAndUserIdApiResponse =
  /** status 200 OK */ OkResponse;
export type PostV1AlbumsByIdMembersAndUserIdApiArg = {
  accept?: string;
  id: string;
  userId: string;
  /** Request body for api.RoleRequest */
  roleRequest: RoleRequest;
};
export type GetV1AlbumsByIdOriginalsApiResponse =
  /** status 200 OK */ OriginalPhoto[];
export type GetV1AlbumsByIdOriginalsApiArg = {
  accept?: string;
  id: string;
};
export type PostV1AlbumsByIdOriginalsApiResponse =
  /** status 200 OK */ IdResponse;
export type PostV1AlbumsByIdOriginalsApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.CreateOriginalRequest */
  createOriginalRequest: CreateOriginalRequest;
};
export type PostV1AlbumsByIdUploadsApiResponse =
  /** status 200 OK */ UploadInitResponse;
export type PostV1AlbumsByIdUploadsApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.UploadInitRequest */
  uploadInitRequest: UploadInitRequest;
};
export type PostV1AuthLogoutApiResponse = /** status 200 OK */ OkResponse;
export type PostV1AuthLogoutApiArg = string | undefined;
export type PostV1AuthRequestMagicLinkApiResponse =
  /** status 200 OK */ StatusResponse;
export type PostV1AuthRequestMagicLinkApiArg = {
  accept?: string;
  /** Request body for api.MagicLinkRequest */
  magicLinkRequest: MagicLinkRequest;
};
export type PostV1AuthVerifyApiResponse = /** status 200 OK */ OkResponse;
export type PostV1AuthVerifyApiArg = {
  accept?: string;
  /** Request body for api.VerifyRequest */
  verifyRequest: VerifyRequest;
};
export type PostV1BillingCreateCheckoutSessionApiResponse =
  /** status 200 OK */ UrlResponse;
export type PostV1BillingCreateCheckoutSessionApiArg = string | undefined;
export type GetV1FilesByIdUrlApiResponse = /** status 200 OK */ UrlResponse;
export type GetV1FilesByIdUrlApiArg = {
  accept?: string;
  id: string;
};
export type GetV1HealthApiResponse = /** status 200 OK */ StatusResponse;
export type GetV1HealthApiArg = string | undefined;
export type GetV1MeApiResponse = /** status 200 OK */ User;
export type GetV1MeApiArg = string | undefined;
export type PatchV1MeApiResponse = /** status 200 OK */ OkResponse;
export type PatchV1MeApiArg = {
  accept?: string;
  /** Request body for api.PatchMeRequest */
  patchMeRequest: PatchMeRequest;
};
export type PostV1OriginalsByIdGenerateApiResponse =
  /** status 200 OK */ TaskResponse;
export type PostV1OriginalsByIdGenerateApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.GenerateRequest */
  generateRequest: GenerateRequest;
};
export type GetV1OriginalsByIdGeneratedApiResponse =
  /** status 200 OK */ GeneratedPhoto[];
export type GetV1OriginalsByIdGeneratedApiArg = {
  accept?: string;
  id: string;
};
export type GetV1PublicAlbumsBySlugApiResponse =
  /** status 200 OK */ PublicAlbum;
export type GetV1PublicAlbumsBySlugApiArg = {
  accept?: string;
  slug: string;
};
export type PostV1StripeWebhookApiResponse = /** status 200 OK */ OkResponse;
export type PostV1StripeWebhookApiArg = string | undefined;
export type GetV1TasksByIdApiResponse = /** status 200 OK */ TaskStatusResponse;
export type GetV1TasksByIdApiArg = {
  accept?: string;
  id: string;
};
export type GetV1ThemesApiResponse = /** status 200 OK */ Theme[];
export type GetV1ThemesApiArg = string | undefined;
export type PostV1ThemesApiResponse = /** status 200 OK */ IdResponse;
export type PostV1ThemesApiArg = {
  accept?: string;
  /** Request body for api.CreateThemeRequest */
  createThemeRequest: CreateThemeRequest;
};
export type GetV1UsersByHandleAlbumsApiResponse = /** status 200 OK */ Album[];
export type GetV1UsersByHandleAlbumsApiArg = {
  accept?: string;
  handle: string;
};
export type Album = {
  id?: string;
  name?: string;
  slug?: string;
  visibility?: string | null;
};
export type HttpError = {
  /** Human readable error message */
  detail?: string | null;
  errors?:
    | {
        /** Additional information about the error */
        more?: {
          [key: string]: any;
        } | null;
        /** For example, name of the parameter that caused the error */
        name?: string;
        /** Human readable error message */
        reason?: string;
      }[]
    | null;
  instance?: string | null;
  /** HTTP status code */
  status?: number | null;
  /** Short title of the error */
  title?: string | null;
  /** URL of the error type. Can be used to lookup the error in a documentation */
  type?: string | null;
};
export type AlbumCreateRequest = {
  name: string;
  slug: string;
  visibility?: string;
};
export type OkResponse = {
  ok?: string;
};
export type AlbumUpdateRequest = {
  name?: string | null;
  slug?: string | null;
  visibility?: string | null;
};
export type StatusResponse = {
  status?: string;
};
export type InviteRequest = {
  email?: string;
  role?: string;
};
export type RoleRequest = {
  role?: string;
};
export type OriginalPhoto = {
  created_at?: string;
  file_id?: string | null;
  id?: string;
};
export type IdResponse = {
  id?: string;
};
export type CreateOriginalRequest = {
  file_id?: string;
};
export type UploadInitResponse = {
  file_id?: string;
  upload_url?: string;
};
export type UploadInitRequest = {
  mime?: string;
  name?: string;
  size?: number;
};
export type MagicLinkRequest = {
  email: string;
};
export type VerifyRequest = {
  token: string;
};
export type UrlResponse = {
  url?: string;
};
export type User = {
  credits?: number;
  email?: string;
  handle?: string;
  id?: string;
  name?: string | null;
  plan?: string;
};
export type PatchMeRequest = {
  handle?: string | null;
  name?: string | null;
};
export type TaskResponse = {
  task_id?: string;
};
export type GenerateRequest = {
  theme_id?: string;
};
export type GeneratedPhoto = {
  error?: string | null;
  file_id?: string | null;
  id?: string;
  state?: string;
  theme_id?: string | null;
};
export type PublicAlbum = {
  id?: string;
  name?: string;
  photos?: {
    file_id?: string | null;
    id?: string;
  }[];
  slug?: string;
};
export type TaskStatusResponse = {
  status?: string;
};
export type Theme = {
  css_tokens?: {
    [key: string]: any;
  } | null;
  id?: string;
  name?: string;
  prompt?: string | null;
  slug?: string;
};
export type CreateThemeRequest = {
  css_tokens?: {
    [key: string]: any;
  };
  name?: string;
  prompt?: string;
};
export const {
  useGetV1AlbumsQuery,
  useLazyGetV1AlbumsQuery,
  usePostV1AlbumsMutation,
  useDeleteV1AlbumsByIdMutation,
  useGetV1AlbumsByIdQuery,
  useLazyGetV1AlbumsByIdQuery,
  usePatchV1AlbumsByIdMutation,
  usePostV1AlbumsByIdInvitesMutation,
  useDeleteV1AlbumsByIdMembersAndUserIdMutation,
  usePostV1AlbumsByIdMembersAndUserIdMutation,
  useGetV1AlbumsByIdOriginalsQuery,
  useLazyGetV1AlbumsByIdOriginalsQuery,
  usePostV1AlbumsByIdOriginalsMutation,
  usePostV1AlbumsByIdUploadsMutation,
  usePostV1AuthLogoutMutation,
  usePostV1AuthRequestMagicLinkMutation,
  usePostV1AuthVerifyMutation,
  usePostV1BillingCreateCheckoutSessionMutation,
  useGetV1FilesByIdUrlQuery,
  useLazyGetV1FilesByIdUrlQuery,
  useGetV1HealthQuery,
  useLazyGetV1HealthQuery,
  useGetV1MeQuery,
  useLazyGetV1MeQuery,
  usePatchV1MeMutation,
  usePostV1OriginalsByIdGenerateMutation,
  useGetV1OriginalsByIdGeneratedQuery,
  useLazyGetV1OriginalsByIdGeneratedQuery,
  useGetV1PublicAlbumsBySlugQuery,
  useLazyGetV1PublicAlbumsBySlugQuery,
  usePostV1StripeWebhookMutation,
  useGetV1TasksByIdQuery,
  useLazyGetV1TasksByIdQuery,
  useGetV1ThemesQuery,
  useLazyGetV1ThemesQuery,
  usePostV1ThemesMutation,
  useGetV1UsersByHandleAlbumsQuery,
  useLazyGetV1UsersByHandleAlbumsQuery,
} = injectedRtkApi;
