"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from 'react';

interface MonthYearPickerProps {
  value: string; // 格式: "YYYY-MM"
  onChange: (value: string) => void;
  availableMonths?: string[]; // 可选的可用月份列表
  className?: string;
}

export default function MonthYearPicker({
  value,
  onChange,
  availableMonths = [],
  className
}: MonthYearPickerProps) {
  const [currentYear, setCurrentYear] = useState<number>(parseInt(value.split('-')[0]));
  const [currentMonth, setCurrentMonth] = useState<number>(parseInt(value.split('-')[1]));
  const [open, setOpen] = useState(false);

  // 当年月变化时，触发onChange回调
  useEffect(() => {
    const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    if (yearMonth !== value) {
      onChange(yearMonth);
    }
  }, [currentYear, currentMonth, onChange, value]);

  // 处理前一年
  const handlePrevYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  // 处理后一年
  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  // 判断月份是否可用
  const isMonthAvailable = (year: number, month: number): boolean => {
    if (!availableMonths || availableMonths.length === 0) return true;
    
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    return availableMonths.includes(yearMonth);
  };

  // 选择月份
  const handleSelectMonth = (month: number) => {
    setCurrentMonth(month);
    setOpen(false);
  };

  // 月份名称数组
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-between text-left font-normal",
            )}
          >
            {`${currentYear}年${String(currentMonth).padStart(2, '0')}月`}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            {/* 年份选择器带箭头 */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevYear}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-medium text-center">{currentYear}年</div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextYear}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 月份网格 */}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const isAvailable = isMonthAvailable(currentYear, month);
                const isSelected = month === currentMonth && value.split('-')[0] === currentYear.toString();
                
                return (
                  <Button
                    key={month}
                    onClick={() => handleSelectMonth(month)}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "h-9",
                      !isAvailable && "opacity-50 cursor-not-allowed",
                      isAvailable && !isSelected && "hover:bg-muted",
                    )}
                    disabled={!isAvailable}
                  >
                    {monthNames[month - 1]}
                  </Button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 