import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { cryptoPaymentDetails } from '../lib/cryptoPayments'

export default function CryptoPaymentDetails({ method, compact = false }) {
  const payment = cryptoPaymentDetails(method)
  const payload = payment?.qrPayload || ''
  const [qr, setQr] = useState({ payload: '', image: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    setMessage('')
    if (payload) QRCode.toDataURL(payload, { width: 220, margin: 2, errorCorrectionLevel: 'M' })
      .then(image => { if (!cancelled) setQr({ payload, image }) })
      .catch(() => { if (!cancelled) setMessage('No se pudo generar el QR') })
    return () => { cancelled = true }
  }, [payload])

  if (!payment) return <p role="alert" style={{ color: '#b42318' }}>{'Wallet o red no v\u00e1lida. No env\u00edes fondos.'}</p>

  async function copyWallet() {
    try {
      await navigator.clipboard.writeText(payment.wallet)
      setMessage('Direcci\u00f3n copiada')
    } catch { setMessage('No se pudo copiar la direcci\u00f3n') }
  }

  const size = compact ? 128 : 176
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', marginTop: 12, minWidth: 0 }}>
      <div style={{ width: size, height: size, maxWidth: '100%', flexShrink: 0, background: '#fff', display: 'grid', placeItems: 'center' }}>
        {qr.payload === payload && qr.image && <img src={qr.image} alt={`QR de recepci\u00f3n ${payment.name}`} width={size} height={size} style={{ maxWidth: '100%', height: 'auto' }} />}
      </div>
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <strong style={{ display: 'block' }}>{payment.name}</strong>
        <div style={{ margin: '6px 0', fontWeight: 700 }}>Red: {payment.networkLabel}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <code style={{ overflowWrap: 'anywhere', wordBreak: 'break-all', flex: 1, minWidth: 0 }}>{payment.wallet}</code>
          <button type="button" onClick={copyWallet} title={'Copiar direcci\u00f3n'} aria-label={'Copiar direcci\u00f3n'} style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--dark)' }}><i className="fas fa-copy" /></button>
        </div>
        <p style={{ fontSize: 12, margin: '10px 0 0', color: 'var(--text-secondary)' }}>Solo {payment.asset}{' en la red indicada. Confirmaci\u00f3n manual.'}</p>
        {!compact && <p style={{ fontSize: 12, margin: '8px 0 0', color: 'var(--text-secondary)' }}>{'Precio en RD$. Importe cripto a acordar con el organizador, sin conversi\u00f3n autom\u00e1tica.'}</p>}
        {message && <p role="status" style={{ fontSize: 12, marginTop: 8 }}>{message}</p>}
      </div>
    </div>
  )
}
