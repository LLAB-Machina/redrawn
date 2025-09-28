import { AppLayout } from "@/components/layouts/AppLayout";
import { useAdminListAlbumsQuery } from "@/services/genApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAlbumsPage() {
  const { data } = useAdminListAlbumsQuery({});

  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle>Albums</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {(data ?? []).map((a) => (
              <div key={a.id} className="border rounded-md p-4">
                <div className="font-medium">{a.name}</div>
                <div className="text-sm text-muted-foreground">{a.slug}</div>
                <div className="text-sm mt-1">Owner: {a.owner_email}</div>
                <div className="text-sm">Visibility: {a.visibility}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
