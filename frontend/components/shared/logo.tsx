import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "light"
}

export function Logo({ className, showText = true, size = "md", variant = "default" }: LogoProps) {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-lg" },
    md: { icon: "h-8 w-8", text: "text-xl" },
    lg: { icon: "h-10 w-10", text: "text-2xl" },
  }

  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative overflow-hidden rounded-md", sizes[size].icon)}>
        <Image
          src="/logo.jpeg"
          alt="College Logo"
          fill
          className="object-cover"
        />
      </div>
      {showText && (
        <span className={cn(
          "font-bold tracking-tight",
          variant === "light" ? "text-white" : "text-foreground",
          sizes[size].text
        )}>
          PARAM
        </span>
      )}
    </Link>
  )
}
