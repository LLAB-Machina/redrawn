import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface LoadingBarProps {
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

export function LoadingBar({
  duration = 30,
  className,
  onComplete,
}: LoadingBarProps) {
  return (
    <div className={cn("w-full bg-muted rounded-full h-2", className)}>
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{
          duration,
          ease: "linear",
        }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}
