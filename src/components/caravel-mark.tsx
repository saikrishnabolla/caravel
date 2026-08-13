import { cn } from "@/lib/utils";

export function CaravelMark({ className, title = "Caravel" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label={title}
      className={cn("size-10 shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#161d1d" stroke="#343c3c" strokeWidth="2" />
      <path
        d="M12 29V11H21.5C26.2 11 29 13.5 29 17.3C29 21.1 26.2 23.5 21.5 23.5H12M21.5 23.5L29 30.5"
        fill="none"
        stroke="#fffb66"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16.5 17.3H22.5" fill="none" stroke="#b9f4ee" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
