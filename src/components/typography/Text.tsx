import React from 'react'
import { cn } from '@/lib/utils'

interface TextProps {
  size?: 'sm' | 'body' | 'base' | 'lg'
  muted?: boolean
  className?: string
  children: React.ReactNode
}

const sizeMap: Record<string, string> = {
  sm: 'text-sm leading-body',
  body: 'text-body leading-body',
  base: 'text-base leading-body',
  lg: 'text-lg leading-body',
}

export function Text({ size = 'body', muted = false, className, children }: TextProps) {
  return (
    <p className={cn(sizeMap[size], muted && 'text-muted-foreground', className)}>
      {children}
    </p>
  )
}
