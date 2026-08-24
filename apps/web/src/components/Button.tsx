import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-accent-strong text-ink shadow-[0_12px_40px_rgb(45_212_191_/_0.28)] hover:brightness-110",
  ghost: "bg-white/6 text-cyan-50 hover:bg-white/10 border border-line",
  danger: "bg-danger/90 text-ink hover:brightness-110",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-14 w-full rounded-2xl px-5 text-base font-semibold tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
