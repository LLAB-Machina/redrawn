import { PublicLayout } from "@/components/layouts/PublicLayout";

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Our full privacy policy will be published here. We keep your data
          secure and never sell it.
        </p>
      </div>
    </PublicLayout>
  );
}
