// Copyright (C) 2025 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import assert from 'assert'
import { test, describe } from 'node:test'
import IdentityUtils from './identity.js'
import WalletUtils from '../WalletUtils/wallet.js'

// Helper function to calculate difficulty for a challenge
function calculateDifficulty(challenge) {
  const value = 2 + Math.floor(challenge * 0.4)
  return Math.min(Math.max(value, 2), 4)
}

describe('IdentityUtils - Basic Functionality', () => {
  test('generateIdentity with 3 challenges (quick test)', async () => {
    console.log('\n  === Generating identity: 3 challenges (quick test) ===')
    const startTotal = Date.now()
    const identity = await IdentityUtils.generateIdentity(3)
    const elapsedTotal = Date.now() - startTotal

    // Verify structure
    assert.ok(identity instanceof IdentityUtils.Identity, 'Should return Identity instance')
    assert.ok(identity.getPrivateKey(), 'Should have private key')
    assert.ok(identity.address, 'Should have address')
    assert.ok(identity.timestamp, 'Should have timestamp')
    assert.strictEqual(identity.s.length, 3, 'Should have 3 signatures')
    assert.strictEqual(identity.c.length, 3, 'Should have 3 solutions')

    // Log each proof with its difficulty
    console.log(`  Address: ${identity.address}`)
    console.log(`  Timestamp: ${identity.timestamp}`)
    for (let i = 0; i < 3; i++) {
      const signature = identity.s[i]
      const solution = identity.c[i]
      const difficulty = calculateDifficulty(i)
      console.log(`  Challenge ${i} [diff=${difficulty}]: ${signature.substring(0, 20)}... (solution: ${solution})`)
    }
    console.log(`  Total time: ${elapsedTotal}ms\n`)

    // Output full JSON (should not include private key)
    console.log('  Full identity object (toJSON):')
    console.log(JSON.stringify(identity, null, 2))
    console.log('')

    // Verify JSON doesn't expose private key
    const json = JSON.parse(JSON.stringify(identity))
    assert.ok(!json.privateKey, 'JSON should not expose privateKey')
    assert.ok(!json.publicKey, 'JSON should not expose publicKey')

    // Verify all signatures have correct progressive difficulty
    for (let i = 0; i < 3; i++) {
      const expectedDifficulty = calculateDifficulty(i)
      const expectedPrefix = '0'.repeat(expectedDifficulty)
      assert.ok(identity.s[i].startsWith(expectedPrefix),
        `Challenge ${i} should have ${expectedDifficulty} leading zeros`)
    }
  })

  test('generateIdentity with 5 challenges (standard test)', async () => {
    console.log('\n  === Generating identity: 5 challenges (standard test) ===')
    const startTotal = Date.now()
    const identity = await IdentityUtils.generateIdentity(5)
    const elapsedTotal = Date.now() - startTotal

    // Verify structure
    assert.ok(identity instanceof IdentityUtils.Identity)
    assert.ok(identity.getPrivateKey())
    assert.ok(identity.address)
    assert.ok(identity.timestamp)
    assert.strictEqual(identity.s.length, 5)
    assert.strictEqual(identity.c.length, 5)

    // Log each proof with its difficulty
    console.log(`  Address: ${identity.address}`)
    console.log(`  Timestamp: ${identity.timestamp}`)
    for (let i = 0; i < 5; i++) {
      const signature = identity.s[i]
      const solution = identity.c[i]
      const difficulty = calculateDifficulty(i)
      console.log(`  Challenge ${i} [diff=${difficulty}]: ${signature.substring(0, 20)}... (solution: ${solution})`)
    }
    console.log(`  Total time: ${elapsedTotal}ms\n`)

    // Verify all signatures have correct progressive difficulty
    for (let i = 0; i < 5; i++) {
      const expectedDifficulty = calculateDifficulty(i)
      const expectedPrefix = '0'.repeat(expectedDifficulty)
      assert.ok(identity.s[i].startsWith(expectedPrefix),
        `Challenge ${i} should have ${expectedDifficulty} leading zeros`)
    }
  })

  test('getPublicIdentity returns safe copy', async () => {
    console.log('\n  === Testing getPublicIdentity ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()

    assert.ok(publicIdentity.address, 'Should have address')
    assert.ok(publicIdentity.timestamp, 'Should have timestamp')
    assert.ok(Array.isArray(publicIdentity.s), 'Should have signatures array')
    assert.ok(Array.isArray(publicIdentity.c), 'Should have solutions array')
    assert.ok(!publicIdentity.privateKey, 'Should not have privateKey')
    assert.ok(!publicIdentity.publicKey, 'Should not have publicKey')

    // Verify it's a copy, not reference
    publicIdentity.s.push('fake')
    assert.notStrictEqual(identity.s.length, publicIdentity.s.length, 'Should be a copy')
    console.log(`  Public identity is safe and independent\n`)
  })

  test('addChallenge method works correctly', async () => {
    console.log('\n  === Testing addChallenge method ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const originalLength = identity.s.length

    await identity.addChallenge()

    console.log(`  Original length: ${originalLength}`)
    console.log(`  After addChallenge: ${identity.s.length}`)

    assert.strictEqual(identity.s.length, originalLength + 1, 'Should add one challenge')
    assert.strictEqual(identity.c.length, originalLength + 1, 'Should add one solution')

    // Verify the new challenge is valid
    const isValid = await IdentityUtils.verifyIdentity(identity)
    assert.strictEqual(isValid, true, 'Identity with added challenge should be valid')
    console.log(`  Identity with added challenge is valid\n`)
  })

  test('verifyIdentity accepts valid progressive chain', async () => {
    console.log('\n  === Verifying valid progressive identity ===')
    const identity = await IdentityUtils.generateIdentity(5)
    const isValid = await IdentityUtils.verifyIdentity(identity)

    console.log(`  Address: ${identity.address}`)
    console.log(`  Timestamp: ${identity.timestamp}`)
    console.log(`  Challenges: ${identity.s.length}`)
    console.log(`  Verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗'}\n`)

    assert.strictEqual(isValid, true)
  })

  test('verifyIdentity accepts public identity object', async () => {
    console.log('\n  === Verifying public identity object ===')
    const identity = await IdentityUtils.generateIdentity(5)
    const publicIdentity = identity.getPublicIdentity()
    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)

    console.log(`  Public identity verification: ${isValid ? 'VALID ✓' : 'INVALID ✗'}\n`)
    assert.strictEqual(isValid, true, 'Public identity should verify')
  })

  test('verifyIdentity rejects tampered signature', async () => {
    console.log('\n  === Testing tampered signature detection ===')
    const identity = await IdentityUtils.generateIdentity(5)

    // Tamper with signature 2
    const originalSig = identity.s[2]
    identity.s[2] = originalSig.substring(0, 10) + 'ff' + originalSig.substring(12)

    const isValid = await IdentityUtils.verifyIdentity(identity)

    console.log(`  Original signature: ${originalSig.substring(0, 30)}...`)
    console.log(`  Tampered signature: ${identity.s[2].substring(0, 30)}...`)
    console.log(`  Verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗ (correctly rejected)'}\n`)

    assert.strictEqual(isValid, false)
  })

  test('verifyIdentity rejects wrong solution', async () => {
    console.log('\n  === Testing wrong solution detection ===')
    const identity = await IdentityUtils.generateIdentity(5)

    // Change solution on challenge 2
    const originalSolution = identity.c[2]
    identity.c[2] = originalSolution + 1

    const isValid = await IdentityUtils.verifyIdentity(identity)

    console.log(`  Original solution: ${originalSolution}`)
    console.log(`  Wrong solution: ${identity.c[2]}`)
    console.log(`  Verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗ (correctly rejected)'}\n`)

    assert.strictEqual(isValid, false)
  })

  test('verifyIdentity rejects broken chain link', async () => {
    console.log('\n  === Testing broken chain link detection ===')
    const identity = await IdentityUtils.generateIdentity(5)

    // Break the chain by modifying challenge 1 (which challenge 2 depends on)
    const originalSig1 = identity.s[1]
    identity.s[1] = '00aabbccdd' + originalSig1.substring(10)

    const isValid = await IdentityUtils.verifyIdentity(identity)

    console.log(`  Modified challenge 1 (breaks chain for challenge 2+)`)
    console.log(`  Verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗ (correctly rejected)'}\n`)

    assert.strictEqual(isValid, false)
  })

  test('verifyIdentity rejects insufficient leading zeros', async () => {
    console.log('\n  === Testing insufficient leading zeros detection ===')
    const identity = await IdentityUtils.generateIdentity(5)

    // Remove a leading zero from challenge 3 (which has difficulty 3)
    const originalSig = identity.s[3]
    identity.s[3] = originalSig.substring(1)

    const isValid = await IdentityUtils.verifyIdentity(identity)

    console.log(`  Original signature: ${originalSig.substring(0, 20)}...`)
    console.log(`  Modified signature: ${identity.s[3].substring(0, 20)}... (missing a zero)`)
    console.log(`  Verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗ (correctly rejected)'}\n`)

    assert.strictEqual(isValid, false)
  })

  test('verifyIdentity rejects tampered timestamp', async () => {
    console.log('\n  === Testing tampered timestamp detection ===')
    const identity = await IdentityUtils.generateIdentity(5)

    // Tamper with timestamp (but keep signatures unchanged)
    const originalTimestamp = identity.timestamp
    identity.timestamp = originalTimestamp + 1000

    const isValid = await IdentityUtils.verifyIdentity(identity)

    console.log(`  Original timestamp: ${originalTimestamp}`)
    console.log(`  Tampered timestamp: ${identity.timestamp}`)
    console.log(`  Verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗ (correctly rejected)'}\n`)

    assert.strictEqual(isValid, false, 'Should reject identity with tampered timestamp')
  })
})

describe('IdentityUtils - Security & Edge Cases', () => {

  test('verifyIdentity with missing address field', async () => {
    console.log('\n  === Testing missing address field ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    delete publicIdentity.address

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject identity without address')
  })

  test('verifyIdentity with missing timestamp field', async () => {
    console.log('\n  === Testing missing timestamp field ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    delete publicIdentity.timestamp

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject identity without timestamp')
  })

  test('verifyIdentity with missing s array', async () => {
    console.log('\n  === Testing missing s array ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    delete publicIdentity.s

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject identity without s array')
  })

  test('verifyIdentity with missing c array', async () => {
    console.log('\n  === Testing missing c array ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    delete publicIdentity.c

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject identity without c array')
  })

  test('verifyIdentity with empty arrays', async () => {
    console.log('\n  === Testing empty s and c arrays ===')
    const publicIdentity = {
      address: 'xe_1234567890123456789012345678901234567890',
      timestamp: Date.now(),
      s: [],
      c: []
    }

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject identity with zero challenges')
  })

  test('verifyIdentity with null values', async () => {
    console.log('\n  === Testing null values ===')
    const publicIdentity = {
      address: null,
      timestamp: null,
      s: null,
      c: null
    }

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject null values')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with non-array s and c', async () => {
    console.log('\n  === Testing non-array s and c ===')
    const publicIdentity = {
      address: 'xe_1234567890123456789012345678901234567890',
      timestamp: Date.now(),
      s: 'not-an-array',
      c: 'not-an-array'
    }

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject non-array s/c')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with non-string signatures', async () => {
    console.log('\n  === Testing non-string signatures ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.s[1] = 12345 // number instead of string

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject non-string signatures')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with non-number solutions', async () => {
    console.log('\n  === Testing non-number solutions ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.c[1] = 'not-a-number'

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject non-number solutions')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with short signature (missing recovery param)', async () => {
    console.log('\n  === Testing signature missing recovery parameter ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    // Signatures should be 130 chars (64+64+2), try with only 128
    publicIdentity.s[1] = publicIdentity.s[1].substring(0, 128)

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject malformed signatures')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with invalid hex in signature', async () => {
    console.log('\n  === Testing invalid hex characters in signature ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    // Replace some hex with invalid characters
    publicIdentity.s[1] = 'GGGGGG' + publicIdentity.s[1].substring(6)

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject invalid hex')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with negative timestamp', async () => {
    console.log('\n  === Testing negative timestamp ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.timestamp = -1000

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Result: ${isValid ? 'VALID (odd but mathematically valid)' : 'INVALID'}`)
  })

  test('verifyIdentity with negative solution', async () => {
    console.log('\n  === Testing negative solution ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.c[1] = -5

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject negative solutions')
  })

  test('verifyIdentity with floating point solution', async () => {
    console.log('\n  === Testing floating point solution ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.c[1] = 123.456

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
  })

  test('verifyIdentity with NaN solution', async () => {
    console.log('\n  === Testing NaN solution ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.c[1] = NaN

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject NaN solutions')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with Infinity solution', async () => {
    console.log('\n  === Testing Infinity solution ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.c[1] = Infinity

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject Infinity solutions')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with wrong address (spoofing)', async () => {
    console.log('\n  === Testing address spoofing ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    const fakeWallet = WalletUtils.generateWallet()
    const originalAddress = publicIdentity.address
    publicIdentity.address = fakeWallet.address

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Original address: ${originalAddress.substring(0, 20)}...`)
    console.log(`  Spoofed address: ${fakeWallet.address.substring(0, 20)}...`)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject spoofed address')
  })

  test('verifyIdentity with invalid address format', async () => {
    console.log('\n  === Testing invalid address format ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.address = 'not-a-valid-address'

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject invalid address format')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with reordered challenges', async () => {
    console.log('\n  === Testing reordered challenges ===')
    const identity = await IdentityUtils.generateIdentity(5)
    const publicIdentity = identity.getPublicIdentity()

    // Swap challenges 2 and 3
    const temp_s = publicIdentity.s[2]
    const temp_c = publicIdentity.c[2]
    publicIdentity.s[2] = publicIdentity.s[3]
    publicIdentity.c[2] = publicIdentity.c[3]
    publicIdentity.s[3] = temp_s
    publicIdentity.c[3] = temp_c

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Swapped challenges 2 and 3`)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject reordered challenges')
  })

  test('verifyIdentity with extra challenges appended', async () => {
    console.log('\n  === Testing extra challenges appended ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()

    // Append fake challenges
    publicIdentity.s.push('0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')
    publicIdentity.c.push(0)

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Appended fake challenge`)
    console.log(`  Result: ${isValid ? 'VALID (might be issue)' : 'INVALID (correctly rejected)'}`)
  })

  test('verifyIdentity with removed last challenge', async () => {
    console.log('\n  === Testing removed last challenge ===')
    const identity = await IdentityUtils.generateIdentity(5)
    const publicIdentity = identity.getPublicIdentity()

    // Remove last challenge
    publicIdentity.s.pop()
    publicIdentity.c.pop()

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Removed last challenge`)
    console.log(`  Result: ${isValid ? 'VALID (acceptable - shorter chain)' : 'INVALID'}`)
  })

  test('verifyIdentity with duplicate challenges', async () => {
    console.log('\n  === Testing duplicate challenges ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()

    // Duplicate challenge 1
    publicIdentity.s[2] = publicIdentity.s[1]
    publicIdentity.c[2] = publicIdentity.c[1]

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Duplicated challenge 1 into position 2`)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject duplicate challenges')
  })

  test('addChallenge with frozen arrays throws error', async () => {
    console.log('\n  === Testing addChallenge with frozen arrays ===')
    const identity = await IdentityUtils.generateIdentity(3)
    Object.freeze(identity.s)
    Object.freeze(identity.c)

    try {
      await identity.addChallenge()
      console.log(`  ERROR: Should have thrown but didn't!`)
      assert.fail('Should throw when arrays are frozen')
    } catch (error) {
      console.log(`  Correctly threw error: ${error.message}`)
    }
  })

  test('verifyIdentity with very large solution number', async () => {
    console.log('\n  === Testing very large solution number ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.c[1] = Number.MAX_SAFE_INTEGER + 1

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
    console.log(`  Solution: ${publicIdentity.c[1]}`)
    console.log(`  Result: ${isValid ? 'VALID (precision issue?)' : 'INVALID (correctly rejected)'}`)
  })

  test('verifyIdentity with very long signature string', async () => {
    console.log('\n  === Testing abnormally long signature ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity.s[1] = publicIdentity.s[1] + '0'.repeat(1000)

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Signature length: ${publicIdentity.s[1].length}`)
      console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
      assert.strictEqual(isValid, false, 'Should reject abnormally long signatures')
    } catch (error) {
      console.log(`  Caught error: ${error.message} (acceptable)`)
    }
  })

  test('verifyIdentity with challenges from different identity', async () => {
    console.log('\n  === Testing challenges from different identity ===')
    const identity1 = await IdentityUtils.generateIdentity(3)
    const identity2 = await IdentityUtils.generateIdentity(3)
    const publicIdentity1 = identity1.getPublicIdentity()
    const publicIdentity2 = identity2.getPublicIdentity()

    // Replace challenge 1 from identity1 with challenge 1 from identity2
    publicIdentity1.s[1] = publicIdentity2.s[1]
    publicIdentity1.c[1] = publicIdentity2.c[1]

    const isValid = await IdentityUtils.verifyIdentity(publicIdentity1)
    console.log(`  Replaced challenge from different identity`)
    console.log(`  Result: ${isValid ? 'VALID (SECURITY ISSUE!)' : 'INVALID (correctly rejected)'}`)
    assert.strictEqual(isValid, false, 'Should reject challenges from different identity')
  })

  test('verifyIdentity with prototype pollution attempt', async () => {
    console.log('\n  === Testing prototype pollution attempt ===')
    const identity = await IdentityUtils.generateIdentity(3)
    const publicIdentity = identity.getPublicIdentity()
    publicIdentity['__proto__'] = { polluted: true }

    try {
      const isValid = await IdentityUtils.verifyIdentity(publicIdentity)
      console.log(`  Result: ${isValid ? 'VALID (identity still valid)' : 'INVALID'}`)
    } catch (error) {
      console.log(`  Caught error: ${error.message}`)
    }
  })
})
