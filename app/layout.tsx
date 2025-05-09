import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "需求记录",
  description: "需求记录表格",
  generator: 'giunfa',
  icons: {
    icon: [
      {
        url: '/demand-record/favicon.ico',
        sizes: 'any',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
          {children}
          <Toaster />
      </body>
    </html>
  )
}
