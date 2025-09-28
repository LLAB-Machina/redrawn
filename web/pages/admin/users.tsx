import { AppLayout } from "@/components/layouts/AppLayout";
import { useAdminListUsersQuery } from "@/services/genApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
  const { data } = useAdminListUsersQuery({});

  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {(data ?? []).map((u) => (
              <div key={u.id} className="border rounded-md p-4">
                <div className="font-medium">{u.email}</div>
                <div className="text-sm text-muted-foreground">
                  {u.name || "—"}
                </div>
                <div className="text-sm mt-1">Credits: {u.credits}</div>
                <div className="text-sm">Plan: {u.plan}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
