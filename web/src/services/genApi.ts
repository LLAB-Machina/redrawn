import { emptySplitApi as api } from "./emptyApi";
export const addTagTypes = [] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getV1AdminAlbums: build.query<
        GetV1AdminAlbumsApiResponse,
        GetV1AdminAlbumsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/albums`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AdminJobs: build.query<
        GetV1AdminJobsApiResponse,
        GetV1AdminJobsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/jobs`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AdminJobsSummary: build.query<
        GetV1AdminJobsSummaryApiResponse,
        GetV1AdminJobsSummaryApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/jobs/summary`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AdminJobsByIdLogs: build.query<
        GetV1AdminJobsByIdLogsApiResponse,
        GetV1AdminJobsByIdLogsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/jobs/${queryArg.id}/logs`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AdminPrices: build.query<
        GetV1AdminPricesApiResponse,
        GetV1AdminPricesApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/prices`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      postV1AdminPrices: build.mutation<
        PostV1AdminPricesApiResponse,
        PostV1AdminPricesApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/prices`,
          method: "POST",
          body: queryArg.createPriceRequest,
          headers: { Accept: queryArg.accept },
        }),
      }),
      deleteV1AdminPricesById: build.mutation<
        DeleteV1AdminPricesByIdApiResponse,
        DeleteV1AdminPricesByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/prices/${queryArg.id}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
        }),
      }),
      putV1AdminPricesById: build.mutation<
        PutV1AdminPricesByIdApiResponse,
        PutV1AdminPricesByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/prices/${queryArg.id}`,
          method: "PUT",
          body: queryArg.updatePriceRequest,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AdminUsers: build.query<
        GetV1AdminUsersApiResponse,
        GetV1AdminUsersApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/users`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AlbumSlugsBySlugCheck: build.query<
        GetV1AlbumSlugsBySlugCheckApiResponse,
        GetV1AlbumSlugsBySlugCheckApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/album_slugs/${queryArg.slug}/check`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1Albums: build.query<GetV1AlbumsApiResponse, GetV1AlbumsApiArg>({
        query: (queryArg) => ({
          url: `/v1/albums`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      postV1Albums: build.mutation<PostV1AlbumsApiResponse, PostV1AlbumsApiArg>(
        {
          query: (queryArg) => ({
            url: `/v1/albums`,
            method: "POST",
            body: queryArg.albumCreateRequest,
            headers: { Accept: queryArg.accept },
          }),
        }
      ),
      deleteV1AlbumsById: build.mutation<
        DeleteV1AlbumsByIdApiResponse,
        DeleteV1AlbumsByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AlbumsById: build.query<
        GetV1AlbumsByIdApiResponse,
        GetV1AlbumsByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}`,
          headers: { Accept: queryArg.accept },
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
          headers: { Accept: queryArg.accept },
        }),
      }),
      postV1AlbumsByIdInviteLinks: build.mutation<
        PostV1AlbumsByIdInviteLinksApiResponse,
        PostV1AlbumsByIdInviteLinksApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/invite_links`,
          method: "POST",
          body: queryArg.createInviteLinkRequest,
          headers: { Accept: queryArg.accept },
        }),
      }),
      postV1AlbumsByIdInviteLinksAcceptAndToken: build.mutation<
        PostV1AlbumsByIdInviteLinksAcceptAndTokenApiResponse,
        PostV1AlbumsByIdInviteLinksAcceptAndTokenApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/invite_links/accept/${queryArg.token}`,
          method: "POST",
          headers: { Accept: queryArg.accept },
        }),
      }),
      deleteV1AlbumsByIdInviteLinksAndLinkId: build.mutation<
        DeleteV1AlbumsByIdInviteLinksAndLinkIdApiResponse,
        DeleteV1AlbumsByIdInviteLinksAndLinkIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/invite_links/${queryArg.linkId}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
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
          headers: { Accept: queryArg.accept },
        }),
      }),
      deleteV1AlbumsByIdInvitesAndInviteId: build.mutation<
        DeleteV1AlbumsByIdInvitesAndInviteIdApiResponse,
        DeleteV1AlbumsByIdInvitesAndInviteIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/invites/${queryArg.inviteId}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
        }),
      }),
      postV1AlbumsByIdInvitesAndInviteId: build.mutation<
        PostV1AlbumsByIdInvitesAndInviteIdApiResponse,
        PostV1AlbumsByIdInvitesAndInviteIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/invites/${queryArg.inviteId}`,
          method: "POST",
          body: queryArg.roleRequest,
          headers: { Accept: queryArg.accept },
        }),
      }),
      deleteV1AlbumsByIdMembersAndUserId: build.mutation<
        DeleteV1AlbumsByIdMembersAndUserIdApiResponse,
        DeleteV1AlbumsByIdMembersAndUserIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/members/${queryArg.userId}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
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
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AlbumsByIdMemberships: build.query<
        GetV1AlbumsByIdMembershipsApiResponse,
        GetV1AlbumsByIdMembershipsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/memberships`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AlbumsByIdOriginals: build.query<
        GetV1AlbumsByIdOriginalsApiResponse,
        GetV1AlbumsByIdOriginalsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}/originals`,
          headers: { Accept: queryArg.accept },
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
          headers: { Accept: queryArg.accept },
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
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AuthGoogleCallback: build.query<
        GetV1AuthGoogleCallbackApiResponse,
        GetV1AuthGoogleCallbackApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/auth/google/callback`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1AuthGoogleStart: build.query<
        GetV1AuthGoogleStartApiResponse,
        GetV1AuthGoogleStartApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/auth/google/start`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      postV1AuthLogout: build.mutation<
        PostV1AuthLogoutApiResponse,
        PostV1AuthLogoutApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/auth/logout`,
          method: "POST",
          headers: { Accept: queryArg.accept },
        }),
      }),
      postV1BillingCreateCheckoutSession: build.mutation<
        PostV1BillingCreateCheckoutSessionApiResponse,
        PostV1BillingCreateCheckoutSessionApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/billing/create-checkout-session`,
          method: "POST",
          body: queryArg.createCheckoutSessionRequest,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1BillingPrices: build.query<
        GetV1BillingPricesApiResponse,
        GetV1BillingPricesApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/billing/prices`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1FilesByIdUrl: build.query<
        GetV1FilesByIdUrlApiResponse,
        GetV1FilesByIdUrlApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/files/${queryArg.id}/url`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1Health: build.query<GetV1HealthApiResponse, GetV1HealthApiArg>({
        query: (queryArg) => ({
          url: `/v1/health`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1Me: build.query<GetV1MeApiResponse, GetV1MeApiArg>({
        query: (queryArg) => ({
          url: `/v1/me`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      patchV1Me: build.mutation<PatchV1MeApiResponse, PatchV1MeApiArg>({
        query: (queryArg) => ({
          url: `/v1/me`,
          method: "PATCH",
          body: queryArg.patchMeRequest,
          headers: { Accept: queryArg.accept },
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
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1OriginalsByIdGenerated: build.query<
        GetV1OriginalsByIdGeneratedApiResponse,
        GetV1OriginalsByIdGeneratedApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/originals/${queryArg.id}/generated`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1PublicAlbumsBySlug: build.query<
        GetV1PublicAlbumsBySlugApiResponse,
        GetV1PublicAlbumsBySlugApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/public/albums/${queryArg.slug}`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      postV1StripeWebhook: build.mutation<
        PostV1StripeWebhookApiResponse,
        PostV1StripeWebhookApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/stripe/webhook`,
          method: "POST",
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1TasksById: build.query<
        GetV1TasksByIdApiResponse,
        GetV1TasksByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/tasks/${queryArg.id}`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      getV1Themes: build.query<GetV1ThemesApiResponse, GetV1ThemesApiArg>({
        query: (queryArg) => ({
          url: `/v1/themes`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      postV1Themes: build.mutation<PostV1ThemesApiResponse, PostV1ThemesApiArg>(
        {
          query: (queryArg) => ({
            url: `/v1/themes`,
            method: "POST",
            body: queryArg.createThemeRequest,
            headers: { Accept: queryArg.accept },
          }),
        }
      ),
      getV1UsersByEmailAlbums: build.query<
        GetV1UsersByEmailAlbumsApiResponse,
        GetV1UsersByEmailAlbumsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/users/${queryArg.email}/albums`,
          headers: { Accept: queryArg.accept },
        }),
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as api };
export type GetV1AdminAlbumsApiResponse = /** status 200 OK */ AdminAlbum[];
export type GetV1AdminAlbumsApiArg = {
  accept?: string;
};
export type GetV1AdminJobsApiResponse = /** status 200 OK */ AdminJob[];
export type GetV1AdminJobsApiArg = {
  accept?: string;
};
export type GetV1AdminJobsSummaryApiResponse =
  /** status 200 OK */ AdminJobSummary;
