export const repo = "https://github.com/Burkifa23/abc";

export const socials = [
  { name: "GitHub", href: repo },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/ashesiblockchaincommunity/" },
  { name: "X", href: "https://x.com/ashesiblockcomm" },
  { name: "Instagram", href: "https://www.instagram.com/ashesiblockchaincommunity" },
  { name: "TikTok", href: "https://www.tiktok.com/@ashesiblockchaincomm" },
  { name: "Linktree", href: "https://linktr.ee/AshesiBlockchainCommunity" },
];

const codespace = (dir: string) =>
  `https://codespaces.new/Burkifa23/abc?quickstart=1&devcontainer_path=.devcontainer%2F${dir}%2Fdevcontainer.json`;

export type Lab = {
  n: number;
  phase: string;
  title: string;
  problem: string;
  focus: string[];
  status: "live" | "remix" | "soon";
  href?: string;
  source?: string;
};

export const labs: Lab[] = [
  {
    n: 1, phase: "Foundations", title: "The Trust Problem",
    problem: "Why a shared ledger beats a single record keeper. Unplugged ledger simulation and SHA-256 demo.",
    focus: ["ledgers", "hashing", "consensus"], status: "soon",
  },
  {
    n: 2, phase: "Foundations", title: "Shared Bank",
    problem: "Your first contract, written in the browser with Remix. No setup at all.",
    focus: ["uint", "mapping", "state"], status: "remix", href: "https://remix.ethereum.org",
  },
  {
    n: 3, phase: "Civic", title: "Secure Campus Elections",
    problem: "Ballot stuffing and altered tallies. Build a contract that allows one vote per wallet.",
    focus: ["struct", "mapping", "msg.sender"], status: "live",
    href: codespace("03-campus-elections"), source: `${repo}/tree/main/labs/03-campus-elections`,
  },
  {
    n: 4, phase: "Civic", title: "Anonymous Club Access",
    problem: "Prove you hold a valid student ID without revealing it.",
    focus: ["keccak256", "abi.encodePacked"], status: "soon",
  },
  {
    n: 5, phase: "Civic", title: "Transparent Procurement",
    problem: "Sealed-bid tenders with funds held in automated escrow. No fake invoices, no altered bids.",
    focus: ["payable", "block.timestamp"], status: "soon",
  },
  {
    n: 6, phase: "Civic", title: "Land Title Registry",
    problem: "One plot, one title. Map land to unique tokens that cannot be duplicated.",
    focus: ["ERC-721", "transfers"], status: "soon",
  },
  {
    n: 7, phase: "Capstone", title: "Open-Source Africa Sprint",
    problem: "Teams polish workshops 3 to 6 into one open-source civic contract library.",
    focus: ["review", "publish"], status: "soon",
  },
];
