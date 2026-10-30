import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which key do you use to sign a transaction?", options: ["Your address", "Your public key", "Your private key", "The recipient's public key"], answer: 2, explain: "Only the holder of the private key can produce a signature that verifies against the matching public key." },
  { q: "Given `verify(message, signature, amaAddress)` returns `true`, what have you learned?", options: ["Ama's key signed it and the message is unchanged", "Ama's private key has now been made public", "Ama has enough money in her account to pay", "The transaction has already been included in a block"], answer: 0, explain: "A valid signature shows authenticity and integrity. It says nothing about balances or inclusion." },
  { q: "`sign(\"Ama pays Kofi 5\", k)` produces `sig`. What does `verify(\"Ama pays Kofi 500\", sig, amaAddress)` return?", options: ["true", "true, but with a warning", "An error that reveals k", "false"], answer: 3, explain: "A signature belongs to one exact message. Changing even one character makes verification fail." },
  { q: "Spot the bug: `sendToServer({ message, signature, privateKey: key })`. What is wrong?", options: ["The signature is too short", "The private key must never leave the signer", "The message should be hashed twice", "The address is missing"], answer: 1, explain: "Verification needs only the message, signature and public key or address. Sending the private key hands over the account." },
  { q: "How is an Ethereum address related to the keys?", options: ["It is derived from the public key by hashing", "It is the private key in hex", "It is chosen by the network", "It is the signature of the first transaction"], answer: 0, explain: "The address is the last 20 bytes of the keccak-256 hash of the public key." },
  { q: "Kofi loses his phone and has no copy of his private key or seed phrase. What can the blockchain network do for him?", options: ["Reset his password with the network", "Ask the bank to unlock the account again", "Move his funds to a new address first", "Nothing; nobody else can sign for him"], answer: 3, explain: "There is no central operator. Control of the private key is control of the account." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {};
