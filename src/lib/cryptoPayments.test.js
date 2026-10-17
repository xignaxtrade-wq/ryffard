import { describe, expect, it } from 'vitest'
import { address, networks } from 'bitcoinjs-lib'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { createCryptoMethod, cryptoPaymentDetails } from './cryptoPayments'
import { paymentMethodError } from './paymentValidation'

// Public test vectors only: none of these addresses is saved as a real recipient.
const btc = '1BoatSLRHtKNngkdXEeobR76b53LETtpyT'
const evm = '0x8ba1f109551bd432803012645ac136ddd64dba72'

describe('crypto receiving wallets', () => {
  it('accepts mainnet legacy, native SegWit and Taproot addresses', () => {
    for (const wallet of [btc, address.toBech32(new Uint8Array(20).fill(1), 0, 'bc'), address.toBech32(new Uint8Array(32).fill(1), 1, 'bc')]) {
      expect(createCryptoMethod('BTC', wallet).details.network).toBe('bitcoin')
    }
  })
  it('rejects testnet and corrupted Bitcoin checksums', () => {
    expect(() => createCryptoMethod('BTC', address.toBase58Check(new Uint8Array(20).fill(1), networks.testnet.pubKeyHash))).toThrow()
    expect(() => createCryptoMethod('BTC', btc.slice(0, -1) + 'U')).toThrow()
    expect(() => createCryptoMethod('BTC', address.toBech32(new Uint8Array(20).fill(1), 0, 'tb'))).toThrow()
  })
  it('normalizes a valid BEP20 reception address using EIP55', () => {
    expect(createCryptoMethod('USDT_BEP20', evm).details).toEqual({ asset: 'USDT', network: 'bep20', wallet_address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72' })
  })
  it('rejects zero addresses, private-key-shaped input and invalid EIP55 checksums', () => {
    for (const wallet of ['0x' + '0'.repeat(40), '0x' + '1'.repeat(64), '0x8Ba1f109551bD432803012645Ac136ddd64DBA72', btc, '']) {
      expect(() => createCryptoMethod('USDT_BEP20', wallet)).toThrow()
    }
  })
  it('does not allow unsupported assets or mismatched networks', () => {
    expect(() => createCryptoMethod('USDT_TRC20', evm)).toThrow()
    expect(cryptoPaymentDetails({ type: 'crypto', details: { asset: 'USDT', network: 'erc20', wallet_address: evm } })).toBeNull()
    expect(paymentMethodError({ name: 'USDT', type: 'crypto', details: {} })).not.toBe('')
  })
  it('prevents duplicate currencies through existing method validation', () => {
    const method = createCryptoMethod('BTC', btc)
    expect(paymentMethodError(method, [method])).not.toBe('')
    expect(paymentMethodError(method)).toBe('')
  })
})

describe('receiving QR round trips', () => {
  for (const [asset, wallet] of [['BTC', btc], ['USDT_BEP20', evm]]) {
    it(`decodes the ${asset} QR to the exact public destination without an invented amount`, () => {
      const payment = cryptoPaymentDetails(createCryptoMethod(asset, wallet))
      const symbol = QRCode.create(payment.qrPayload, { errorCorrectionLevel: 'M' })
      const scale = 4, quiet = 4, size = (symbol.modules.size + quiet * 2) * scale
      const pixels = new Uint8ClampedArray(size * size * 4)
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const row = Math.floor(y / scale) - quiet, col = Math.floor(x / scale) - quiet
        const dark = row >= 0 && col >= 0 && row < symbol.modules.size && col < symbol.modules.size && symbol.modules.get(row, col)
        const index = (y * size + x) * 4
        pixels[index] = pixels[index + 1] = pixels[index + 2] = dark ? 0 : 255
        pixels[index + 3] = 255
      }
      expect(jsQR(pixels, size, size)?.data).toBe(payment.qrPayload)
      expect(payment.qrPayload).toBe(asset === 'BTC' ? `bitcoin:${btc}` : payment.wallet)
      expect(payment.qrPayload).not.toContain('amount=')
    })
  }
})
