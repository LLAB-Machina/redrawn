import { api, usePostV1ThemesMutation } from '../../src/services/genApi';

export default function Themes() {
  const [triggerListThemes] = api.useLazyGetV1ThemesQuery();
  const [createThemeMutation] = usePostV1ThemesMutation();
  async function listThemes() {
    try {
      const data = await triggerListThemes(undefined as any).unwrap();
      alert(JSON.stringify(data));
    } catch (e: any) {
      alert(String(e));
    }
  }

  async function createTheme(e: any) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const prompt = (form.elements.namedItem('prompt') as HTMLInputElement).value;
    try {
      const data = await createThemeMutation({
        createThemeRequest: { name, prompt },
      }).unwrap();
      alert(JSON.stringify(data));
    } catch (e: any) {
      alert(String(e));
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Themes</h2>
      <div className="grid max-w-2xl gap-6">
        <div>
          <button className="btn btn-neutral h-9 px-4" onClick={listThemes}>
            List Themes
          </button>
        </div>
        <form onSubmit={createTheme} className="card grid max-w-sm gap-2">
          <div className="text-sm font-semibold tracking-tight">Create Theme</div>
          <input
            className="h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
            name="name"
            placeholder="name"
          />
          <input
            className="h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
            name="prompt"
            placeholder="prompt"
          />
          <button className="btn btn-primary h-9 px-4" type="submit">
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
