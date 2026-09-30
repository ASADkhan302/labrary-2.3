import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { playClickSound } from "@/services/audio"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[14px] font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-[0.97] active:duration-[80ms] disabled:pointer-events-none disabled:opacity-60 select-none cursor-pointer overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold border-none shadow-[0_1px_2px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(37,99,235,0.28)]",
        primary:
          "bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold border-none shadow-[0_1px_2px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(37,99,235,0.28)]",
        secondary:
          "bg-transparent border border-[var(--border-control)] text-[var(--text-primary)] hover:bg-[var(--overlay-hover)]",
        outline:
          "bg-transparent border border-[var(--border-control)] text-[var(--text-primary)] hover:bg-[var(--overlay-hover)]",
        destructive:
          "bg-rose-500/15 hover:bg-rose-500/25 text-[#FCA5A5] dark:text-[#FCA5A5] light:bg-[#FEE2E2] light:text-[#991B1B] border border-rose-500/30 font-semibold hover:-translate-y-[1px]",
        danger:
          "bg-rose-500/15 hover:bg-rose-500/25 text-[#FCA5A5] dark:text-[#FCA5A5] light:bg-[#FEE2E2] light:text-[#991B1B] border border-rose-500/30 font-semibold hover:-translate-y-[1px]",
        ghost:
          "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-hover)] border-none",
        link:
          "text-[var(--text-accent)] underline-offset-4 hover:underline p-0 h-auto border-none",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-[12px]",
        compact: "h-8 px-3 text-[12px]",
        lg: "h-10 px-6",
        icon: "h-8 w-8 min-w-[32px] p-0 hover:scale-[1.08] transition-transform duration-150",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  success?: boolean
  playSound?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      success = false,
      playSound = true,
      children,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading
    const buttonRef = React.useRef<HTMLButtonElement | null>(null)
    const [fixedWidth, setFixedWidth] = React.useState<number | undefined>(undefined)

    // Preserve width during loading / success state to prevent CLS
    React.useEffect(() => {
      if (loading || success) {
        if (buttonRef.current && !fixedWidth) {
          setFixedWidth(buttonRef.current.offsetWidth)
        }
      } else {
        setFixedWidth(undefined)
      }
    }, [loading, success])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (playSound && !disabled && !loading) {
        try {
          playClickSound()
        } catch {
          // ignore
        }
      }

      // Soft radial ripple animation from click point
      const btn = e.currentTarget
      if (btn) {
        const rect = btn.getBoundingClientRect()
        const ripple = document.createElement("span")
        const diameter = Math.max(rect.width, rect.height) * 1.5
        const radius = diameter / 2
        ripple.className = "btn-ripple-wave"
        ripple.style.width = `${diameter}px`
        ripple.style.height = `${diameter}px`
        ripple.style.left = `${e.clientX - rect.left - radius}px`
        ripple.style.top = `${e.clientY - rect.top - radius}px`
        btn.appendChild(ripple)
        setTimeout(() => {
          ripple.remove()
        }, 400)
      }

      if (onClick) {
        onClick(e)
      }
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={(node) => {
          buttonRef.current = node as HTMLButtonElement | null
          if (typeof ref === "function") {
            ref(node)
          } else if (ref) {
            ;(ref as React.MutableRefObject<HTMLButtonElement | null>).current = node as HTMLButtonElement | null
          }
        }}
        disabled={isDisabled}
        onClick={handleClick}
        style={{
          width: fixedWidth ? `${fixedWidth}px` : undefined,
          ...props.style,
        }}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span className="text-[12px] font-medium">Processing...</span>
          </span>
        ) : success ? (
          <span className="inline-flex items-center justify-center gap-1.5 text-emerald-400 font-semibold animate-in zoom-in-75 duration-200">
            <Check className="w-4 h-4 stroke-[3]" />
            <span className="text-[12px]">Success</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
