// Facilitator reference. Usage: node get-fortune.mjs <viewAnswers|getFortune|viewQuestions> [question]
// Env: RPC_URL (default http://127.0.0.1:8545), CONTRACT_ADDRESS, PRIVATE_KEY (only for getFortune).
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http, parseAbi, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";

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

/** The decoded custom error name (for example EmptyQuestion) if there is one, else viem's short message. */
function describe(e) {
  const revert = e?.walk?.((x) => x?.data?.errorName);
  return revert?.data?.errorName ?? e?.shortMessage ?? e?.message ?? String(e);
}

export async function run(argv, env) {
  const [method, question] = argv;
  if (!METHODS.includes(method)) return fail(`Unknown method: ${method}`);
  if (!env.CONTRACT_ADDRESS) return fail("CONTRACT_ADDRESS is not set. Deploy the contract and export its address.");
  const address = env.CONTRACT_ADDRESS;
  const transport = http(env.RPC_URL || DEFAULT_RPC);

  try {
    const publicClient = createPublicClient({ transport });
    if (method === "viewAnswers") {
      const answers = await publicClient.readContract({ address, abi, functionName: "viewAnswers" });
      return ok(JSON.stringify(answers));
    }
    if (method === "viewQuestions") {
      const list = await publicClient.readContract({ address, abi, functionName: "viewQuestions" });
      return ok(JSON.stringify(list.map(({ asker, question, answer }) => ({ asker, question, answer }))));
    }
    // getFortune is a transaction. The answer depends on the block it lands in, so read it from the event
    // in the receipt instead of from a simulation.
    if (!env.PRIVATE_KEY) return fail("PRIVATE_KEY is not set (needed to send getFortune).");
    const account = privateKeyToAccount(env.PRIVATE_KEY);
    const walletClient = createWalletClient({ account, transport });
    const { request } = await publicClient.simulateContract({
      address, abi, functionName: "getFortune", args: [question ?? ""], account,
    });
    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const [event] = parseEventLogs({ abi, logs: receipt.logs, eventName: "FortuneTold" });
    return ok(event.args.answer);
  } catch (e) {
    return fail(describe(e));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { code, out, err } = await run(process.argv.slice(2), process.env);
  if (out) console.log(out);
  if (err) console.error(err);
  process.exitCode = code;
}
