// Copyright (C) 2025 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import WalletUtils from '../WalletUtils/wallet.js'
import argon2 from 'argon2'

/**
 * Applies Argon2id memory-hard function
 * @param {string} input - The input string
 * @param {string} salt - The salt string
 * @returns {Promise<Buffer>} The 32-byte hash
 */
async function argon2idHash(input, salt) {
  return await argon2.hash(input, {
    salt: Buffer.from(salt),
    memoryCost: 64 * 1024, // 64 MiB
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
    type: argon2.argon2id,
    raw: true
  })
}

/**
 * Mines a signature by trying solutions until finding one with required leading zeros
 * Includes Argon2id memory-hard step for GPU resistance (run once per challenge)
 * @param {string} privateKey - The private key
 * @param {string} message - The message to sign
 * @param {number} difficulty - Number of leading zeros required
 * @param {number} challenge - The challenge index for deterministic salt
 * @returns {Promise<Object>} Object with signature and solution
 */
async function mineSignature(privateKey, message, difficulty, challenge) {
  const target = '0'.repeat(difficulty)
  const salt = `xe-challenge-${challenge}`

  // Run Argon2id ONCE per challenge to generate seed
  const seed = await argon2idHash(message, salt)
  const seedHex = seed.toString('hex')

  let solution = 0
  while (true) {
    // Cheap operation: just append solution to seed
    const signatureInput = seedHex + solution
    const signature = WalletUtils.generateSignature(privateKey, signatureInput)

    if (signature.startsWith(target)) {
      return { signature, solution }
    }
    solution++
  }
}

/**
 * Calculates the difficulty for a given challenge number
 * @param {number} challenge - The challenge index (0-based)
 * @returns {number} The difficulty for this challenge
 */
function calculateDifficulty(challenge) {
  const value = 2 + Math.floor(challenge * 0.4)
  return Math.min(Math.max(value, 2), 4)
}

/**
 * Identity class representing a proof-of-work identity
 */
class Identity {
  #privateKey

  /**
   * Creates an Identity instance
   * @param {string} privateKey - The private key
   * @param {string} address - The wallet address
   * @param {number} timestamp - The timestamp
   * @param {Array<string>} s - Array of signatures
   * @param {Array<number>} c - Array of solutions
   */
  constructor(privateKey, address, timestamp, s, c) {
    this.#privateKey = privateKey
    this.address = address
    this.timestamp = timestamp
    this.s = s
    this.c = c
  }

  /**
   * Adds one more proof-of-work challenge to this identity
   * @returns {Promise<Identity>} This identity with one more challenge
   */
  async addChallenge() {
    const nextIndex = this.s.length
    const difficulty = calculateDifficulty(nextIndex)
    const message = nextIndex === 0 ? `${this.address}:${this.timestamp}` : this.s[this.s.length - 1]
    const { signature, solution } = await mineSignature(this.#privateKey, message, difficulty, nextIndex)

    this.s.push(signature)
    this.c.push(solution)

    return this
  }

  /**
   * Returns a public-safe version of this identity without the private key
   * @returns {Object} Public identity object
   */
  getPublicIdentity() {
    return {
      address: this.address,
      timestamp: this.timestamp,
      s: [...this.s],
      c: [...this.c]
    }
  }

  /**
   * Returns the private key (use with caution)
   * @returns {string} The private key
   */
  getPrivateKey() {
    return this.#privateKey
  }

  /**
   * Serializes the identity to JSON (excludes private key by default)
   * @returns {Object} JSON representation
   */
  toJSON() {
    return this.getPublicIdentity()
  }
}

/**
 * Generates an identity with a proof-of-work chain
 * @param {number} challenges - Number of proofs to generate (default: 10)
 * @returns {Promise<Identity>} Identity instance with proof-of-work chain
 */
async function generateIdentity(challenges = 10) {
  const wallet = WalletUtils.generateWallet()
  const timestamp = Date.now()
  const s = []
  const c = []

  for (let i = 0; i < challenges; i++) {
    // For first challenge, include timestamp with address
    const message = i === 0 ? `${wallet.address}:${timestamp}` : s[i - 1]
    const difficulty = calculateDifficulty(i)
    const proof = await mineSignature(wallet.privateKey, message, difficulty, i)
    s.push(proof.signature)
    c.push(proof.solution)
  }

  return new Identity(wallet.privateKey, wallet.address, timestamp, s, c)
}

/**
 * Verifies an identity's proof-of-work chain
 * @param {Identity|Object} identity - The identity to verify (Identity instance or plain object)
 * @returns {Promise<boolean>} True if the chain is valid, false otherwise
 */
async function verifyIdentity(identity) {
  try {
    const { address, timestamp, s, c } = identity
    const challenges = s.length

    if (!s || !c || !timestamp || s.length !== c.length || s.length === 0) {
      return false
    }

    for (let i = 0; i < challenges; i++) {
      const signature = s[i]
      const solution = c[i]
      const difficulty = calculateDifficulty(i)
      const target = '0'.repeat(difficulty)

      if (!signature.startsWith(target)) {
        return false
      }

      // For first challenge, include timestamp with address
      const message = i === 0 ? `${address}:${timestamp}` : s[i - 1]
      const salt = `xe-challenge-${i}`

      // Run Argon2id once to get seed (same as during generation)
      const seed = await argon2idHash(message, salt)
      const seedHex = seed.toString('hex')

      // Reconstruct the signature input using seed + solution
      const signatureInput = seedHex + solution

      if (!WalletUtils.verifySignatureAddress(signatureInput, signature, address)) {
        return false
      }
    }

    return true
  } catch (error) {
    return false
  }
}

const IdentityUtils = {
  Identity,
  generateIdentity,
  verifyIdentity
}

export default IdentityUtils
