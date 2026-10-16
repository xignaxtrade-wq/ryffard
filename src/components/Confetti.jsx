import { useEffect, useState } from 'react'

const COLORS = ['#D90B24', '#004BCC', '#FFC400', '#ffc107', '#00c853', '#ff9800']

export default function Confetti({ active }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!active) { setParticles([]); return }
    setParticles(Array.from({ length: 80 }, (_, i) => ({
      id:     i,
      left:   Math.random() * 100,
      top:    40 + Math.random() * 20,
      color:  COLORS[i % COLORS.length],
      size:   Math.random() * 12 + 5,
      circle: Math.random() > 0.5,
      delay:  Math.random() * 0.6,
      dur:    1 + Math.random() * 1.5,
    })))
  }, [active])

  if (!active) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          top:  `${p.top}%`,
          left: `${p.left}%`,
          width:  p.size,
          height: p.size,
          borderRadius: p.circle ? '50%' : 2,
          background: p.color,
          animation: `confetti ${p.dur}s ease-out forwards`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  )
}
