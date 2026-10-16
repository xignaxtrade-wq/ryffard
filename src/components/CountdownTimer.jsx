import { useCountdown } from '../hooks'
import { C } from '../constants'

export default function CountdownTimer({ targetDate, dark = false }) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate)

  const units = [
    { value: days,    label: 'Días'    },
    { value: hours,   label: 'Horas'   },
    { value: minutes, label: 'Min'     },
    { value: seconds, label: 'Seg'     },
  ]

  const bg       = dark ? 'rgba(255,255,255,0.15)' : 'rgba(217,11,36,0.08)'
  const textColor = dark ? '#fff' : C.primary
  const labelColor = dark ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)'

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {units.map((u, i) => (
        <div key={i} style={{ background: bg, borderRadius: 12, padding: '10px 14px', textAlign: 'center', minWidth: 58, backdropFilter: 'blur(10px)' }}>
          <div style={{
            fontSize: 22, fontWeight: 800, color: textColor,
            animation: i === 3 ? 'countPulse 1s infinite' : 'none',
          }}>
            {String(u.value).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 10, color: labelColor, fontWeight: 600, marginTop: 2 }}>{u.label}</div>
        </div>
      ))}
    </div>
  )
}
