// Copyright (C) 2025 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import assert from 'assert'
import { test, describe } from 'node:test'
import ExampleUtils from './example.js'

describe('ExampleUtils', () => {
  test('exampleFn returns correct result', () => {
    const result = ExampleUtils.exampleFn()
    assert.deepStrictEqual(result, { example: 'example' })
  })
})
