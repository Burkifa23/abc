// Part 2: a command-line client for the FortuneTeller contract.
// Usage: node get-fortune.mjs <viewAnswers|getFortune|viewQuestions> [question]
// Env: RPC_URL (default http://127.0.0.1:8545), CONTRACT_ADDRESS, PRIVATE_KEY (only for getFortune).
// It prints only the result: a JSON array for the views, or the answer text for getFortune.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http, parseAbi, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// The contract's interface as text. Given.
const abi = parseAbi([
  "function viewAnswers() view returns (string[])",
  "function getFortune(string question) returns (string answer)",
  "function viewQuestions() view returns ((address asker, string question, string answer)[])",
  "event FortuneTold(address indexed asker, string question, string answer)",
  "error NotEnoughAnswers()",
  "error EmptyAnswer()",
  "error EmptyQuestion()",
]);

const METHODS = ["viewAnswers", "getFortune", "viewQuestions"];
const DEFAULT_RPC = "http://127.0.0.1:8545";

const ok = (out) => ({ code: 0, out, err: "" });
const fail = (err) => ({ code: 1, out: "", err });

/** The decoded custom error name (for example EmptyQuestion) if there is one, else viem's short message. Given. */
function describe(e) {
  const revert = e?.walk?.((x) => x?.data?.errorName);
  return revert?.data?.errorName ?? e?.shortMessage ?? e?.message ?? String(e);
}

export async function run(argv, env) {
  // Argument parsing and env reading are given.
  const [method, question] = argv;
  if (!METHODS.includes(method)) return fail(`Unknown method: ${method}`);
  if (!env.CONTRACT_ADDRESS) return fail("CONTRACT_ADDRESS is not set. Deploy the contract and export its address.");
  const address = env.CONTRACT_ADDRESS;
  const transport = http(env.RPC_URL || DEFAULT_RPC);

  try {
    // TODO 1: create a public client: createPublicClient({ transport }).
    if (method === "viewAnswers") {
      // TODO 2: publicClient.readContract({ address, abi, functionName: "viewAnswers" }),
      //         then return ok(JSON.stringify(answers)).
    }
    if (method === "viewQuestions") {
      // TODO 3: read "viewQuestions". Each item has asker, question and answer.
      //         Return ok(JSON.stringify(list)) with plain { asker, question, answer } objects.
    }
    // getFortune is a transaction, not a read. The answer depends on the block it lands in,
    // so do not print what a simulation returned: read it from the FortuneTold event in the receipt.
    // TODO 4: return fail("PRIVATE_KEY is not set (needed to send getFortune).") if env.PRIVATE_KEY is missing.
    // TODO 5: account = privateKeyToAccount(env.PRIVATE_KEY); walletClient = createWalletClient({ account, transport }).
    // TODO 6: simulate first (publicClient.simulateContract with args [question ?? ""] and account) so a revert such as
    //         EmptyQuestion is caught before sending. Then walletClient.writeContract(request) and
    //         publicClient.waitForTransactionReceipt({ hash }).
    // TODO 7: parseEventLogs({ abi, logs: receipt.logs, eventName: "FortuneTold" }) and return ok(event.args.answer).
    return fail("TODO: not implemented yet");
  } catch (e) {
    return fail(describe(e)); // prints the error name, e.g. EmptyQuestion. Given.
  }
}

// Run when called from the command line. Given.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { code, out, err } = await run(process.argv.slice(2), process.env);
  if (out) console.log(out);
  if (err) console.error(err);
  process.exitCode = code;
}
