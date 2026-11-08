// Salvaged from the old page: one row per thing Yoake can drive.
// icon = file in static/icons/brands; mono icons are inverted to white.
export const providers = [
  { id: "claudecode", label: "Claude Code", org: "Anthropic · your subscription", icon: "claudecode-color", color: "#D97757", endpoint: "claude (your installed CLI)", auth: "Your existing Claude login", protocol: "CLI driven as a subprocess, its own tools", note: "no key stored", log: "agent: claude · own sandbox · permissions bridged", local: true },
  { id: "codex", label: "Codex", org: "OpenAI · your subscription", icon: "codex-color", color: "#7A9DFF", endpoint: "codex (your installed CLI)", auth: "Your existing ChatGPT login", protocol: "CLI driven as a subprocess, its own tools", note: "no key stored", log: "agent: codex · own sandbox · permissions bridged", local: true },
  { id: "opencode", label: "OpenCode", org: "ACP agent", icon: "opencode", mono: true, color: "#E7E7E7", endpoint: "opencode (ACP)", auth: "Whatever OpenCode is configured with", protocol: "Agent Client Protocol over stdio", note: "no key stored", log: "agent: opencode · ACP session attached", local: true },
  { id: "kimi", label: "Kimi", org: "Moonshot AI · ACP agent", icon: "kimi-color", color: "#1783FF", endpoint: "kimi (ACP)", auth: "Your existing Kimi login", protocol: "Agent Client Protocol over stdio", note: "no key stored", log: "agent: kimi · ACP session attached", local: true },
  { id: "anthropic", label: "Anthropic", org: "Messages API", icon: "anthropic", mono: true, color: "#D97757", endpoint: "api.anthropic.com/v1/messages", auth: "Keyring or $ANTHROPIC_API_KEY", protocol: "Messages API · prompt caching", note: "direct TLS", log: "auth: keyring · cache read hit · thinking budget 8k", local: false },
  { id: "openai", label: "OpenAI", org: "Chat completions", icon: "openai", mono: true, color: "#10A37F", endpoint: "api.openai.com/v1/chat/completions", auth: "Keyring or $OPENAI_API_KEY", protocol: "Chat completions · tool calling", note: "direct TLS", log: "auth: keyring · reasoning effort: medium", local: false },
  { id: "gemini", label: "Gemini", org: "Google AI Studio", icon: "gemini-color", color: "#8E75B2", endpoint: "generativelanguage.googleapis.com/v1beta", auth: "Keyring or $GEMINI_API_KEY", protocol: "Long context · multimodal input", note: "direct TLS", log: "auth: keyring · long context window", local: false },
  { id: "deepseek", label: "DeepSeek", org: "DeepSeek AI", icon: "deepseek-color", color: "#5786FE", endpoint: "api.deepseek.com/v1/chat/completions", auth: "Keyring or $DEEPSEEK_API_KEY", protocol: "Streams reasoning tokens", note: "direct TLS", log: "auth: keyring · streaming <think> trace", local: false },
  { id: "mistral", label: "Mistral", org: "Mistral AI · Paris", icon: "mistral-color", color: "#FA520F", endpoint: "api.mistral.ai/v1", auth: "Keyring or $MISTRAL_API_KEY", protocol: "Chat and fill-in-the-middle", note: "direct TLS", log: "auth: keyring · streaming", local: false },
  { id: "qwen", label: "Qwen", org: "Alibaba Cloud", icon: "qwen-color", color: "#6950EF", endpoint: "dashscope.aliyuncs.com/compatible-mode/v1", auth: "Keyring or $DASHSCOPE_API_KEY", protocol: "OpenAI-compatible mode", note: "direct TLS", log: "auth: keyring · 128k context window", local: false },
  { id: "openrouter", label: "OpenRouter", org: "One key, many models", icon: "openrouter-color", color: "#c8ff00", endpoint: "openrouter.ai/api/v1", auth: "Keyring or $OPENROUTER_API_KEY", protocol: "OpenAI-compatible router", note: "direct TLS", log: "auth: keyring · fallback chain set", local: false },
  { id: "bedrock", label: "AWS Bedrock", org: "Your AWS account", icon: "bedrock-color", color: "#6c90b9", endpoint: "bedrock-runtime.{region}.amazonaws.com", auth: "AWS credential chain", protocol: "SigV4 request signing", note: "direct TLS", log: "auth: AWS credential chain (us-east-1)", local: false },
  { id: "ollama", label: "Ollama", org: "Runs on your own hardware", icon: "ollama", mono: true, color: "#E7E7E7", endpoint: "http://localhost:11434", auth: "None, it is local", protocol: "Native and OpenAI-compatible", note: "no cloud calls", log: "runtime: localhost:11434 · local GPU", local: true },
];
// The real ladder (modes.ts, SPEC §4c): read / edit / run / web, per mode.
export const modeSpecs = [
  { hint: "Looks, changes nothing.", cells: ["allow", "deny", "deny", "deny"] },
  { hint: "Asks before any change.", cells: ["allow", "ask", "ask", "ask"] },
  { hint: "Edits freely, asks to run.", cells: ["allow", "allow", "ask", "ask"] },
  { hint: "Its own reviewer decides what to ask, in a sandbox.", cells: ["allow", "allow", "auto", "auto"] },
  { hint: "Edits and runs freely, sandboxed.", cells: ["allow", "allow", "allow", "allow"] },
];
