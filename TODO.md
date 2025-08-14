## Product UX TODO

- [x] Homepage: Marketing hero and sample albums grid (use template images). CTA to signup (10 free credits).
- [x] Auth: Create account / sign in via magic link. Copy mentions 10 free credits. Add verify page.
- [x] My Albums: List user's albums with create album flow.
- [x] Album Gallery: Show all images in an album in a gallery view (originals and generated).
- [x] Upload: Support uploading one or multiple images and .zip, pipe to upload init → PUT → create original.
- [x] Themes: Select a theme for an album and/or a single image; allow generating with selected theme.
- [x] Generation: Kick off generation for images (one credit each) and basic display of generated results.
- [ ] Album Theme View: Toggle which theme to display across album and when viewing a single image.

Notes
- Start with homepage to clearly position: "AI-filtered photo albums. Create, style, and share with friends and family."
- Keep UI minimal and fast; rely on existing API endpoints from `web/src/services/genApi.ts`.
- To fully support choosing which theme to display across an album, the generated image objects need to include their originating `theme_id` so we can filter; currently not present in `GeneratedPhoto`.

## Backend Refactor: Typed API Models Only

- [ ] Handlers: replace any map payload assembly with typed requests
  - [ ] `api/internal/handlers/albums.go`: stop building `payload := map[string]any{}` for PATCH; pass `api.AlbumUpdateRequest` to service
  - [ ] `api/internal/handlers/themes.go`: ensure `CreateThemeRequest` fields use typed map alias (see Models)
  - [ ] `api/internal/handlers/photos.go`: ensure all bodies/returns use typed models only (no `map[string]any`)
  - [ ] `api/internal/handlers/admin.go`: verify requests/responses all typed (prices, jobs)
  - [ ] `api/internal/handlers/users.go`: verify `PatchMeRequest` pattern
  - [ ] Billing, Memberships, Auth, Public, Health: verify all endpoints strictly typed (no `map[string]any`)

- [ ] Services: remove `map[string]any` parameters/returns
  - [ ] `AlbumsService.Update(ctx, id, payload map[string]any)` → `Update(ctx, id string, req api.AlbumUpdateRequest)`
  - [ ] `ThemesService.Create(ctx, name, prompt string, cssTokens map[string]any)` → define `type CSSTokens map[string]string` (or structured fields) and use in `api.CreateThemeRequest`
  - [ ] `PhotosService`: replace job enqueue payload maps with typed `GenerateJobPayload`
  - [ ] `AdminService`: ensure job/model responses avoid `map[string]any` (define `AdminJobPayload` if needed)
  - [ ] Any other `map[string]any` usage in services → typed structs

- [ ] App / Queue boundaries
  - [ ] `api/internal/app/app.go`: change `TaskQueue` interface to accept typed payloads: `Enqueue(ctx, taskType string, payload any)` or per-task generics; prefer `[]byte` JSON with typed marshal at boundary
  - [ ] `api/internal/queue/dbqueue.go`: introduce per-task payload structs; persist JSON as `[]byte` while handlers/services use typed structs

- [ ] Ent models and DB columns
  - [ ] Ent generated uses `map[string]interface{}` for JSON fields (e.g., `theme.css_tokens`, `job.payload`); convert at service boundary using typed structs/aliases

- [ ] API models
  - [ ] Replace `map[string]any` fields in `api/internal/api/models.go`
    - [ ] `Theme.CSSTokens` and `CreateThemeRequest.CSSTokens` → `type CSSTokens map[string]string` (or a struct per known token keys)
    - [ ] `AdminJob.Payload` → define `AdminJobPayload` union via struct(s) per job type; if heterogeneous, expose minimal typed view + raw JSON string if necessary

- [ ] OpenAPI
  - [ ] Update `api/openapi.json` and `api/doc/openapi.json` to reflect typed models
  - [ ] Regenerate client schemas in `web/openapi.client.json` and re-run RTK Query codegen

- [ ] Web client
  - [ ] Update `web/src/services/genApi.ts` and usages to match new types
  - [ ] Fix any `as any` casts and replace with strong types

