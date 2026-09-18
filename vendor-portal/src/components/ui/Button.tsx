import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-700",
  secondary: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

// Also used on <Link> so navigation links look like buttons.
export const buttonClass = (variant: Variant = "primary") =>
  `inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", type = "button", className = "", ...props }: ButtonProps) {
  return <button type={type} className={`${buttonClass(variant)} ${className}`} {...props} />;
}