export type GetV1AdminJobsSummaryApiArg = {
  accept?: string;
};
export type GetV1AdminJobsByIdLogsApiResponse =
  /** status 200 OK */ JobLogsResponse;
export type GetV1AdminJobsByIdLogsApiArg = {
  accept?: string;
  id: string;
};
export type GetV1AdminPricesApiResponse = /** status 200 OK */ Price[];
export type GetV1AdminPricesApiArg = {
  accept?: string;
};
export type PostV1AdminPricesApiResponse = /** status 200 OK */ Price;
export type PostV1AdminPricesApiArg = {
  accept?: string;
  /** Request body for api.CreatePriceRequest */
  createPriceRequest: CreatePriceRequest;
};
export type DeleteV1AdminPricesByIdApiResponse =
  /** status 200 OK */ OkResponse;
export type DeleteV1AdminPricesByIdApiArg = {
  accept?: string;
  id: string;
};
export type PutV1AdminPricesByIdApiResponse = /** status 200 OK */ Price;
export type PutV1AdminPricesByIdApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.UpdatePriceRequest */
  updatePriceRequest: UpdatePriceRequest;
};
export type GetV1AdminUsersApiResponse = /** status 200 OK */ AdminUser[];
export type GetV1AdminUsersApiArg = {
  accept?: string;
};
export type GetV1AlbumSlugsBySlugCheckApiResponse =
  /** status 200 OK */ SlugCheckResponse;
