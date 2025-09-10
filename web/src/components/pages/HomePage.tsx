import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Upload,
  Palette,
  Share2,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Check,
  Star,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: Upload,
      title: "Easy Upload",
      description:
        "Upload single images, multiple files, or entire .zip archives with drag and drop.",
    },
    {
      icon: Palette,
      title: "AI Themes",
      description:
        "Apply beautiful AI-generated themes to transform your photos with consistent styling.",
    },
    {
      icon: Share2,
      title: "Instant Sharing",
      description:
        "Share albums with custom links, privacy controls, and collaborative features.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description:
        "Get your styled images in seconds with our optimized AI processing pipeline.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "Control who sees your albums with public, unlisted, or invite-only privacy settings.",
    },
    {
      icon: Users,
      title: "Collaboration",
      description:
        "Invite friends and family to contribute photos and generate styles together.",
    },
  ];

  const pricing = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out Redrawn",
      features: [
        "10 free credits",
        "Unlimited albums",
        "Basic themes",
        "Public & unlisted sharing",
      ],
      cta: "Get Started",
      href: "/auth/signup",
      popular: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "month",
      description: "For regular users and creators",
      features: [
        "100 credits per month",
        "Premium themes",
        "Priority processing",
        "Advanced privacy controls",
        "Collaboration features",
      ],
      cta: "Start Pro Trial",
      href: "/auth/signup?plan=pro",
      popular: true,
    },
    {
      name: "Studio",
      price: "$29",
      period: "month",
      description: "For professionals and teams",
      features: [
        "500 credits per month",
        "Custom themes",
        "Team management",
        "API access",
        "Priority support",
      ],
      cta: "Contact Sales",
      href: "/contact",
      popular: false,
    },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-6">
                <Star className="h-3 w-3 mr-1" />
                New • AI-Powered Themes
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                AI‑filtered photo albums{" "}
                <span className="text-primary">you can share</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
                Create an album, apply a theme, and instantly get beautiful,
                on‑brand images to share with friends and family. Each generated
                image costs just 1 credit.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    Get started — 10 free credits
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/app">Open app</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Keep your originals forever. No subscription required.
              </p>
            </motion.div>
          </div>

          {/* Hero Image Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-4xl mx-auto"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-purple-100 to-pink-100" />
            <div className="aspect-[1/1] overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100" />
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-green-100 to-emerald-100" />
            <div className="col-span-2 aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-orange-100 to-red-100" />
            <div className="aspect-[3/2] overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to create stunning albums
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features that make photo sharing beautiful and effortless
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to beautiful, shareable photo albums
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create an album",
                description:
                  "Start a new album for an event or memory. Invite collaborators to contribute.",
              },
              {
                step: "2",
                title: "Upload and choose a theme",
                description:
                  "Upload single images, many at once, or a .zip. Pick a theme per album or image.",
              },
              {
                step: "3",
                title: "Generate and share",
                description:
                  "We generate styled images (1 credit each). Share the album link with anyone.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Pay only for what you use. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className={`h-full relative ${
                    plan.popular ? "border-primary shadow-lg" : ""
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">
                        /{plan.period}
                      </span>
                    </div>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant={plan.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to create beautiful albums?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of users who are already creating stunning photo
              albums with AI-powered themes.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
