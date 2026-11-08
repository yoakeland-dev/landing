// The sample chats, shared by the demo window and the warm "needs you" star.
const now = Date.now();
export const chats = $state([
  { id: 1, title: "fix the flaky auth test", remote: "hetzner-fsn1", via: "tls", provider: "claude", pc: "#d4896a", state: "needs", since: now,
    prompt: "The auth test fails about one run in five. Find out why and fix it.",
    reply: "It races with the token refresh. I moved the clock mock ahead of the login call. I want to run the suite three times to confirm.",
    tools: ["read 4 files", "edited auth.test.ts"], live: "running the suite", ask: { q: "Run npm test three times?", d: "in ~/work/api" } },
  { id: 2, title: "port the settings page to svelte 5", remote: "homelab", via: "unix", provider: "codex", pc: "#6fcdb4", state: "working", since: now,
    prompt: "Port the settings page to Svelte 5 runes.", reply: "Converting stores to $state. Six of eleven components are done.",
    tools: ["edited 6 files", "ran svelte-check"], live: "editing SettingsPanel.svelte" },
  { id: 3, title: "draft the 0.1.8 release notes", remote: "laptop", via: "webrtc", provider: "deepseek", pc: "#6b86ff", state: "working", since: now,
    prompt: "Write release notes from the last 40 commits.", reply: "Grouping the commits by area. Fixes come first, then what is new.",
    tools: ["read git log"], live: "reading commit messages" },
  { id: 4, title: "bump deps and run the audit", remote: "hetzner-fsn1", via: "tls", provider: "claude", pc: "#d4896a", state: "ready", since: now,
    prompt: "Bump the dependencies and run npm audit.", reply: "Updated four packages. The audit is clean and nothing needed a code change.",
    tools: ["ran npm update", "ran npm audit"], live: "checking the lockfile" },
  { id: 5, title: "why is the build slower", remote: "homelab", via: "unix", provider: "codex", pc: "#6fcdb4", state: "ready", since: now,
    prompt: "The build got slower this week. Find out why.", reply: "A new image plugin ran on every build. I cached its output and the build is back to normal.",
    tools: ["read vite.config.js", "ran the build twice"], live: "timing the build" },
]);

const ASKS = [
  { q: "Delete the build folder?", d: "rm -rf build/" },
  { q: "Push to origin/main?", d: "3 commits ahead" },
  { q: "Install a new dependency?", d: "zod, 61 kB" },
  { q: "Run the migration?", d: "on the staging database" },
];
let lastTouch = 0, quietSince = 0, askIdx = 0;

export const by = (s) => chats.filter((c) => c.state === s);
export const touch = () => (lastTouch = Date.now());

export function answer(id, a) {
  const c = chats.find((c) => c.id === id);
  if (!c || c.state !== "needs") return;
  c.state = a === "deny" ? "ready" : "working";
  c.since = Date.now();
  if (a === "deny") c.reply = "Stopped. I did not run it. Tell me how you want to continue.";
  touch();
}

// idle chats drift between working and ready; a new question turns up once it has been quiet a while
export function tick() {
  const t = Date.now();
  if (t - lastTouch < 9000) return;
  for (const c of chats) {
    if (c.state === "working" && t - c.since > 12000 + c.id * 1300 && Math.random() < 0.4) { c.state = "ready"; c.since = t; }
    else if (c.state === "ready" && t - c.since > 10000 && Math.random() < 0.3) { c.state = "working"; c.since = t; }
  }
  if (!by("needs").length) {
    quietSince ||= t;
    const w = by("working");
    if (t - quietSince > 5000 && w.length) {
      const c = w[Math.floor(Math.random() * w.length)];
      c.state = "needs"; c.ask = ASKS[askIdx++ % ASKS.length]; c.since = t; quietSince = 0;
    }
  } else quietSince = 0;
}
