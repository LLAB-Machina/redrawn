import { PublicLayout } from "@/components/layouts/PublicLayout";

export default function ContactPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Contact</h1>
        <p className="text-muted-foreground">Email us at support@redrawn.app and we will get back to you.</p>
      </div>
    </PublicLayout>
  );
}


