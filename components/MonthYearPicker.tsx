"use client"

import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface MonthYearPickerProps {
  value: Date
  onChange: (date: Date) => void
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [apiBasePath, setApiBasePath] = useState('/demand-record')
  
  // 获取可用月份列表
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        // 首先尝试使用带basePath的URL
        let apiUrl = `${apiBasePath}/api/months`
        let response = await fetch(apiUrl)
        
        // 如果是404错误，尝试不带basePath的URL
        if (response.status === 404) {
          apiUrl = '/api/months'
          response = await fetch(apiUrl)
          
          // 如果成功，更新apiBasePath
          if (response.ok) {
            setApiBasePath('')
          }
        }
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.months)) {
            setAvailableMonths(data.months)
          }
        }
      } catch (error) {
        console.error('获取可用月份失败', error)
      }
    }
    
    fetchAvailableMonths()
  }, [apiBasePath])
  
  // 处理上一个月按钮点击
  const handlePrevMonth = () => {
    const prevMonth = new Date(value)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    onChange(prevMonth)
  }

  // 处理下一个月按钮点击
  const handleNextMonth = () => {
    const nextMonth = new Date(value)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    onChange(nextMonth)
  }

  // 处理日历选择变化
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      // 保持日期为1日，只使用年和月
      const selectedDate = new Date(date)
      selectedDate.setDate(1)
      onChange(selectedDate)
      setOpen(false)
    }
  }

  // 检查某个日期是否为可用月份
  const isAvailableMonth = (date: Date) => {
    const monthStr = format(date, 'yyyy-MM')
    return availableMonths.includes(monthStr)
  }

  // 自定义日期渲染，为可用月份添加标记
  const renderDay = (day: Date) => {
    const isAvailable = isAvailableMonth(day)
    return (
      <div className="relative h-9 w-9 p-0 flex items-center justify-center">
        <div>{day.getDate()}</div>
        {isAvailable && (
          <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[140px] justify-start text-left font-normal h-8",
              isAvailableMonth(value) && "border-blue-300 bg-blue-50 text-blue-600"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>{format(value, 'yyyy年MM月', { locale: zhCN })}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            initialFocus
            locale={zhCN}
            showOutsideDays={false}
            formatters={{
              formatCaption: (date, options) => format(date, 'yyyy年MM月', { locale: options?.locale }),
            }}
            modifiers={{
              highlighted: date => isAvailableMonth(date),
            }}
            modifiersClassNames={{
              highlighted: "bg-blue-50",
            }}
          />
          {availableMonths.length > 0 && (
            <div className="p-3 text-xs text-muted-foreground border-t">
              带<span className="inline-block h-1 w-1 bg-blue-500 rounded-full mx-1" />
              标记的月份已有数据
            </div>
          )}
        </PopoverContent>
      </Popover>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default MonthYearPicker 