export type GetV1AlbumSlugsBySlugCheckApiArg = {
  accept?: string;
  slug: string;
};
export type GetV1AlbumsApiResponse = /** status 200 OK */ Album[];
export type GetV1AlbumsApiArg = {
  accept?: string;
};
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
export type PostV1AlbumsByIdInviteLinksApiResponse =
  /** status 200 OK */ InviteLink;
export type PostV1AlbumsByIdInviteLinksApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.CreateInviteLinkRequest */
  createInviteLinkRequest: CreateInviteLinkRequest;
};
export type PostV1AlbumsByIdInviteLinksAcceptAndTokenApiResponse =
  /** status 200 OK */ OkResponse;
export type PostV1AlbumsByIdInviteLinksAcceptAndTokenApiArg = {
  accept?: string;
  id: string;
  token: string;
};
export type DeleteV1AlbumsByIdInviteLinksAndLinkIdApiResponse =
  /** status 200 OK */ OkResponse;
export type DeleteV1AlbumsByIdInviteLinksAndLinkIdApiArg = {
  accept?: string;
  id: string;
  linkId: string;
};
export type PostV1AlbumsByIdInvitesApiResponse =
  /** status 200 OK */ StatusResponse;
export type PostV1AlbumsByIdInvitesApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.InviteRequest */
  inviteRequest: InviteRequest;
};
export type DeleteV1AlbumsByIdInvitesAndInviteIdApiResponse =
  /** status 200 OK */ OkResponse;
export type DeleteV1AlbumsByIdInvitesAndInviteIdApiArg = {
  accept?: string;
  id: string;
  inviteId: string;
};
export type PostV1AlbumsByIdInvitesAndInviteIdApiResponse =
  /** status 200 OK */ OkResponse;
