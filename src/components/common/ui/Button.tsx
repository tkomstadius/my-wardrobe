import { Button as BaseButton } from '@base-ui/react/button'
import type { ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'outline' | 'destructive'
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <BaseButton
      type={type}
      className={`${styles.button} ${styles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </BaseButton>
  )
}
