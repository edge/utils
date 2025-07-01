// Copyright (C) 2025 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import assert from 'assert'
import { test, describe } from 'node:test'
import WalletUtils from './wallet.js'

describe('WalletUtils', () => {
  test('generateKeyPair returns a valid key pair', () => {
    const keyPair = WalletUtils.generateKeyPair()
    assert.ok(keyPair.getPrivate('hex'))
    assert.ok(keyPair.getPublic(true, 'hex'))
  })

  test('generateWallet returns a wallet with valid fields', () => {
    const wallet = WalletUtils.generateWallet()
    assert.ok(wallet.privateKey)
    assert.ok(wallet.publicKey)
    assert.ok(wallet.address.startsWith('xe_'))
    assert.ok(wallet.address.length === 43)
    assert.ok(WalletUtils.checksumAddressIsValid(wallet.address))
  })

  test('publicKeyToChecksumAddress and privateKeyToChecksumAddress are consistent', () => {
    const wallet = WalletUtils.generateWallet()
    const addr1 = WalletUtils.publicKeyToChecksumAddress(wallet.publicKey)
    const addr2 = WalletUtils.privateKeyToChecksumAddress(wallet.privateKey)
    assert.strictEqual(addr1, addr2)
    assert.ok(WalletUtils.checksumAddressIsValid(addr1))
  })

  test('restoreWalletFromPrivateKey restores correct wallet', () => {
    const wallet = WalletUtils.generateWallet()
    const restored = WalletUtils.restoreWalletFromPrivateKey(wallet.privateKey)
    assert.strictEqual(restored.address, wallet.address)
    assert.strictEqual(restored.publicKey, wallet.publicKey)
  })

  test('XE formatting and conversion is reversible', () => {
    const val = 123.456789
    const mxe = WalletUtils.toMicroXe(val)
    const xeString = WalletUtils.xeStringFromMicroXe(mxe, false)
    assert.strictEqual(xeString, '123.456789')
    assert.strictEqual(WalletUtils.formatXe(val, false), '123.456789')
  })

  test('generateSignature and verifySignatureAddress work', () => {
    const wallet = WalletUtils.generateWallet()
    const msg = 'test message'
    const sig = WalletUtils.generateSignature(wallet.privateKey, msg)
    assert.ok(typeof sig === 'string' && sig.length >= 130)
    assert.ok(WalletUtils.verifySignatureAddress(msg, sig, wallet.address))
    // Negative test
    const wallet2 = WalletUtils.generateWallet()
    assert.ok(!WalletUtils.verifySignatureAddress(msg, sig, wallet2.address))
  })

  test('recoverPublicKeyFromSignedMessage and recoverAddressFromSignedMessage', () => {
    const wallet = WalletUtils.generateWallet()
    const msg = 'edge test'
    const sig = WalletUtils.generateSignature(wallet.privateKey, msg)
    const pub = WalletUtils.recoverPublicKeyFromSignedMessage(msg, sig)
    assert.strictEqual(pub, wallet.publicKey)
    const addr = WalletUtils.recoverAddressFromSignedMessage(msg, sig)
    assert.strictEqual(addr, wallet.address)
  })

  test('getShortAddress', () => {
    const addr = 'xe_0000111111111111111111111111111111112222'
    const short = WalletUtils.getShortAddress(addr)
    assert.strictEqual(short, 'xe_0000...2222')
  })
})
