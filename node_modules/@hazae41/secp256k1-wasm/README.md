# secp256k1.wasm

WebAssembly port of Secp256k1

```bash
npm install @hazae41/secp256k1-wasm
```

[**📦 NPM**](https://www.npmjs.com/package/@hazae41/secp256k1-wasm)

## Features
- Reproducible building
- Pre-bundled and streamed
- Zero-copy memory slices

## Modules
- k256

## Algorithms
- ECDSA over Secp256k1

## Usage

```typescript
import { load, Memory, Secp256k1SigningKey, Secp256k1VerifyingKey } from "@hazae41/secp256k1-wasm";

await load();

using hash = new Memory(crypto.getRandomValues(new Uint8Array(32)))

using keypair = new Secp256k1SigningKey()
using identity = keypair.verifying_key()

using signaturex = keypair.sign_prehash_recoverable(hash)
using signaturem = signaturex.to_bytes()
const signatureb = signaturem.bytes

const r = signatureb.subarray(0, 32)
const s = signatureb.subarray(32, 64)
const v = signatureb[64]

using identity2 = Secp256k1VerifyingKey.recover_from_prehash(hash, signaturex)
```

## Building

### Reproducible building

You can build the exact same bytecode

```bash
npm run compile && npm run prepack
```

Then check that all the files are the same using `npm diff`

```bash
npm diff
```

If the output is empty then the bytecode is the same as the one I published on NPM.

### Automated checks

Each time I release a new version on GitHub, the GitHub's CI clones the GitHub repository, reproduces the build, and throws an error if the NPM release is different. If a version is present on NPM but not on GitHub, do not use it!
