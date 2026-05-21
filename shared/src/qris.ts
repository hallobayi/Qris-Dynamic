// Pure utilities for converting a static QRIS payload into a dynamic one.
// Used by both the server (POST /api/qris/dynamic) and the client (optimistic UI).

export function crc16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export class QrisError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QrisError'
  }
}

export function generateDynamicQris(staticQris: string, amount: number | string): string {
  if (!staticQris || staticQris.length < 8) {
    throw new QrisError('QRIS payload is too short to be valid')
  }
  const amountStr = String(amount).replace(/\D/g, '')
  if (!amountStr || Number(amountStr) <= 0) {
    throw new QrisError('Amount must be a positive integer')
  }

  // Strip trailing CRC (last 4 chars) and flip static->dynamic point-of-init flag.
  let qris = staticQris.slice(0, -4).replace('010211', '010212')

  // Insert amount tag (54) right before merchant country tag (5802ID).
  const parts = qris.split('5802ID')
  if (parts.length !== 2) {
    throw new QrisError('QRIS payload is missing the 5802ID country tag')
  }
  const amountTag = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}5802ID`
  const finalQris = parts[0] + amountTag + parts[1]

  return finalQris + crc16(finalQris)
}
