import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  size?: "md" | "sm";
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent-strong text-ink",
  ghost: "bg-paper text-ink",
  danger: "bg-coral text-ink",
};

const SIZE_CLASS: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "min-h-14 w-full px-5 text-base",
  sm: "min-h-9 w-auto shrink-0 px-3 text-[11px] tracking-[0.12em]",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`brutal-press border-[3px] border-ink font-bold uppercase shadow-[4px_4px_0_#111] disabled:cursor-not-allowed disabled:opacity-40 ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
