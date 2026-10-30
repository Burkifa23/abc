import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Why does `castVote` add `v.weight` to the tally instead of adding 1?", options: ["Solidity cannot add the literal 1 to an element of a storage array", "Weight records how many times the voter has called the function", "A voter may carry weight handed over by others", "The officer can raise any resident's influence after they register"], answer: 2, explain: "Delegation adds the delegator's weight onto the receiver. When the receiver votes, one call must count their own vote plus everything handed to them." },
  { q: "Ama has delegated to Kofi, and Kofi has not voted. Now Kofi calls `delegate(ama)`. What should happen?", options: ["Ama's weight is doubled and both votes stay valid", "The call reverts, because Ama's chain leads back to Kofi", "Both calls succeed and the two weights cancel each other out", "Kofi's vote is counted for option 0 by default instead"], answer: 1, explain: "Following Ama's chain ends at Kofi, so `to == msg.sender`. Allowing it would create a loop in which nobody ever casts the combined weight." },
  { q: "What is the reason for the `MAX_HOPS` cap in the delegation loop?", options: ["It limits how many residents the officer may register in total", "Mappings in Solidity cannot be read more than eight times per call", "It stops the compiler from rejecting the loop as an infinite loop", "It keeps the gas cost of walking a chain bounded"], answer: 3, explain: "Without a cap, someone could build a very long chain on purpose so that later delegators run out of gas walking it. The cap makes the cost predictable." },
  { q: "Spot the bug: a `delegate` that checks `me.weight == 0` and then does `voters[to].weight += me.weight;` but never reads or sets `me.done`. What goes wrong?", options: ["A voter can delegate again and again, piling weight onto the target", "A `Voter storage` reference is not allowed in external functions", "The `+=` operator cannot be applied to a struct member in a mapping", "`me.weight` has to be copied into memory before it is read"], answer: 0, explain: "Without the done check and `me.done = true`, the same person can delegate repeatedly (or vote and then delegate) and multiply their influence. Storage references and `+=` on struct members are fine." },
  { q: "Esi voted for option 2. Later Kofi, who has weight 1, delegates to Esi. What does the contract do with Kofi's weight?", options: ["Adds it to Esi's weight so it counts the next time she votes", "Discards it, because Esi has already used her vote", "Adds it straight to `tally[2]`, the option Esi chose", "Returns it to Kofi so that he has to vote himself"], answer: 2, explain: "Esi can no longer vote, so adding to her weight would strand the votes. The contract adds the weight straight to the option she picked." },
  { q: "What does `voters[someone].weight == 0` tell the contract?", options: ["The address has already voted and used up its weight", "The address was never registered; unset mapping entries read as zero", "The address belongs to the returning officer", "The address has delegated its vote to somebody else"], answer: 1, explain: "A mapping returns zero values for keys never written. Registration sets weight to 1, so 0 means never registered." },
  { q: "In `leader()`, two options tie for the highest count. Which one is returned?", options: ["The one with the higher index of the two", "Neither; the function reverts on a tie", "A random one, picked using `block.timestamp`", "The lower index, since only a strictly higher count replaces the best"], answer: 3, explain: "The comparison is `>` rather than `>=`, so a later option with an equal count does not replace the earlier one." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  delegate: {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Ballot {
    struct Voter {
        uint256 weight;
        bool done;
        address handedTo;
        uint256 choice;
    }

    uint256 constant MAX_HOPS = 8;
    address public immutable returningOfficer;
    mapping(address => Voter) public voters;
    uint256[] public tally;

    error NotOfficer();
    error NotRegistered();
    error AlreadyDone();
    error SelfDelegation();
    error ChainTooLong();

    constructor(uint256 optionCount) {
        returningOfficer = msg.sender;
        tally = new uint256[](optionCount);
        voters[msg.sender].weight = 1;
    }

    function register(address resident) external {
        if (msg.sender != returningOfficer) revert NotOfficer();
        voters[resident].weight = 1;
    }

    function castVote(uint256 option) external {
        Voter storage v = voters[msg.sender];
        if (v.weight == 0) revert NotRegistered();
        if (v.done) revert AlreadyDone();
        v.done = true;
        v.choice = option;
        tally[option] += v.weight;
    }

    function delegate(address to) external {
        // TODO:
        // 1. revert NotRegistered() if the caller has weight 0, AlreadyDone() if done
        // 2. follow handedTo links from \`to\` to the end of the chain
        //    (revert ChainTooLong() after MAX_HOPS steps)
        // 3. revert SelfDelegation() if the chain ends at the caller
        // 4. mark the caller done and record handedTo
        // 5. if the target already voted, add the weight to their tally entry,
        //    otherwise add it to the target's weight
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Ballot {
    struct Voter {
        uint256 weight;
        bool done;
        address handedTo;
        uint256 choice;
    }

    uint256 constant MAX_HOPS = 8;
    address public immutable returningOfficer;
    mapping(address => Voter) public voters;
    uint256[] public tally;

    error NotOfficer();
    error NotRegistered();
    error AlreadyDone();
    error SelfDelegation();
    error ChainTooLong();

    constructor(uint256 optionCount) {
        returningOfficer = msg.sender;
        tally = new uint256[](optionCount);
        voters[msg.sender].weight = 1;
    }

    function register(address resident) external {
        if (msg.sender != returningOfficer) revert NotOfficer();
        voters[resident].weight = 1;
    }

    function castVote(uint256 option) external {
        Voter storage v = voters[msg.sender];
        if (v.weight == 0) revert NotRegistered();
        if (v.done) revert AlreadyDone();
        v.done = true;
        v.choice = option;
        tally[option] += v.weight;
    }

    function delegate(address to) external {
        Voter storage me = voters[msg.sender];
        if (me.weight == 0) revert NotRegistered();
        if (me.done) revert AlreadyDone();

        for (uint256 hops = 0; voters[to].handedTo != address(0); hops++) {
            if (hops == MAX_HOPS) revert ChainTooLong();
            to = voters[to].handedTo;
        }
        if (to == msg.sender) revert SelfDelegation();

        Voter storage target = voters[to];
        if (target.weight == 0) revert NotRegistered();

        me.done = true;
        me.handedTo = to;

        if (target.done) {
            tally[target.choice] += me.weight;
        } else {
            target.weight += me.weight;
        }
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Ballot", kind: "function", name: "delegate", inputs: ["address"], outputs: [], stateMutability: "nonpayable", message: "Has delegate(address)" },
      { type: "regex", pattern: "revert\\s+SelfDelegation\\s*\\(", message: "Reverts with SelfDelegation when the chain ends at the caller" },
      { type: "regex", pattern: "\\.handedTo\\s*(!=|==)\\s*address\\s*\\(\\s*0\\s*\\)", message: "Follows handedTo links until a zero address" },
      { type: "regex", pattern: "\\.done\\s*=\\s*true\\s*;", message: "Marks the delegator as done" },
      { type: "regex", pattern: "\\bweight\\s*\\+=", message: "Passes the weight on to the target" },
    ],
  },
};
