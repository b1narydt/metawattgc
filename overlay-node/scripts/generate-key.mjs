import { randomBytes, createHash } from 'crypto'

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Encode(buffer) {
  let x = BigInt('0x' + buffer.toString('hex'))
  const base = BigInt(58)
  let answer = ''
  while (x > 0n) {
    const mod = x % base
    answer = BASE58_ALPHABET[Number(mod)] + answer
    x = x / base
  }
  // leading zeros
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    answer = '1' + answer
  }
  return answer
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest()
}

function toWIF(privHex, network = 'main', compressed = true) {
  const version = network === 'test' ? 0xEF : 0x80
  const priv = Buffer.from(privHex, 'hex')
  const payload = Buffer.concat([
    Buffer.from([version]),
    priv,
    ...(compressed ? [Buffer.from([0x01])] : [])
  ])
  const checksum = sha256(sha256(payload)).subarray(0, 4)
  const wif = base58Encode(Buffer.concat([payload, checksum]))
  return wif
}

function isValid32Bytes(hex) {
  return /^[0-9a-fA-F]{64}$/.test(hex)
}

const network = process.env.NETWORK === 'test' ? 'test' : 'main'
let entropy = randomBytes(32).toString('hex')
if (!isValid32Bytes(entropy)) {
  throw new Error('Failed to generate 32 bytes of entropy')
}
const wif = toWIF(entropy, network, true)

console.log(JSON.stringify({ network, wif, hex: entropy }, null, 2))
