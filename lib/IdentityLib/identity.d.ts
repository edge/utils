// Copyright (C) 2025 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

/**
 * Public identity object (safe to share, no private key)
 */
export type PublicIdentity = {
  address: string
  timestamp: number
  s: string[]  // signatures
  c: number[]  // solutions
}

/**
 * Identity class representing a proof-of-work identity
 */
export declare class Identity {
  /**
   * The wallet address
   */
  readonly address: string

  /**
   * The timestamp when the identity was created
   */
  readonly timestamp: number

  /**
   * Array of signatures
   */
  readonly s: string[]

  /**
   * Array of solutions
   */
  readonly c: number[]

  /**
   * Adds one more proof-of-work challenge to this identity
   * @returns This identity with one more challenge
   */
  addChallenge(): Promise<Identity>

  /**
   * Returns a public-safe version of this identity without the private key
   * @returns Public identity object
   */
  getPublicIdentity(): PublicIdentity

  /**
   * Returns the private key (use with caution)
   * @returns The private key
   */
  getPrivateKey(): string

  /**
   * Serializes the identity to JSON (excludes private key by default)
   * @returns JSON representation
   */
  toJSON(): PublicIdentity
}

export declare const IdentityUtils: {
  /**
   * The Identity class
   */
  Identity: typeof Identity

  /**
   * Generates an identity with a proof-of-work chain
   * @param challenges - Number of proofs to generate (default: 10)
   * @returns Identity instance with proof-of-work chain
   */
  generateIdentity: (challenges?: number) => Promise<Identity>

  /**
   * Verifies an identity's proof-of-work chain
   * @param identity - The identity to verify (Identity instance or PublicIdentity object)
   * @returns True if the chain is valid, false otherwise
   */
  verifyIdentity: (identity: Identity | PublicIdentity) => Promise<boolean>
}

export default IdentityUtils
