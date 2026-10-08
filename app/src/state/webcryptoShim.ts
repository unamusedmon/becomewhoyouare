/**
 * Android's JS engine has no WebCrypto. openpgp.js expects `crypto.subtle` to exist but
 * falls back to its own pure-JS code for anything that throws NotSupportedError, except
 * hashing and HKDF, which it always asks WebCrypto for. So this provides those two from
 * @noble/hashes, and random bytes from expo-crypto. Browsers keep their real WebCrypto.
 */
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha1 } from '@noble/hashes/legacy.js';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js';
import type { CHash } from '@noble/hashes/utils.js';

type Hash = CHash;
const HASHES: Record<string, Hash> = { 'SHA-1': sha1, 'SHA-256': sha256, 'SHA-384': sha384, 'SHA-512': sha512 };

type Algo = string | { name: string; hash?: string | { name: string }; salt?: BufferSource; info?: BufferSource };
const nameOf = (a: Algo) => (typeof a === 'string' ? a : a.name).toUpperCase();
const hashOf = (a: Algo): Hash => {
  const h = typeof a === 'string' ? a : typeof a.hash === 'string' ? a.hash : a.hash?.name ?? a.name;
  const fn = HASHES[h.toUpperCase()];
  if (!fn) throw notSupported();
  return fn;
};
const bytes = (b: BufferSource): Uint8Array =>
  b instanceof Uint8Array ? b : ArrayBuffer.isView(b) ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : new Uint8Array(b);
const out = (u: Uint8Array): ArrayBuffer => u.slice().buffer as ArrayBuffer;

function notSupported(): Error {
  const e = new Error('Not supported on this device');
  e.name = 'NotSupportedError';
  return e;
}

interface ShimKey { shim: true; algorithm: { name: string }; raw: Uint8Array }

const subtle = {
  async digest(algorithm: Algo, data: BufferSource) {
    return out(hashOf(algorithm)(bytes(data)));
  },
  async importKey(format: string, keyData: BufferSource, algorithm: Algo): Promise<ShimKey> {
    if (format !== 'raw' || nameOf(algorithm) !== 'HKDF') throw notSupported();
    return { shim: true, algorithm: { name: 'HKDF' }, raw: bytes(keyData).slice() };
  },
  async deriveBits(algorithm: Algo, key: ShimKey, length: number) {
    if (nameOf(algorithm) !== 'HKDF' || typeof algorithm === 'string' || !key?.shim) throw notSupported();
    const salt = algorithm.salt ? bytes(algorithm.salt) : undefined;
    const info = algorithm.info ? bytes(algorithm.info) : undefined;
    return out(hkdf(hashOf(algorithm), key.raw, salt, info, length / 8));
  },
};

const g = globalThis as { crypto?: { getRandomValues?: unknown; subtle?: unknown } };
if (!g.crypto) g.crypto = {};
if (!g.crypto.getRandomValues) {
  // Loaded only where it's needed, so the shim also runs under Node for tests.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  g.crypto.getRandomValues = (require('expo-crypto') as typeof import('expo-crypto')).getRandomValues;
}
if (!g.crypto.subtle) {
  g.crypto.subtle = new Proxy(subtle, {
    get: (target, prop) => (prop in target ? target[prop as keyof typeof subtle] : async () => { throw notSupported(); }),
  });
}
