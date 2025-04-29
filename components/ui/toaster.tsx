"use client"

import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from "@/components/ui/toast"
import { TOAST_REMOVE_DELAY, useToast } from "@/components/ui/use-toast"
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={TOAST_REMOVE_DELAY}>
      {toasts.map(function ({ id, title, description, action, variant, duration, ...props }) {
        // 根据 variant 类型选择对应的图标
        const IconComponent = {
          default: Info,
          destructive: AlertCircle,
          success: CheckCircle2,
          warning: AlertTriangle
        }[variant || 'default']

        // 根据变体决定图标颜色类名
        const iconColorClass = {
          default: "",
          destructive: "",
          success: "text-white", // 黑色背景上使用白色图标
          warning: ""
        }[variant || 'default']

        return (
          <Toast 
            key={id} 
            {...props} 
            variant={variant}
            duration={duration}
          >
            <div className="flex items-start gap-3">
              {IconComponent && (
                <IconComponent className={`h-5 w-5 flex-shrink-0 ${iconColorClass}`} />
              )}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
