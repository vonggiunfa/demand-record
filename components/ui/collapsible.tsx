"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { forwardRef } from "react"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden"
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleContent>
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
