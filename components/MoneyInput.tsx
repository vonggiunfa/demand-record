"use client"

import { Input } from "@/components/ui/input"
import Dinero from "dinero.js"
import { ChangeEvent, FocusEvent, forwardRef, InputHTMLAttributes, useEffect, useState } from "react"

// 设置Dinero的默认货币和精度
Dinero.defaultCurrency = "CNY"
Dinero.defaultPrecision = 2

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  isNegative?: boolean
}

// 将字符串转换为Dinero对象
export const stringToDinero = (value: string) => {
  if (!value || value === '') return Dinero({ amount: 0 })
  
  try {
    // 移除非数字和小数点
    const cleanValue = value.replace(/[^\d.-]/g, '')
    // 处理负号
    const isNegative = cleanValue.startsWith('-')
    // 处理为整数（以分为单位）
    const amount = Math.round(Math.abs(parseFloat(cleanValue)) * 100)
    return Dinero({ amount: isNaN(amount) ? 0 : (isNegative ? -amount : amount) })
  } catch (error) {
    console.error('Error converting string to Dinero:', error)
    return Dinero({ amount: 0 })
  }
}

// 将Dinero对象转换为格式化后的字符串
export const dineroToString = (money: ReturnType<typeof Dinero>, format: boolean = false): string => {
  if (money.getAmount() === 0) return ''
  
  if (format) {
    // 区分正负值的格式化
    if (money.getAmount() < 0) {
      // 创建一个正值Dinero对象用于格式化，然后手动添加负号
      const positiveMoney = Dinero({ amount: Math.abs(money.getAmount()) })
      return `-${positiveMoney.toFormat('¥0,0.00')}`
    }
    return money.toFormat('¥0,0.00')
  }
  
  return (money.getAmount() / 100).toString()
}

// 将Dinero对象转换为数字
export const dineroToNumber = (money: ReturnType<typeof Dinero>): number => {
  return money.getAmount() / 100
}

// 将数字转换为Dinero对象
export const numberToDinero = (value: number) => {
  return Dinero({ amount: Math.round(value * 100) })
}

// 判断是否是负数
export const isNegativeValue = (value: string): boolean => {
  if (!value) return false
  const dinero = stringToDinero(value)
  return dinero.getAmount() < 0
}

// 加法
export const add = (a: string, b: string): string => {
  const aDinero = stringToDinero(a)
  const bDinero = stringToDinero(b)
  return dineroToString(aDinero.add(bDinero))
}

// 减法
export const subtract = (a: string, b: string): string => {
  const aDinero = stringToDinero(a)
  const bDinero = stringToDinero(b)
  return dineroToString(aDinero.subtract(bDinero))
}

// 除法
export const divide = (a: string, b: string): string => {
  if (!b || parseFloat(b) === 0) return ''
  
  const aDinero = stringToDinero(a)
  const value = dineroToNumber(aDinero) / parseFloat(b)
  return isNaN(value) ? '' : value.toFixed(2)
}

// 总和
export const sum = (values: string[]): string => {
  if (!values.length) return ''
  
  let result = Dinero({ amount: 0 })
  
  for (const value of values) {
    result = result.add(stringToDinero(value))
  }
  
  return dineroToString(result)
}

// 格式化显示
export const formatMoney = (value: string): string => {
  if (!value) return ''
  return dineroToString(stringToDinero(value), true)
}

// 货币输入组件
const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, onBlur, isNegative, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')

    // 处理输入变化
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      
      // 清空输入
      if (!newValue) {
        setDisplayValue('')
        onChange('')
        return
      }
      
      // 允许数字、小数点和负号（只能在开头）
      const regex = /^-?[0-9]*\.?[0-9]*$/
      if (regex.test(newValue)) {
        setDisplayValue(newValue)
        onChange(newValue)
      }
    }

    // 处理失焦事件
    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      // 格式化数值（如果需要）
      if (value) {
        const dinero = stringToDinero(value)
        setDisplayValue(dineroToString(dinero))
      }
      
      if (onBlur) {
        onBlur(e)
      }
    }

    // 同步外部传入的值
    useEffect(() => {
      setDisplayValue(value)
    }, [value])

    const negativeStyling = isNegative 
      ? 'bg-red-100 border-red-300 text-red-700 font-semibold focus-visible:ring-red-400 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' 
      : ''

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`text-center ${negativeStyling} ${className || ''}`}
        {...props}
      />
    )
  }
)

MoneyInput.displayName = 'MoneyInput'

export default MoneyInput 