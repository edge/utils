// Copyright (C) 2025 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import type elliptic from 'elliptic'

export type Address = string
export type ChecksumAddress = Address
export type Message = string
export type PrivateKey = Uint8Array | Buffer | string | number[] | elliptic.ec.KeyPair
export type PublicKey = string
export type Signature = string

export type Wallet = {
  address: Address
  privateKey: PrivateKey
  publicKey: PublicKey
}

export declare const WalletUtils: {
  generateKeyPair(): elliptic.ec.KeyPair
  generateWallet(): Wallet
  generateChecksumAddress(address: Address): ChecksumAddress
  checksumAddressIsValid(address: Address): boolean
  restoreWalletFromPrivateKey(privateKey: PrivateKey): Wallet
  publicKeyToChecksumAddress(publicKey: PublicKey): ChecksumAddress
  privateKeyToChecksumAddress(privateKey: PrivateKey): ChecksumAddress
  privateKeyToPublicKey(privateKey: PrivateKey): PublicKey
  generateSignature(privateKey: string, msg: Message): Signature
  verifySignatureAddress(msg: string, signature: Signature, address: Address): boolean
  recoverPublicKeyFromSignedMessage(msg: Message, signature: Signature): PublicKey
  recoverAddressFromSignedMessage(msg: Message, signature: Signature): Address
  xeStringFromMicroXe(mxe: number, format: boolean): string
  toMicroXe(xe: string | number): number
  formatXe(xe: string | number, format: boolean): string
}
