import React from "react";

type CardProps = React.PropsWithChildren<{
  className?: string;
  title?: string;
  description?: string;
}>;

export default function Card({
  className,
  title,
  description,
  children,
}: CardProps) {
  return (
    <div className={["card", className].filter(Boolean).join(" ")}>
      {(title || description) && (
        <div className="mb-3 space-y-1">
          {title && (
            <div className="text-sm font-semibold tracking-tight">{title}</div>
          )}
          {description && (
            <div className="text-sm text-neutral-600">{description}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
