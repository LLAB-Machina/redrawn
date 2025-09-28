import { emptySplitApi as api } from "./emptyApi";
export const addTagTypes = [
  "v1/admin",
  "v1/albums",
  "v1/albums/membership",
  "v1/albums/photos",
  "v1/auth",
  "v1/billing",
  "v1/public",
  "v1/themes",
  "v1/users",
] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      healthCheck: build.query<HealthCheckApiResponse, HealthCheckApiArg>({
        query: (queryArg) => ({
          url: `/health`,
          headers: { Accept: queryArg.accept },
        }),
      }),
      adminListAlbums: build.query<
        AdminListAlbumsApiResponse,
        AdminListAlbumsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/albums`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/admin"],
      }),
      adminListJobs: build.query<AdminListJobsApiResponse, AdminListJobsApiArg>(
        {
          query: (queryArg) => ({
            url: `/v1/admin/jobs`,
            headers: { Accept: queryArg.accept },
          }),
          providesTags: ["v1/admin"],
        }
      ),
      adminGetJobSummary: build.query<
        AdminGetJobSummaryApiResponse,
        AdminGetJobSummaryApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/jobs/summary`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/admin"],
      }),
      adminGetJobLogs: build.query<
        AdminGetJobLogsApiResponse,
        AdminGetJobLogsApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/jobs/${queryArg.id}/logs`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/admin"],
      }),
      adminListPrices: build.query<
        AdminListPricesApiResponse,
        AdminListPricesApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/prices`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/admin"],
      }),
      adminCreatePrice: build.mutation<
        AdminCreatePriceApiResponse,
        AdminCreatePriceApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/prices`,
          method: "POST",
          body: queryArg.createPriceRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/admin"],
      }),
      adminDeletePrice: build.mutation<
        AdminDeletePriceApiResponse,
        AdminDeletePriceApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/prices/${queryArg.id}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/admin"],
      }),
      adminUpdatePrice: build.mutation<
        AdminUpdatePriceApiResponse,
        AdminUpdatePriceApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/prices/${queryArg.id}`,
          method: "PUT",
          body: queryArg.updatePriceRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/admin"],
      }),
      adminListUsers: build.query<
        AdminListUsersApiResponse,
        AdminListUsersApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/admin/users`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/admin"],
      }),
      listAlbums: build.query<ListAlbumsApiResponse, ListAlbumsApiArg>({
        query: (queryArg) => ({
          url: `/v1/albums`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/albums"],
      }),
      createAlbum: build.mutation<CreateAlbumApiResponse, CreateAlbumApiArg>({
        query: (queryArg) => ({
          url: `/v1/albums`,
          method: "POST",
          body: queryArg.albumCreateRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums"],
      }),
      listAlbumsByEmail: build.query<
        ListAlbumsByEmailApiResponse,
        ListAlbumsByEmailApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/email/${queryArg.email}`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/albums"],
      }),
      createAlbumInviteLink: build.mutation<
        CreateAlbumInviteLinkApiResponse,
        CreateAlbumInviteLinkApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/membership/${queryArg.id}/invite_links`,
          method: "POST",
          body: queryArg.createInviteLinkRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/membership"],
      }),
      acceptAlbumInviteLink: build.mutation<
        AcceptAlbumInviteLinkApiResponse,
        AcceptAlbumInviteLinkApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/membership/${queryArg.id}/invite_links/accept/${queryArg.token}`,
          method: "POST",
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/membership"],
      }),
      revokeAlbumLinkInvite: build.mutation<
        RevokeAlbumLinkInviteApiResponse,
        RevokeAlbumLinkInviteApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/membership/${queryArg.id}/invite_links/${queryArg.linkId}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/membership"],
      }),
      inviteToAlbum: build.mutation<
        InviteToAlbumApiResponse,
        InviteToAlbumApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/membership/${queryArg.id}/invites`,
          method: "POST",
          body: queryArg.inviteRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/membership"],
      }),
      revokeAlbumEmailInvite: build.mutation<
        RevokeAlbumEmailInviteApiResponse,
        RevokeAlbumEmailInviteApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/membership/${queryArg.id}/invites/${queryArg.inviteId}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/membership"],
      }),
      updateAlbumEmailInviteRole: build.mutation<
        UpdateAlbumEmailInviteRoleApiResponse,
        UpdateAlbumEmailInviteRoleApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/membership/${queryArg.id}/invites/${queryArg.inviteId}`,
          method: "POST",
          body: queryArg.roleRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/membership"],
      }),
      removeAlbumMember: build.mutation<
        RemoveAlbumMemberApiResponse,
        RemoveAlbumMemberApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/membership/${queryArg.id}/members/${queryArg.userId}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/membership"],
      }),
      setAlbumMemberRole: build.mutation<
        SetAlbumMemberRoleApiResponse,
        SetAlbumMemberRoleApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/membership/${queryArg.id}/members/${queryArg.userId}`,
          method: "POST",
          body: queryArg.roleRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/membership"],
      }),
      membershipsList: build.query<
        MembershipsListApiResponse,
        MembershipsListApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/membership/${queryArg.id}/memberships`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/albums/membership"],
      }),
      getPhotoFileUrl: build.query<
        GetPhotoFileUrlApiResponse,
        GetPhotoFileUrlApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/photos/files/url/${queryArg.id}`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/albums/photos"],
      }),
      generateOriginalPhoto: build.mutation<
        GenerateOriginalPhotoApiResponse,
        GenerateOriginalPhotoApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/photos/originals/generate/${queryArg.id}`,
          method: "POST",
          body: queryArg.generateRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/photos"],
      }),
      listGeneratedPhotos: build.query<
        ListGeneratedPhotosApiResponse,
        ListGeneratedPhotosApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/photos/originals/generated/${queryArg.id}`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/albums/photos"],
      }),
      getPhotoTaskStatus: build.query<
        GetPhotoTaskStatusApiResponse,
        GetPhotoTaskStatusApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/photos/tasks/${queryArg.id}`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/albums/photos"],
      }),
      initPhotoUpload: build.mutation<
        InitPhotoUploadApiResponse,
        InitPhotoUploadApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/photos/${queryArg.id}/uploads`,
          method: "POST",
          body: queryArg.uploadInitRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/photos"],
      }),
      listOriginalPhotos: build.query<
        ListOriginalPhotosApiResponse,
        ListOriginalPhotosApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/photosoriginals/${queryArg.id}`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/albums/photos"],
      }),
      createOriginalPhoto: build.mutation<
        CreateOriginalPhotoApiResponse,
        CreateOriginalPhotoApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/photosoriginals/${queryArg.id}`,
          method: "POST",
          body: queryArg.createOriginalRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums/photos"],
      }),
      slugAvailability: build.query<
        SlugAvailabilityApiResponse,
        SlugAvailabilityApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/albums/slugs/${queryArg.slug}/check`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/albums"],
      }),
      deleteAlbum: build.mutation<DeleteAlbumApiResponse, DeleteAlbumApiArg>({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}`,
          method: "DELETE",
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums"],
      }),
      getAlbumById: build.query<GetAlbumByIdApiResponse, GetAlbumByIdApiArg>({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/albums"],
      }),
      updateAlbum: build.mutation<UpdateAlbumApiResponse, UpdateAlbumApiArg>({
        query: (queryArg) => ({
          url: `/v1/albums/${queryArg.id}`,
          method: "PATCH",
          body: queryArg.albumUpdateRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/albums"],
      }),
      authGoogleCallback: build.query<
        AuthGoogleCallbackApiResponse,
        AuthGoogleCallbackApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/auth/google/callback`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/auth"],
      }),
      authGoogleStart: build.query<
        AuthGoogleStartApiResponse,
        AuthGoogleStartApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/auth/google/start`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/auth"],
      }),
      authLogout: build.mutation<AuthLogoutApiResponse, AuthLogoutApiArg>({
        query: (queryArg) => ({
          url: `/v1/auth/logout`,
          method: "POST",
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/auth"],
      }),
      createCheckoutSession: build.mutation<
        CreateCheckoutSessionApiResponse,
        CreateCheckoutSessionApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/billing/create-checkout-session`,
          method: "POST",
          body: queryArg.createCheckoutSessionRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/billing"],
      }),
      listActivePrices: build.query<
        ListActivePricesApiResponse,
        ListActivePricesApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/billing/prices`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/billing"],
      }),
      stripeWebhook: build.mutation<
        StripeWebhookApiResponse,
        StripeWebhookApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/billing/stripe/webhook`,
          method: "POST",
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/billing"],
      }),
      previewInviteLink: build.query<
        PreviewInviteLinkApiResponse,
        PreviewInviteLinkApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/public/albums/${queryArg.id}/invite/${queryArg.token}`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/public"],
      }),
      getPublicAlbumBySlug: build.query<
        GetPublicAlbumBySlugApiResponse,
        GetPublicAlbumBySlugApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/public/albums/${queryArg.slug}`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/public"],
      }),
      listThemes: build.query<ListThemesApiResponse, ListThemesApiArg>({
        query: (queryArg) => ({
          url: `/v1/themes/themes`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/themes"],
      }),
      createTheme: build.mutation<CreateThemeApiResponse, CreateThemeApiArg>({
        query: (queryArg) => ({
          url: `/v1/themes/themes`,
          method: "POST",
          body: queryArg.createThemeRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/themes"],
      }),
      me: build.query<MeApiResponse, MeApiArg>({
        query: (queryArg) => ({
          url: `/v1/users/me`,
          headers: { Accept: queryArg.accept },
        }),
        providesTags: ["v1/users"],
      }),
      updateMe: build.mutation<UpdateMeApiResponse, UpdateMeApiArg>({
        query: (queryArg) => ({
          url: `/v1/users/me`,
          method: "PATCH",
          body: queryArg.patchMeRequest,
          headers: { Accept: queryArg.accept },
        }),
        invalidatesTags: ["v1/users"],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as api };
export type HealthCheckApiResponse = /** status 200 OK */ StatusResponse;
export type HealthCheckApiArg = {
  accept?: string;
};
export type AdminListAlbumsApiResponse = /** status 200 OK */ AdminAlbum[];
export type AdminListAlbumsApiArg = {
  accept?: string;
};
export type AdminListJobsApiResponse = /** status 200 OK */ AdminJob[];
export type AdminListJobsApiArg = {
  accept?: string;
};
export type AdminGetJobSummaryApiResponse =
  /** status 200 OK */ AdminJobSummary;
export type AdminGetJobSummaryApiArg = {
  accept?: string;
};
export type AdminGetJobLogsApiResponse = /** status 200 OK */ JobLogsResponse;
export type AdminGetJobLogsApiArg = {
  accept?: string;
  id: string;
};
export type AdminListPricesApiResponse = /** status 200 OK */ Price[];
export type AdminListPricesApiArg = {
  accept?: string;
};
export type AdminCreatePriceApiResponse = /** status 200 OK */ Price;
export type AdminCreatePriceApiArg = {
  accept?: string;
  /** Request body for api.CreatePriceRequest */
  createPriceRequest: CreatePriceRequest;
};
export type AdminDeletePriceApiResponse = /** status 200 OK */ OkResponse;
export type AdminDeletePriceApiArg = {
  accept?: string;
  id: string;
};
export type AdminUpdatePriceApiResponse = /** status 200 OK */ Price;
export type AdminUpdatePriceApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.UpdatePriceRequest */
  updatePriceRequest: UpdatePriceRequest;
};
export type AdminListUsersApiResponse = /** status 200 OK */ AdminUser[];
export type AdminListUsersApiArg = {
  accept?: string;
};
export type ListAlbumsApiResponse = /** status 200 OK */ Album[];
export type ListAlbumsApiArg = {
  accept?: string;
};
export type CreateAlbumApiResponse = /** status 200 OK */ Album;
export type CreateAlbumApiArg = {
  accept?: string;
  /** Request body for api.AlbumCreateRequest */
  albumCreateRequest: AlbumCreateRequest;
};
export type ListAlbumsByEmailApiResponse = /** status 200 OK */ Album[];
export type ListAlbumsByEmailApiArg = {
  accept?: string;
  email: string;
};
export type CreateAlbumInviteLinkApiResponse = /** status 200 OK */ InviteLink;
export type CreateAlbumInviteLinkApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.CreateInviteLinkRequest */
  createInviteLinkRequest: CreateInviteLinkRequest;
};
export type AcceptAlbumInviteLinkApiResponse = /** status 200 OK */ OkResponse;
export type AcceptAlbumInviteLinkApiArg = {
  accept?: string;
  id: string;
  token: string;
};
export type RevokeAlbumLinkInviteApiResponse = /** status 200 OK */ OkResponse;
export type RevokeAlbumLinkInviteApiArg = {
  accept?: string;
  id: string;
  linkId: string;
};
export type InviteToAlbumApiResponse = /** status 200 OK */ StatusResponse;
export type InviteToAlbumApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.InviteRequest */
  inviteRequest: InviteRequest;
};
export type RevokeAlbumEmailInviteApiResponse = /** status 200 OK */ OkResponse;
export type RevokeAlbumEmailInviteApiArg = {
  accept?: string;
  id: string;
  inviteId: string;
};
export type UpdateAlbumEmailInviteRoleApiResponse =
  /** status 200 OK */ OkResponse;
export type UpdateAlbumEmailInviteRoleApiArg = {
  accept?: string;
  id: string;
  inviteId: string;
  /** Request body for api.RoleRequest */
  roleRequest: RoleRequest;
};
export type RemoveAlbumMemberApiResponse = /** status 200 OK */ OkResponse;
export type RemoveAlbumMemberApiArg = {
  accept?: string;
  id: string;
  userId: string;
};
export type SetAlbumMemberRoleApiResponse = /** status 200 OK */ OkResponse;
export type SetAlbumMemberRoleApiArg = {
  accept?: string;
  id: string;
  userId: string;
  /** Request body for api.RoleRequest */
  roleRequest: RoleRequest;
};
export type MembershipsListApiResponse =
  /** status 200 OK */ MembershipsResponse;
export type MembershipsListApiArg = {
  accept?: string;
  id: string;
};
export type GetPhotoFileUrlApiResponse = /** status 200 OK */ UrlResponse;
export type GetPhotoFileUrlApiArg = {
  accept?: string;
  id: string;
};
export type GenerateOriginalPhotoApiResponse =
  /** status 200 OK */ TaskResponse;
export type GenerateOriginalPhotoApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.GenerateRequest */
  generateRequest: GenerateRequest;
};
export type ListGeneratedPhotosApiResponse =
  /** status 200 OK */ GeneratedPhoto[];
export type ListGeneratedPhotosApiArg = {
  accept?: string;
  id: string;
};
export type GetPhotoTaskStatusApiResponse =
  /** status 200 OK */ TaskStatusResponse;
export type GetPhotoTaskStatusApiArg = {
  accept?: string;
  id: string;
};
export type InitPhotoUploadApiResponse =
  /** status 200 OK */ UploadInitResponse;
export type InitPhotoUploadApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.UploadInitRequest */
  uploadInitRequest: UploadInitRequest;
};
export type ListOriginalPhotosApiResponse =
  /** status 200 OK */ OriginalPhoto[];
