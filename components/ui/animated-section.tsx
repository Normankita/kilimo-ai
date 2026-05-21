'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'none'
  className?: string
}

export default function AnimatedSection({ children, delay = 0, direction = 'up', className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const reduced = useReducedMotion()

  const initial = reduced
    ? {}
    : direction === 'up'    ? { opacity: 0, y: 16 }
    : direction === 'left'  ? { opacity: 0, x: -20 }
    : direction === 'right' ? { opacity: 0, x: 20 }
    : { opacity: 0 }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView || reduced ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
