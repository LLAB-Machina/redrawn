import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VerifyPage() {
  const router = useRouter();
  const { token } = router.query as { token: string };
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );

  useEffect(() => {
    const handleVerify = async () => {
      if (!token) return;

      try {
        // Make direct API call to verify endpoint
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await fetch(`${apiUrl}/v1/auth/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus("success");
          toast.success("Successfully signed in!");

          // Redirect to app after a short delay
          setTimeout(() => {
            router.push("/app");
          }, 2000);
        } else {
          throw new Error("Verification failed");
        }
      } catch {
        setStatus("error");
        toast.error("Invalid or expired verification link");
      }
    };

    if (token) {
      handleVerify();
    }
  }, [token, router]);

  const getStatusContent = () => {
    switch (status) {
      case "verifying":
        return {
          icon: <Loader2 className="h-12 w-12 text-primary animate-spin" />,
          title: "Verifying your account",
          description: "Please wait while we verify your magic link...",
          action: null,
        };
      case "success":
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Verification successful!",
          description:
            "You've been successfully signed in. Redirecting to your dashboard...",
          action: (
            <Button onClick={() => router.push("/app")}>Go to Dashboard</Button>
          ),
        };
      case "error":
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: "Verification failed",
          description:
            "The verification link is invalid or has expired. Please request a new one.",
          action: (
            <Button onClick={() => router.push("/auth/signin")}>
              Back to Sign In
            </Button>
          ),
        };
    }
  };

  const content = getStatusContent();

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">{content.icon}</div>
              <CardTitle className="text-2xl">{content.title}</CardTitle>
              <CardDescription>{content.description}</CardDescription>
            </CardHeader>
            {content.action && (
              <CardContent className="text-center">
                {content.action}
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
