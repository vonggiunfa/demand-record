"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
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
  const [date, setDate] = useState<Date | undefined>(parseYearMonth(value));
  const [open, setOpen] = useState(false);

  // 解析YYYY-MM格式的字符串为Date对象
  function parseYearMonth(yearMonth: string): Date | undefined {
    try {
      const [year, month] = yearMonth.split('-').map(Number);
      if (isNaN(year) || isNaN(month)) return undefined;
      
      const date = new Date();
      date.setFullYear(year);
      date.setMonth(month - 1); // JavaScript月份从0开始
      return date;
    } catch (e) {
      console.error('解析年月失败:', e);
      return undefined;
    }
  }

  // 当日期变化时，触发onChange回调
  useEffect(() => {
    if (date) {
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (yearMonth !== value) {
        onChange(yearMonth);
      }
    }
  }, [date, onChange, value]);

  // 高亮可用月份
  const isDayAvailable = (day: Date): boolean => {
    if (!availableMonths || availableMonths.length === 0) return true;
    
    const yearMonth = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`;
    return availableMonths.includes(yearMonth);
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-between min-w-[240px] text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            {date ? format(date, 'yyyy年MM月') : '请选择年月'}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            onDayClick={(day) => {
              setDate(day);
              setOpen(false);
            }}
            modifiers={{
              available: isDayAvailable,
            }}
            modifiersClassNames={{
              available: "font-semibold text-primary",
            }}
            // 禁用日期视图，只显示月份视图
            showOutsideDays={false}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 