import { cn } from "@/lib/utils";

export function VaultLogo({
  className,
  size = 28,
  withText = false,
}: {
  className?: string;
  size?: number;
  withText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="vl-grad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="oklch(0.78 0.19 285)" />
            <stop offset="100%" stopColor="oklch(0.78 0.16 200)" />
          </linearGradient>
          <linearGradient id="vl-grad-2" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="oklch(0.85 0.18 285)" />
            <stop offset="100%" stopColor="oklch(0.85 0.16 200)" />
          </linearGradient>
        </defs>
        <path
          d="M16 2L28 8.5V21.5L16 30L4 21.5V8.5L16 2Z"
          stroke="url(#vl-grad)"
          strokeWidth="1.5"
          fill="oklch(0.16 0.02 265 / 0.5)"
        />
        <circle
          cx="16"
          cy="16"
          r="7"
          stroke="url(#vl-grad-2)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="16" cy="16" r="1.5" fill="url(#vl-grad-2)" />
        <line x1="16" y1="9" x2="16" y2="11.5" stroke="url(#vl-grad-2)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="20.5" x2="16" y2="23" stroke="url(#vl-grad-2)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="9" y1="16" x2="11.5" y2="16" stroke="url(#vl-grad-2)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="20.5" y1="16" x2="23" y2="16" stroke="url(#vl-grad-2)" strokeWidth="1.2" strokeLinecap="round" />
        <path
          d="M11 11L21 21"
          stroke="url(#vl-grad-2)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      {withText && (
        <span className="text-lg font-semibold tracking-tight">
          Vault<span className="gradient-text">Lua</span>
        </span>
      )}
    </div>
  );
}
