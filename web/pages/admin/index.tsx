import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useGetV1AdminJobsSummaryQuery,
  useGetV1AdminAlbumsQuery,
  useGetV1AdminUsersQuery,
} from "@/services/genApi";
import {
  Shield,
  Users,
  FolderOpen,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: jobsSummary, isLoading: jobsLoading } =
    useGetV1AdminJobsSummaryQuery({});
  const { data: albums, isLoading: albumsLoading } = useGetV1AdminAlbumsQuery(
    {}
  );
  const { data: users, isLoading: usersLoading } = useGetV1AdminUsersQuery({});

  const stats = [
    {
      title: "Total Users",
      value: users?.length || 0,
      icon: Users,
      loading: usersLoading,
      href: "/admin/users",
    },
    {
      title: "Total Albums",
      value: albums?.length || 0,
      icon: FolderOpen,
      loading: albumsLoading,
      href: "/admin/albums",
    },
    {
      title: "Queued Jobs",
      value: jobsSummary?.queued || 0,
      icon: Clock,
      loading: jobsLoading,
      href: "/admin/jobs",
      variant: "warning" as const,
    },
    {
      title: "Running Jobs",
      value: jobsSummary?.running || 0,
      icon: Zap,
      loading: jobsLoading,
      href: "/admin/jobs",
      variant: "info" as const,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Shield className="h-8 w-8 mr-3 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              System overview and management
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon
                  className={`h-4 w-4 ${
                    stat.variant === "warning"
                      ? "text-yellow-500"
                      : stat.variant === "info"
                      ? "text-blue-500"
                      : "text-muted-foreground"
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.loading ? (
                    <div className="h-8 bg-muted rounded animate-pulse w-16"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <Button variant="link" className="p-0 h-auto text-xs" asChild>
                  <Link href={stat.href}>View details →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Job Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Job Processing Status
            </CardTitle>
            <CardDescription>
              Overview of background job processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Queued:</span>
                  <Badge variant="outline">{jobsSummary?.queued || 0}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Running:</span>
                  <Badge variant="outline">{jobsSummary?.running || 0}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Succeeded:</span>
                  <Badge variant="outline">{jobsSummary?.succeeded || 0}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Failed:</span>
                  <Badge variant="outline">{jobsSummary?.failed || 0}</Badge>
                </div>
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/admin/jobs">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  View All Jobs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button variant="outline" asChild>
                <Link href="/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/albums">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Manage Albums
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/jobs">
                  <Zap className="h-4 w-4 mr-2" />
                  View Jobs
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/prices">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Manage Pricing
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
