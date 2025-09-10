import { AppLayout } from "@/components/layouts/AppLayout";
import {
  useGetV1AdminJobsQuery,
  useGetV1AdminJobsSummaryQuery,
} from "@/services/genApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminJobsPage() {
  const { data: jobs } = useGetV1AdminJobsQuery({});
  const { data: summary } = useGetV1AdminJobsSummaryQuery({});

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Queued</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {summary?.queued ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Running</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {summary?.running ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Succeeded</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {summary?.succeeded ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Failed</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {summary?.failed ?? 0}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {(jobs ?? []).map((j) => (
                <div
                  key={j.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">{j.type}</div>
                    <div className="text-xs text-muted-foreground">{j.id}</div>
                  </div>
                  <Badge
                    variant={
                      j.status === "failed"
                        ? "destructive"
                        : j.status === "running"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {j.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
