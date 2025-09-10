import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePostV1AuthLogoutMutation } from "@/services/genApi";
import { setAuthToken } from "@/services/auth";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Home,
  FolderOpen,
  Palette,
  CreditCard,
  Settings,
  LogOut,
  User,
  Shield,
  Plus,
} from "lucide-react";
import { motion } from "motion/react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated } = useAuth();
  const [logout] = usePostV1AuthLogoutMutation();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout({});
    } catch {
      // Logout anyway on error
    } finally {
      setAuthToken(null);
      router.push("/");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Please sign in</h1>
          <p className="text-muted-foreground">
            You need to be authenticated to access this page.
          </p>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/app",
      isActive: router.pathname === "/app",
    },
    {
      title: "Albums",
      icon: FolderOpen,
      href: "/app/albums",
      isActive: router.pathname.startsWith("/app/albums"),
    },
    {
      title: "Themes",
      icon: Palette,
      href: "/app/themes",
      isActive: router.pathname === "/app/themes",
    },
    {
      title: "Billing",
      icon: CreditCard,
      href: "/app/billing",
      isActive: router.pathname === "/app/billing",
    },
  ];

  const adminItems = [
    {
      title: "Admin Panel",
      icon: Shield,
      href: "/admin",
      isActive: router.pathname.startsWith("/admin"),
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Palette className="h-4 w-4" />
              </div>
              <span className="font-semibold">Redrawn</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Admin section - only show if user has admin access */}
              {user?.email && (
                <>
                  <div className="px-3 py-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Admin
                    </div>
                  </div>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={item.isActive}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full justify-start">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user?.name?.charAt(0)?.toUpperCase() ||
                            user?.email?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium truncate">
                          {user?.name || "User"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {user?.credits || 0} credits
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {user?.plan || "Free"}
                          </Badge>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/app/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/app/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
              <SidebarTrigger />
              <div className="flex-1" />
              <Button size="sm" asChild>
                <Link href="/app/albums/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Album
                </Link>
              </Button>
            </div>
          </header>

          <div className="flex-1 p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
