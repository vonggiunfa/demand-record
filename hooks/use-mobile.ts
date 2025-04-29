"use client";

import { useEffect, useState } from "react";

/**
 * 检测当前设备是否为移动设备的钩子
 * @param breakpoint 移动设备的断点宽度，默认为768px
 * @returns 是否为移动设备
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 初始化检测
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // 立即执行一次
    checkIsMobile();

    // 监听窗口大小变化
    window.addEventListener("resize", checkIsMobile);

    // 清理监听器
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
} 