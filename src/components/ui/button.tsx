import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "dark" | "onDark" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  // Every variant carries a 2px border, transparent where it is not wanted, so a
  // secondary button is not 3px taller than the primary it sits beside.
  // `transition` (not `transition-[transform]`) because Tailwind v4 emits the
  // independent `translate` property, which a transform-only list never animates.
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-transparent font-medium " +
  "transition duration-200 " +
  "will-change-transform active:translate-y-0 active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-55";

const variants: Record<Variant, string> = {
  // Hover goes lighter, not darker: indigo-on-darker-marigold drops below AA.
  primary:
    "bg-marigold-500 text-bark-900 shadow-soft hover:-translate-y-0.5 hover:bg-marigold-400 hover:shadow-lift",
  secondary:
    "border-bark-900/15 bg-white/70 text-bark-900 backdrop-blur hover:-translate-y-0.5 hover:border-bark-900/30 hover:bg-white hover:shadow-soft",
  ghost: "text-bark-600 hover:bg-bark-900/5 hover:text-bark-900",
  dark: "bg-bark-900 text-bark-50 shadow-soft hover:-translate-y-0.5 hover:bg-bark-800 hover:shadow-lift",
  // For the indigo hero. `secondary` here would composite to pale grey under
  // white text (~1.75:1), so it needs its own surface.
  onDark:
    "border-white/40 bg-white/10 text-white backdrop-blur hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-bark-900",
  // Deleting is not the same shape of act as hiding, so it does not get to look
  // identical. Outlined rather than filled: a wall of solid red buttons in a
  // list reads as an error state instead of a set of choices.
  danger:
    "border-red-300 bg-white text-red-700 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:shadow-soft",
};

const sizes: Record<Size, string> = {
  // Minimums keep every control at a 44px touch target on a phone.
  sm: "min-h-11 px-4 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

type ButtonOwnProps<T extends ElementType> = {
  as?: T;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonOwnProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ButtonOwnProps<T>>) {
  const Component = (as ?? "button") as ElementType;

  return (
    <Component
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
