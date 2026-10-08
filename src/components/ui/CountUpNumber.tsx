import React, { useEffect, useRef, useState } from "react"

interface CountUpProps {
  start?: number
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export const CountUpNumber: React.FC<CountUpProps> = ({
  start = 0,
  end,
  duration = 1400,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}) => {
  const [value, setValue] = useState(start)
  const ref = useRef<HTMLSpanElement | null>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = performance.now()

          const tick = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = start + (end - start) * eased
            setValue(current)

            if (progress < 1) {
              requestAnimationFrame(tick)
            } else {
              setValue(end)
            }
          }

          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [start, end, duration])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

export default CountUpNumber
