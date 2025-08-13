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

