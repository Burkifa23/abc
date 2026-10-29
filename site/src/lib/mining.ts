import { sha256 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";

const enc = new TextEncoder();
export const sha256Hex = (s: string): string => bytesToHex(sha256(enc.encode(s)));
export const keccakHex = (s: string): string => bytesToHex(keccak_256(enc.encode(s)));

export type MineOpts = { data: string; prevHash: string; difficulty: number; maxTries?: number };

/** Try nonces from `start`; hash = sha256Hex(nonce + prevHash + data). */
export function mine(o: MineOpts, start = 0): { nonce: number; hash: string } | null {
  const prefix = "0".repeat(o.difficulty);
  const end = start + (o.maxTries ?? 1_000_000);
  for (let nonce = start; nonce < end; nonce++) {
    const hash = sha256Hex(nonce + o.prevHash + o.data);
    if (hash.startsWith(prefix)) return { nonce, hash };
  }
  return null;
}
