import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-lg" },
    md: { icon: "h-8 w-8", text: "text-xl" },
    lg: { icon: "h-10 w-10", text: "text-2xl" },
  }

  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold",
          sizes[size].icon,
        )}
      >
        <span className="text-sm">P</span>
      </div>
      {showText && <span className={cn("font-bold tracking-tight text-foreground", sizes[size].text)}>PARAM</span>}
    </Link>
  )
}
