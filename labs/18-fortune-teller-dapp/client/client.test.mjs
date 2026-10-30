// Starts a throwaway anvil on port 8546, deploys the compiled FortuneTeller and runs the CLI against it.
// Needs `forge build` first (the contract's ABI and bytecode are read from ../out).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { run } from "./get-fortune.mjs";

const RPC_URL = "http://127.0.0.1:8546";
// Anvil's well-known account 0. This key is public and only ever holds fake ether on a local chain.
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ANSWERS = ["Yes", "No", "Ask again later", "Definitely", "Very doubtful", "It is certain"];

let anvil;
let env;

async function waitForRpc() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      });
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("anvil did not start");
}

before(async () => {
  anvil = spawn("anvil", ["--port", "8546"], { stdio: "ignore" });
  await waitForRpc();
  const artifact = JSON.parse(readFileSync(new URL("../out/FortuneTeller.sol/FortuneTeller.json", import.meta.url)));
  const account = privateKeyToAccount(PRIVATE_KEY);
  const transport = http(RPC_URL);
  const wallet = createWalletClient({ account, transport });
  const publicClient = createPublicClient({ transport });
  const hash = await wallet.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode.object,
    args: [ANSWERS],
    chain: null,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  env = { RPC_URL, CONTRACT_ADDRESS: receipt.contractAddress, PRIVATE_KEY };
});

after(() => {
  anvil?.kill();
});

test("viewAnswers prints JSON", async () => {
  const r = await run(["viewAnswers"], env);
  assert.equal(r.code, 0);
  assert.deepEqual(JSON.parse(r.out), ANSWERS);
});

test("getFortune prints the stored answer", async () => {
  const r = await run(["getFortune", "Will I pass?"], env);
  assert.equal(r.code, 0, r.err);
  assert.ok(ANSWERS.includes(r.out), `unexpected answer: ${r.out}`);
  const stored = JSON.parse((await run(["viewQuestions"], env)).out);
  assert.equal(stored.at(-1).answer, r.out);
});

test("viewQuestions includes the question", async () => {
  await run(["getFortune", "Is this a test?"], env);
  const r = await run(["viewQuestions"], env);
  assert.equal(r.code, 0);
  assert.ok(JSON.parse(r.out).some((f) => f.question === "Is this a test?"));
});

test("rejects unknown method", async () => {
  const r = await run(["dance"], env);
  assert.equal(r.code, 1);
  assert.equal(r.err, "Unknown method: dance");
  assert.equal(r.out, "");
});

test("reports missing CONTRACT_ADDRESS", async () => {
  const r = await run(["viewAnswers"], { RPC_URL });
  assert.equal(r.code, 1);
  assert.match(r.err, /CONTRACT_ADDRESS/);
  assert.doesNotMatch(r.err, /\bat .*\(/); // a message, not a stack trace
});

test("reports EmptyQuestion", async () => {
  const r = await run(["getFortune"], env);
  assert.equal(r.code, 1);
  assert.equal(r.err, "EmptyQuestion");
});
