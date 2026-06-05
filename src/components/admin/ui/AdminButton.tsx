import type { CSSProperties, ReactNode } from "react";

interface AdminButtonProps {
  variant?: "primary" | "ghost";
  size?: "default" | "sm";
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  style?: CSSProperties;
}

export function AdminButton({
  variant = "ghost",
  size = "default",
  children,
  className = "",
  disabled,
  type = "button",
  onClick,
  style,
}: AdminButtonProps) {
  const classes = [
    "admin-btn",
    variant === "primary" ? "admin-btn-primary" : "admin-btn-ghost",
    size === "sm" ? "admin-btn-sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}
