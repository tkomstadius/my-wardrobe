import type { ReactNode } from 'react'
import styles from './Callout.module.css'

interface CalloutRootProps {
  children: ReactNode
  variant?: 'default' | 'outline'
  className?: string
}

export function Callout({ children, className, variant = 'default' }: CalloutRootProps) {
  return (
    <div className={`${styles.callout} ${styles[variant]} ${className || ''}`}>
      <p>{children}</p>
    </div>
  )
}