export type PostV1AlbumsByIdInvitesAndInviteIdApiArg = {
  accept?: string;
  id: string;
  inviteId: string;
  /** Request body for api.RoleRequest */
  roleRequest: RoleRequest;
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
export type GetV1AlbumsByIdMembershipsApiResponse =
  /** status 200 OK */ MembershipsResponse;
export type GetV1AlbumsByIdMembershipsApiArg = {
  accept?: string;
  id: string;
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
export type GetV1AuthGoogleCallbackApiResponse =
  /** status 200 OK */ OkResponse;
export type GetV1AuthGoogleCallbackApiArg = {
  accept?: string;
};
export type GetV1AuthGoogleStartApiResponse = /** status 200 OK */ UrlResponse;
export type GetV1AuthGoogleStartApiArg = {
  accept?: string;
};
export type PostV1AuthLogoutApiResponse = /** status 200 OK */ OkResponse;
export type PostV1AuthLogoutApiArg = {
  accept?: string;
};
export type PostV1BillingCreateCheckoutSessionApiResponse =
  /** status 200 OK */ UrlResponse;
export type PostV1BillingCreateCheckoutSessionApiArg = {
  accept?: string;
  /** Request body for api.CreateCheckoutSessionRequest */
  createCheckoutSessionRequest: CreateCheckoutSessionRequest;
};
export type GetV1BillingPricesApiResponse = /** status 200 OK */ Price[];
export type GetV1BillingPricesApiArg = {
  accept?: string;
};
export type GetV1FilesByIdUrlApiResponse = /** status 200 OK */ UrlResponse;
export type GetV1FilesByIdUrlApiArg = {
  accept?: string;
  id: string;
};
export type GetV1HealthApiResponse = /** status 200 OK */ StatusResponse;
export type GetV1HealthApiArg = {
  accept?: string;
};
export type GetV1MeApiResponse = /** status 200 OK */ User;
export type GetV1MeApiArg = {
  accept?: string;
};
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
export type PostV1StripeWebhookApiArg = {
  accept?: string;
};
export type GetV1TasksByIdApiResponse = /** status 200 OK */ TaskStatusResponse;
export type GetV1TasksByIdApiArg = {
  accept?: string;
  id: string;
};
export type GetV1ThemesApiResponse = /** status 200 OK */ Theme[];
export type GetV1ThemesApiArg = {
  accept?: string;
};
export type PostV1ThemesApiResponse = /** status 200 OK */ IdResponse;
export type PostV1ThemesApiArg = {
  accept?: string;
  /** Request body for api.CreateThemeRequest */
  createThemeRequest: CreateThemeRequest;
};
export type GetV1UsersByEmailAlbumsApiResponse = /** status 200 OK */ Album[];
export type GetV1UsersByEmailAlbumsApiArg = {
  accept?: string;
  email: string;
};
export type AdminAlbum = {
  created_at?: string;
  id?: string;
  name?: string;
  owner_email?: string;
  slug?: string;
  visibility?: string;
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
export type AdminJob = {
  completed_at?: string | null;
  enqueued_at?: string;
  error?: string | null;
  id?: string;
  payload?: {
    generated_id?: string;
    job_id?: string | null;
    original_id?: string;
    task?: string;
    theme_id?: string;
  } | null;
  started_at?: string | null;
  status?: string;
  type?: string;
};
export type AdminJobSummary = {
  failed?: number;
  queued?: number;
  running?: number;
  succeeded?: number;
};
export type JobLogsResponse = {
  logs?: string;
};
export type Price = {
  active?: boolean;
  credits?: number;
  id?: string;
  name?: string;
  stripe_price_id?: string;
};
export type CreatePriceRequest = {
  active?: boolean;
  credits: number;
  name: string;
  stripe_price_id: string;
};
export type OkResponse = {
  ok?: string;
};
export type UpdatePriceRequest = {
  active?: boolean | null;
  credits?: number | null;
  name?: string | null;
  stripe_price_id?: string | null;
};
export type AdminUser = {
  created_at?: string;
  credits?: number;
  email?: string;
  id?: string;
  name?: string | null;
  plan?: string;
  stripe_customer_id?: string | null;
};
export type SlugCheckResponse = {
  available?: boolean;
};
export type Album = {
  id?: string;
  name?: string;
  photo_count?: number;
  preview_file_ids?: string[] | null;
  slug?: string;
  visibility?: string | null;
};
export type AlbumCreateRequest = {
  name: string;
  slug: string;
  visibility?: string;
};
export type AlbumUpdateRequest = {
  name?: string | null;
  slug?: string | null;
  visibility?: string | null;
};
export type InviteLink = {
  expires_at?: string | null;
  id?: string;
  max_uses?: number | null;
  revoked_at?: string | null;
  role?: string;
  token?: string;
  uses?: number;
};
export type CreateInviteLinkRequest = {
  expires_at?: string | null;
  max_uses?: number | null;
  role: string;
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
export type MembershipsResponse = {
  invites?: {
    email?: string;
    expires_at?: string | null;
    id?: string;
    role?: string;
    status?: string;
  }[];
  links?: {
    expires_at?: string | null;
    id?: string;
    max_uses?: number | null;
    revoked_at?: string | null;
    role?: string;
    token?: string;
    uses?: number;
  }[];
  members?: {
    email?: string;
    role?: string;
    user_id?: string;
  }[];
};
export type OriginalPhoto = {
  created_at?: string;
  file_id?: string | null;
  id?: string;
  processing?: number | null;
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
export type UrlResponse = {
  url?: string;
};
export type CreateCheckoutSessionRequest = {
  price_id: string;
};
export type User = {
  credits?: number;
  email?: string;
  id?: string;
  name?: string | null;
  plan?: string;
};
export type PatchMeRequest = {
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
  id?: string;
  name?: string;
  prompt?: string | null;
  slug?: string;
};
export type CreateThemeRequest = {
  name?: string;
  prompt?: string;
};
export const {
  useGetV1AdminAlbumsQuery,
  useLazyGetV1AdminAlbumsQuery,
  useGetV1AdminJobsQuery,
  useLazyGetV1AdminJobsQuery,
  useGetV1AdminJobsSummaryQuery,
  useLazyGetV1AdminJobsSummaryQuery,
  useGetV1AdminJobsByIdLogsQuery,
  useLazyGetV1AdminJobsByIdLogsQuery,
  useGetV1AdminPricesQuery,
  useLazyGetV1AdminPricesQuery,
  usePostV1AdminPricesMutation,
  useDeleteV1AdminPricesByIdMutation,
  usePutV1AdminPricesByIdMutation,
  useGetV1AdminUsersQuery,
  useLazyGetV1AdminUsersQuery,
  useGetV1AlbumSlugsBySlugCheckQuery,
  useLazyGetV1AlbumSlugsBySlugCheckQuery,
  useGetV1AlbumsQuery,
  useLazyGetV1AlbumsQuery,
  usePostV1AlbumsMutation,
  useDeleteV1AlbumsByIdMutation,
  useGetV1AlbumsByIdQuery,
  useLazyGetV1AlbumsByIdQuery,
  usePatchV1AlbumsByIdMutation,
  usePostV1AlbumsByIdInviteLinksMutation,
  usePostV1AlbumsByIdInviteLinksAcceptAndTokenMutation,
  useDeleteV1AlbumsByIdInviteLinksAndLinkIdMutation,
  usePostV1AlbumsByIdInvitesMutation,
  useDeleteV1AlbumsByIdInvitesAndInviteIdMutation,
  usePostV1AlbumsByIdInvitesAndInviteIdMutation,
  useDeleteV1AlbumsByIdMembersAndUserIdMutation,
  usePostV1AlbumsByIdMembersAndUserIdMutation,
  useGetV1AlbumsByIdMembershipsQuery,
  useLazyGetV1AlbumsByIdMembershipsQuery,
  useGetV1AlbumsByIdOriginalsQuery,
  useLazyGetV1AlbumsByIdOriginalsQuery,
  usePostV1AlbumsByIdOriginalsMutation,
  usePostV1AlbumsByIdUploadsMutation,
  useGetV1AuthGoogleCallbackQuery,
  useLazyGetV1AuthGoogleCallbackQuery,
  useGetV1AuthGoogleStartQuery,
  useLazyGetV1AuthGoogleStartQuery,
  usePostV1AuthLogoutMutation,
  usePostV1BillingCreateCheckoutSessionMutation,
  useGetV1BillingPricesQuery,
  useLazyGetV1BillingPricesQuery,
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
  useGetV1UsersByEmailAlbumsQuery,
  useLazyGetV1UsersByEmailAlbumsQuery,
} = injectedRtkApi;
