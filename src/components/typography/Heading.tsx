import React from 'react'
import { cn } from '@/lib/utils'

interface HeadingProps {
  level?: 1 | 2 | 3 | 4
  className?: string
  children: React.ReactNode
}

const sizeMap: Record<number, string> = {
  1: 'text-3xl font-bold leading-heading tracking-tight',
  2: 'text-2xl font-semibold leading-heading tracking-tight',
  3: 'text-xl font-semibold leading-heading',
  4: 'text-lg font-medium leading-heading',
}

export function Heading({ level = 1, className, children }: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'
  return (
    <Tag className={cn(sizeMap[level], className)}>
      {children}
    </Tag>
  )
}
