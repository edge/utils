// Copyright (C) 2021 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import SHA256 from 'crypto-js/sha256.js'
import elliptic from 'elliptic'
import sha3 from 'js-sha3'

const { keccak256 } = sha3
const ec = new elliptic.ec('secp256k1')

/**
 * Generates a new key pair
 * @returns {elliptic.ec.KeyPair} The generated key pair
 */
function generateKeyPair() {
  return ec.genKeyPair()
}

/**
 * Generates a new wallet
 * @returns {Wallet} The generated wallet
 */
function generateWallet() {
  const keyPair = generateKeyPair()
  const privateKey = keyPair.getPrivate('hex').toString()
  const publicKey = keyPair.getPublic(true, 'hex').toString()
  const address = publicKeyToChecksumAddress(publicKey)
  return { privateKey, publicKey, address }
}

/**
 * Generates a checksummed address from a public key
 * @param {string} address - The public key
 * @returns {string} The checksummed address
 */
function generateChecksumAddress(address) {
  const addr = address.slice(3)
  const addrHash = keccak256(addr.toLowerCase())

  let chkAddr = ''
  for (let i = 0; i < addr.length; i++) {
    if (parseInt(addrHash[i], 16) >= 8) chkAddr += addr[i].toUpperCase()
    else chkAddr += addr[i]
  }

  return `xe_${chkAddr}`
}

/**
 * Checks if an address is valid
 * @param {string} address - The address to validate
 * @returns {boolean} True if the address is valid, false otherwise
 */
function checksumAddressIsValid(address) {
  if (!/^(xe_[a-fA-F0-9]{40})$/.test(address)) return false
  if (address !== generateChecksumAddress(address)) return false
  return true
}

/**
 * Restores a wallet from a private key
 * @param {PrivateKey} privateKey - The private key
 * @returns {Wallet} The restored wallet
 */
function restoreWalletFromPrivateKey(privateKey) {
  const keyPair = ec.keyFromPrivate(privateKey)
  const publicKey = keyPair.getPublic(true, 'hex').toString()
  const address = publicKeyToChecksumAddress(publicKey)
  return { privateKey, publicKey, address }
}

/**
 * Converts a public key to a checksummed address
 * @param {string} publicKey - The public key
 * @returns {string} The checksummed address
 */
function publicKeyToChecksumAddress(publicKey) {
  const hash = keccak256(publicKey)
  const addr = 'xe_' + hash.substring(hash.length - 40, hash.length)
  return generateChecksumAddress(addr)
}

/**
 * Converts a private key to a public key
 * @param {PrivateKey} privateKey - The private key
 * @returns {string} The public key
 */
function privateKeyToPublicKey(privateKey) {
  return ec.keyFromPrivate(privateKey, 'hex').getPublic(true, 'hex')
}

/**
 * Converts a private key to a checksummed address
 * @param {PrivateKey} privateKey - The private key
 * @returns {string} The checksummed address
 */
function privateKeyToChecksumAddress(privateKey) {
  const publicKey = privateKeyToPublicKey(privateKey)
  return publicKeyToChecksumAddress(publicKey)
}

/**
 * Converts microXE to human-readable format
 * @param {number} mxe - The microXE value
 * @param {boolean} format - Whether to format the value with commas
 * @returns {string} The formatted value
 */
function xeStringFromMicroXe(mxe, format) {
  const s = mxe.toString()
  const fraction = s.substr(-6, 6).padStart(6, '0')
  let whole = s.substr(0, s.length - 6) || '0'
  if (format) whole = parseInt(whole).toLocaleString('en-US')
  return `${whole}.${fraction}`
}

/**
 * Converts human-readable format to microXE
 * @param {string | number} xe - The human-readable value
 * @returns {number} The microXE value
 */
function toMicroXe(xe) {
  const s = typeof xe === 'number' ? xe.toString() : xe
  const parts = s.split('.')
  const whole = parts[0]
  const fraction = parts.length > 1 ? parts[1].padEnd(6, '0') : '000000'
  return parseInt(`${whole}${fraction}`)
}

/**
 * Formats a human-readable value
 * @param {string | number} xe - The human-readable value
 * @param {boolean} format - Whether to format the value with commas
 * @returns {string} The formatted value
 */
function formatXe(xe, format) {
  const mxe = toMicroXe(xe)
  return xeStringFromMicroXe(mxe, format)
}

/**
 * Generates a signature for a message
 * @param {PrivateKey} privateKey - The private key
 * @param {string} msg - The message
 * @returns {string} The signature
 */
function generateSignature(privateKey, msg) {
  const msgHash = SHA256(msg).toString()
  const msgHashByteArray = elliptic.utils.toArray(msgHash, 'hex')
  const signatureObj = ec.sign(msgHashByteArray, ec.keyFromPrivate(privateKey), 'hex', { canonical: true })
  const r = signatureObj.r.toString('hex', 32)
  const s = signatureObj.s.toString('hex', 32)
  const i = (typeof signatureObj.recoveryParam === 'number')
    ? signatureObj.recoveryParam.toString(16).padStart(2, '0')
    : ''
  return r + s + i
}

/**
 * Verifies a signature against a message and address
 * @param {string} msg - The message
 * @param {string} signature - The signature
 * @param {string} address - The address to verify against
 * @returns {boolean} True if the signature is valid, false otherwise
 */
function verifySignatureAddress(msg, signature, address) {
  const publicKey = recoverPublicKeyFromSignedMessage(msg, signature)
  const derivedAddress = publicKeyToChecksumAddress(publicKey)
  return address === derivedAddress
}

/**
 * Recovers the public key from a signed message
 * @param {string} msg - The message
 * @param {string} signature - The signature
 * @returns {string} The public key
 */
function recoverPublicKeyFromSignedMessage(msg, signature) {
  const signatureObj = { r: signature.slice(0, 64), s: signature.slice(64, 128) }
  const recoveryParam = parseInt(signature.slice(128, 130), 16)
  const msgHash = SHA256(msg).toString()
  const msgHashByteArray = elliptic.utils.toArray(msgHash, 'hex')
  const publicKey = ec.recoverPubKey(msgHashByteArray, signatureObj, recoveryParam, 'hex')
  return publicKey.encode('hex', true)
}

/**
 * Recovers the address from a signed message
 * @param {string} msg - The message
 * @param {string} signature - The signature
 * @returns {string} The address
 */
function recoverAddressFromSignedMessage(msg, signature) {
  const publicKey = recoverPublicKeyFromSignedMessage(msg, signature)
  const derivedAddress = publicKeyToChecksumAddress(publicKey)
  return derivedAddress
}

const WalletUtils = {
  generateKeyPair,
  generateWallet,
  generateChecksumAddress,
  checksumAddressIsValid,
  restoreWalletFromPrivateKey,
  publicKeyToChecksumAddress,
  privateKeyToChecksumAddress,
  privateKeyToPublicKey,
  generateSignature,
  verifySignatureAddress,
  recoverPublicKeyFromSignedMessage,
  recoverAddressFromSignedMessage,
  xeStringFromMicroXe,
  toMicroXe,
  formatXe
}

export default WalletUtils
