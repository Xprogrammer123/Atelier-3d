import QRCode from 'qrcode'

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: { dark: '#2a2118', light: '#faf8f5' },
  })
}

export async function generateQrBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    color: { dark: '#2a2118', light: '#faf8f5' },
  })
}
