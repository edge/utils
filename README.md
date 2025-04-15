<img src="https://cdn.edge.network/assets/img/edge-logo-green.svg" width="200">

# @edge/utils

Unified utility library for the Edge Network, including wallet utilities for the XE blockchain and more.

[![npm version](https://img.shields.io/npm/v/@edge/utils)](https://www.npmjs.com/package/@edge/utils)
[![npm downloads](https://img.shields.io/npm/dt/@edge/utils)](https://www.npmjs.com/package/@edge/utils)
[![license](https://img.shields.io/npm/l/@edge/utils)](LICENSE.md)

## Features

- **WalletUtils**: XE blockchain wallet generation, address validation, signature, and conversion utilities.
- **ExampleUtils**: Example utility module for demonstration and extension.
- **ESM-first**: Modern JavaScript, ready for import in Node.js and bundlers.

## Installation

```sh
npm install @edge/utils
```

## Usage

```js
// ESM import (Node.js 14+ or any modern bundler)
import { WalletUtils } from '@edge/utils'

// WalletUtils example
const wallet = WalletUtils.generateWallet()
console.log(wallet.address) // xe_...
```

## API

### WalletUtils

- `generateWallet()`: Generate a new XE wallet (address, publicKey, privateKey).
- `generateKeyPair()`: Generate a secp256k1 key pair.
- `generateChecksumAddress(address)`: Create a checksummed XE address.
- `checksumAddressIsValid(address)`: Validate a XE address.
- `restoreWalletFromPrivateKey(privateKey)`: Restore wallet from private key.
- `publicKeyToChecksumAddress(publicKey)`: Convert public key to XE address.
- `privateKeyToPublicKey(privateKey)`: Convert private key to public key.
- `privateKeyToChecksumAddress(privateKey)`: Convert private key to XE address.
- `generateSignature(privateKey, msg)`: Sign a message.
- `verifySignatureAddress(msg, signature, address)`: Verify a signature.
- `recoverPublicKeyFromSignedMessage(msg, signature)`: Recover public key from signed message.
- `recoverAddressFromSignedMessage(msg, signature)`: Recover address from signed message.
- `xeStringFromMicroXe(mxe, format)`: Format microXE to XE string.
- `toMicroXe(xe)`: Convert XE string/number to microXE.
- `formatXe(xe, format)`: Format XE value.

### ExampleUtils

- `exampleFn()`: Returns `{ example: 'example' }`.

## Contributing

Interested in contributing? Amazing! Please read our [Contributor Guidelines](CONTRIBUTING.md) before submitting issues or pull requests.

## License

Edge is the infrastructure of Web3. A peer-to-peer network and blockchain providing high performance decentralised web services, powered by the spare capacity all around us.

Copyright notice
(C) 2025 Edge Network Technologies Limited <support@edge.network>
All rights reserved

This product is part of Edge.
Edge is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version ("the GPL").

**If you wish to use Edge outside the scope of the GPL, please contact us at licensing@edge.network for details of alternative license arrangements.**

**This product may be distributed alongside other components available under different licenses (which may not be GPL). See those components themselves, or the documentation accompanying them, to determine what licenses are applicable.**

Edge is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

The GNU General Public License (GPL) is available at: https://www.gnu.org/licenses/gpl-3.0.en.html
A copy can be found in the file GPL.md distributed with these files.

This copyright notice MUST APPEAR in all copies of the product!
