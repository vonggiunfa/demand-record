"use client"

import React, { ChangeEvent, forwardRef, useEffect, useState } from 'react';

// 格式化金额
export const formatMoney = (value: string): string => {
  if (!value) return '';
  
  // 移除所有非数字、非小数点字符
  const cleanValue = value.replace(/[^\d.-]/g, '');
  
  // 处理格式
  let formattedValue = cleanValue;
  
  // 分隔千位
  const parts = formattedValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
};

// 判断是否为负值
export const isNegativeValue = (value: string): boolean => {
  if (!value) return false;
  return value.trim().startsWith('-');
};

// 加法
export const sum = (values: Array<string | undefined>): string => {
  // 过滤掉空值
  const validValues = values.filter(value => value !== undefined && value !== '') as string[];
  
  if (validValues.length === 0) return '';
  
  // 计算总和
  return validValues.reduce((acc, curr) => {
    const a = parseFloat(acc.toString().replace(/,/g, '')) || 0;
    const b = parseFloat(curr.toString().replace(/,/g, '')) || 0;
    return (a + b).toString();
  }, '0');
};

// 减法
export const subtract = (a: string, b: string): string => {
  if (!a || !b) return '';
  
  const numA = parseFloat(a.toString().replace(/,/g, '')) || 0;
  const numB = parseFloat(b.toString().replace(/,/g, '')) || 0;
  
  return (numA - numB).toString();
};

// 除法
export const divide = (a: string, b: string): string => {
  if (!a || !b) return '';
  
  const numA = parseFloat(a.toString().replace(/,/g, '')) || 0;
  const numB = parseFloat(b.toString().replace(/,/g, '')) || 0;
  
  if (numB === 0) return '';
  
  // 保留2位小数
  return (numA / numB).toFixed(2);
};

// 货币输入组件
interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isNegative?: boolean;
}

const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  isNegative
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  
  // 当外部值变化时更新显示值
  useEffect(() => {
    if (value === displayValue) return;
    
    // 格式化显示值
    setDisplayValue(value ? formatMoney(value) : '');
  }, [value]);
  
  // 处理输入变化
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // 移除所有非数字、非小数点、非负号字符
    const cleanValue = inputValue.replace(/[^\d.-]/g, '');
    
    // 更新显示值
    setDisplayValue(inputValue);
    
    // 更新实际值
    onChange(cleanValue);
  };
  
  // 失去焦点时格式化显示
  const handleBlur = () => {
    // 格式化显示值
    if (value) {
      setDisplayValue(formatMoney(value));
    }
    
    // 调用外部onBlur
    onBlur?.();
  };
  
  return (
    <input
      ref={ref}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`w-full h-full px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNegative ? 'text-red-500' : ''}`}
    />
  );
});

MoneyInput.displayName = 'MoneyInput';

export default MoneyInput; 