'use client';

import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

/**
 * ظاهر شدن هنگام اسکرول
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
  duration = 0.55,
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.09, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 22, scale: 0.98 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.45, ease },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * کارت با hover حرفه‌ای (scale + lift + glow)
 */
export function HoverCard({ children, className }) {
  return (
    <motion.div
      className={className}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.22, ease },
      }}
      whileTap={{ scale: 0.985 }}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className, delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease }}
    >
      {children}
    </motion.div>
  );
}