export type ListOriginalPhotosApiArg = {
  accept?: string;
  id: string;
};
export type CreateOriginalPhotoApiResponse = /** status 200 OK */ IdResponse;
export type CreateOriginalPhotoApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.CreateOriginalRequest */
  createOriginalRequest: CreateOriginalRequest;
};
export type SlugAvailabilityApiResponse =
  /** status 200 OK */ SlugCheckResponse;
export type SlugAvailabilityApiArg = {
  accept?: string;
  slug: string;
};
export type DeleteAlbumApiResponse = /** status 200 OK */ OkResponse;
export type DeleteAlbumApiArg = {
  accept?: string;
  id: string;
};
export type GetAlbumByIdApiResponse = /** status 200 OK */ Album;
export type GetAlbumByIdApiArg = {
  accept?: string;
  id: string;
};
export type UpdateAlbumApiResponse = /** status 200 OK */ OkResponse;
export type UpdateAlbumApiArg = {
  accept?: string;
  id: string;
  /** Request body for api.AlbumUpdateRequest */
  albumUpdateRequest: AlbumUpdateRequest;
};
export type AuthGoogleCallbackApiResponse = /** status 200 OK */ OkResponse;
export type AuthGoogleCallbackApiArg = {
  accept?: string;
};
export type AuthGoogleStartApiResponse = /** status 200 OK */ UrlResponse;
export type AuthGoogleStartApiArg = {
  accept?: string;
};
export type AuthLogoutApiResponse = /** status 200 OK */ OkResponse;
export type AuthLogoutApiArg = {
  accept?: string;
};
export type CreateCheckoutSessionApiResponse = /** status 200 OK */ UrlResponse;
export type CreateCheckoutSessionApiArg = {
  accept?: string;
  /** Request body for api.CreateCheckoutSessionRequest */
  createCheckoutSessionRequest: CreateCheckoutSessionRequest;
};
export type ListActivePricesApiResponse = /** status 200 OK */ Price[];
export type ListActivePricesApiArg = {
  accept?: string;
};
export type StripeWebhookApiResponse = /** status 200 OK */ OkResponse;
export type StripeWebhookApiArg = {
  accept?: string;
};
export type PreviewInviteLinkApiResponse =
  /** status 200 OK */ InviteLinkPreview;
