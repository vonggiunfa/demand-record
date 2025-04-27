"use client"

import { ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  // 监听滚动事件，当页面滚动超过 300px 时显示按钮
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // 滚动到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 h-auto rounded-full shadow-lg bg-primary hover:bg-primary/90"
          aria-label="返回顶部"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </>
  )
} 