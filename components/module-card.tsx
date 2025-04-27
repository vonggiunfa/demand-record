"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ModuleCardProps {
  title: string
  description: string
  bgColor: string
  icon?: React.ReactNode
}

export function ModuleCard({ title, description, bgColor, icon }: ModuleCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Card
        className="flex flex-col items-center transition-all hover:shadow-md hover:translate-y-[-2px] cursor-pointer overflow-hidden group"
        onClick={() => setIsOpen(true)}
      >
        <div
          className={`${bgColor} text-white w-full aspect-square flex items-center justify-center text-xl font-bold relative`}
        >
          {icon || title}
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </div>
        <div className="p-3 text-center w-full border-t">
          <p className="text-sm font-medium truncate">{description}</p>
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="p-4 flex justify-end">
            <Button onClick={() => setIsOpen(false)}>打开应用</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
