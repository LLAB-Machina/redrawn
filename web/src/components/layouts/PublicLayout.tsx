import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Palette, Menu } from "lucide-react";
import { motion } from "motion/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { isAuthenticated, user } = useAuth();

  const navigation = [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'About', href: '/#about' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Palette className="h-4 w-4" />
                </div>
                <span className="font-semibold text-lg">Redrawn</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {user?.credits || 0} credits
                  </span>
                  <Button asChild>
                    <Link href="/app">Open App</Link>
                  </Button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-4">
                  <Button variant="ghost" asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </div>
              )}
              
              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col gap-4 mt-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-lg font-medium"
                      >
                        {item.name}
                      </Link>
                    ))}
                    <div className="border-t pt-4 mt-4">
                      {isAuthenticated ? (
                        <Button asChild className="w-full">
                          <Link href="/app">Open App</Link>
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Button variant="ghost" asChild className="w-full">
                            <Link href="/auth/signin">Sign In</Link>
                          </Button>
                          <Button asChild className="w-full">
                            <Link href="/auth/signup">Get Started</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </header>
      
      <main>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
      
      <footer className="border-t bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Palette className="h-4 w-4" />
                </div>
                <span className="font-semibold text-lg">Redrawn</span>
              </div>
              <p className="text-muted-foreground max-w-md">
                AI-filtered photo albums you can share. Create beautiful, on-brand images 
                and share them with friends and family.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/app" className="hover:text-foreground">App</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Redrawn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
