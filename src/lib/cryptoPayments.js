import { address as bitcoinAddress, networks } from 'bitcoinjs-lib'
import { getAddress } from 'ethers/address'

export const CRYPTO_ASSETS = [
  { id: 'BTC', name: 'Bitcoin (BTC)', asset: 'BTC', network: 'bitcoin', networkLabel: 'Bitcoin' },
  { id: 'USDT_BEP20', name: 'USDT (BEP20)', asset: 'USDT', network: 'bep20', networkLabel: 'BNB Smart Chain (BEP20)' },
]

function normalizedAddress(asset, input) {
  const wallet = input.trim()
  if (asset.id === 'BTC') {
    if (/^bc1/i.test(wallet)) {
      const decoded = bitcoinAddress.fromBech32(wallet)
      if (decoded.prefix !== 'bc' || !(
        (decoded.version === 0 && [20, 32].includes(decoded.data.length)) ||
        (decoded.version === 1 && decoded.data.length === 32)
      )) throw new Error('Invalid Bitcoin witness address')
      return wallet.toLowerCase()
    }
    const decoded = bitcoinAddress.fromBase58Check(wallet)
    if (![networks.bitcoin.pubKeyHash, networks.bitcoin.scriptHash].includes(decoded.version)) {
      throw new Error('Bitcoin mainnet required')
    }
    return wallet
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) throw new Error('Invalid EVM address')
  const canonical = getAddress(wallet)
  if (canonical === '0x0000000000000000000000000000000000000000') throw new Error('Zero address')
  return canonical
}

export function createCryptoMethod(assetId, walletAddress) {
  const asset = CRYPTO_ASSETS.find(option => option.id === assetId)
  if (!asset) throw new Error('Selecciona Bitcoin o USDT BEP20')
  let wallet
  try { wallet = normalizedAddress(asset, walletAddress) } catch {
    throw new Error(asset.id === 'BTC'
      ? 'Introduce una wallet v\u00e1lida de Bitcoin, red principal'
      : 'Introduce una direcci\u00f3n p\u00fablica 0x v\u00e1lida para USDT BEP20')
  }
  return { name: asset.name, type: 'crypto', details: { asset: asset.asset, network: asset.network, wallet_address: wallet } }
}

export function cryptoPaymentDetails(method) {
  if (method?.type !== 'crypto') return null
  const asset = CRYPTO_ASSETS.find(option => option.asset === method.details?.asset && option.network === method.details?.network)
  if (!asset) return null
  try {
    const normalized = createCryptoMethod(asset.id, method.details.wallet_address)
    const wallet = normalized.details.wallet_address
    return { ...asset, wallet, qrPayload: asset.id === 'BTC' ? `bitcoin:${wallet}` : wallet }
  } catch { return null }
}
