import { PublicLayout } from "@/components/layouts/PublicLayout";

export default function HelpPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Help Center</h1>
        <p className="text-muted-foreground">
          We will add help content soon. For now, reach us at
          support@redrawn.app.
        </p>
      </div>
    </PublicLayout>
  );
}
