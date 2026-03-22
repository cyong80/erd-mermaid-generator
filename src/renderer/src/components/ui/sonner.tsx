import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Liquid Glass 스타일이 적용된 Sonner Toaster.
 * globals.css의 [data-sonner-toast] 선택자로 스타일 적용.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  return (
    <Sonner
      theme={(resolvedTheme ?? "dark") as "light" | "dark" | "system"}
      position="bottom-center"
      offset="3.5rem"
      duration={2800}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 shrink-0" />,
        info: <InfoIcon className="size-4 shrink-0" />,
        warning: <TriangleAlertIcon className="size-4 shrink-0" />,
        error: <OctagonXIcon className="size-4 shrink-0" />,
        loading: <Loader2Icon className="size-4 shrink-0 animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