export type PreviewInviteLinkApiArg = {
  accept?: string;
  id: string;
  token: string;
};
export type GetPublicAlbumBySlugApiResponse = /** status 200 OK */ PublicAlbum;
export type GetPublicAlbumBySlugApiArg = {
  accept?: string;
  slug: string;
};
export type ListThemesApiResponse = /** status 200 OK */ Theme[];
export type ListThemesApiArg = {
  accept?: string;
};
export type CreateThemeApiResponse = /** status 200 OK */ IdResponse;
export type CreateThemeApiArg = {
  accept?: string;
  /** Request body for api.CreateThemeRequest */
  createThemeRequest: CreateThemeRequest;
};
export type MeApiResponse = /** status 200 OK */ User;
export type MeApiArg = {
  accept?: string;
};
export type UpdateMeApiResponse = /** status 200 OK */ OkResponse;
export type UpdateMeApiArg = {
  accept?: string;
  /** Request body for api.PatchMeRequest */
  patchMeRequest: PatchMeRequest;
};
export type StatusResponse = {
  status?: string;
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
export type AdminAlbum = {
  created_at?: string;
  id?: string;
  name?: string;
  owner_email?: string;
  slug?: string;
  visibility?: string;
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
export type UrlResponse = {
  url?: string;
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
  is_favorite?: boolean;
  state?: string;
  theme_id?: string | null;
};
export type TaskStatusResponse = {
  status?: string;
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
export type SlugCheckResponse = {
  available?: boolean;
};
export type AlbumUpdateRequest = {
  name?: string | null;
  slug?: string | null;
  visibility?: string | null;
};
export type CreateCheckoutSessionRequest = {
  price_id: string;
};
export type InviteLinkPreview = {
  album_id?: string;
  album_name?: string;
  album_slug?: string;
  expires_at?: string | null;
  max_uses?: number | null;
  reason?: string | null;
  revoked_at?: string | null;
  role?: string;
  uses?: number;
  valid?: boolean;
};
export type PublicAlbum = {
  contributor_count?: number;
  id?: string;
  member_role?: string | null;
  name?: string;
  photo_count?: number;
  photos?: {
    file_id?: string | null;
    id?: string;
  }[];
  slug?: string;
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
export const {
  useHealthCheckQuery,
  useLazyHealthCheckQuery,
  useAdminListAlbumsQuery,
  useLazyAdminListAlbumsQuery,
  useAdminListJobsQuery,
  useLazyAdminListJobsQuery,
  useAdminGetJobSummaryQuery,
  useLazyAdminGetJobSummaryQuery,
  useAdminGetJobLogsQuery,
  useLazyAdminGetJobLogsQuery,
  useAdminListPricesQuery,
  useLazyAdminListPricesQuery,
  useAdminCreatePriceMutation,
  useAdminDeletePriceMutation,
  useAdminUpdatePriceMutation,
  useAdminListUsersQuery,
  useLazyAdminListUsersQuery,
  useListAlbumsQuery,
  useLazyListAlbumsQuery,
  useCreateAlbumMutation,
  useListAlbumsByEmailQuery,
  useLazyListAlbumsByEmailQuery,
  useCreateAlbumInviteLinkMutation,
  useAcceptAlbumInviteLinkMutation,
  useRevokeAlbumLinkInviteMutation,
  useInviteToAlbumMutation,
  useRevokeAlbumEmailInviteMutation,
  useUpdateAlbumEmailInviteRoleMutation,
  useRemoveAlbumMemberMutation,
  useSetAlbumMemberRoleMutation,
  useMembershipsListQuery,
  useLazyMembershipsListQuery,
  useGetPhotoFileUrlQuery,
  useLazyGetPhotoFileUrlQuery,
  useGenerateOriginalPhotoMutation,
  useListGeneratedPhotosQuery,
  useLazyListGeneratedPhotosQuery,
  useGetPhotoTaskStatusQuery,
  useLazyGetPhotoTaskStatusQuery,
  useInitPhotoUploadMutation,
  useListOriginalPhotosQuery,
  useLazyListOriginalPhotosQuery,
  useCreateOriginalPhotoMutation,
  useSlugAvailabilityQuery,
  useLazySlugAvailabilityQuery,
  useDeleteAlbumMutation,
  useGetAlbumByIdQuery,
  useLazyGetAlbumByIdQuery,
  useUpdateAlbumMutation,
  useAuthGoogleCallbackQuery,
  useLazyAuthGoogleCallbackQuery,
  useAuthGoogleStartQuery,
  useLazyAuthGoogleStartQuery,
  useAuthLogoutMutation,
  useCreateCheckoutSessionMutation,
  useListActivePricesQuery,
  useLazyListActivePricesQuery,
  useStripeWebhookMutation,
  usePreviewInviteLinkQuery,
  useLazyPreviewInviteLinkQuery,
  useGetPublicAlbumBySlugQuery,
  useLazyGetPublicAlbumBySlugQuery,
  useListThemesQuery,
  useLazyListThemesQuery,
  useCreateThemeMutation,
  useMeQuery,
  useLazyMeQuery,
  useUpdateMeMutation,
} = injectedRtkApi;
