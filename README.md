# LightChat

LightChat is a modern, minimalist AI chat application that supports **17 LLM providers** through the [Vercel AI SDK](https://ai-sdk.dev/) — all configured directly in the browser with no server-side secrets required.

Live demo: [https://lightchat-two.vercel.app](https://lightchat-two.vercel.app)

---

## Features

- **Multi-provider support** — switch between 17 LLM providers from a single settings panel
- **In-browser API key management** — keys stored in `localStorage`, never on the server
- **Real-time streaming** via Vercel AI SDK v6 (`streamText`)
- Conversation management (create, rename, delete)
- Markdown rendering with syntax-highlighted code blocks
- Dark mode UI
- Mobile-friendly layout
- Optional web search tool (Tavily-backed with `TAVILY_API_KEY`)
- Optional browser speech-to-text input

---

## Supported Providers

| Provider | Tier | Notes |
|----------|------|-------|
| OpenAI | API key | GPT-4.1, o3, o4-mini, o1 |
| Anthropic | API key | Claude 4.6, 4.5, 3.5 |
| Google Generative AI | API key | Gemini 2.5 Pro/Flash, 2.0 Flash |
| xAI Grok | API key | Grok 3, Grok 3 Mini |
| Mistral | API key | Mistral Large, Pixtral, Codestral |
| Groq | API key | Llama 4, LLaMA 3.3, Qwen QwQ, DeepSeek R1 |
| Cohere | API key | Command R+, Command R7B |
| DeepSeek | API key | DeepSeek Chat (V3), Reasoner (R1) |
| Perplexity | API key | Sonar Pro, Deep Research |
| Cerebras | API key | Llama 4 Maverick, Qwen 3 235B |
| Fireworks AI | API key | Qwen 3 Coder, DeepSeek V3.1, Kimi K2 |
| DeepInfra | API key | DeepSeek V3.2, LLaMA 3.3, Phi-4 |
| Together AI | API key | Qwen 3 235B, LLaMA 3.3, Turbo variants |
| Azure OpenAI | API key + resource name | GPT-4.1, o3-mini, o1 |
| OpenAI-compatible | API key + base URL | Any OpenAI-spec endpoint |
| Amazon Bedrock | AWS IAM credentials | Claude 4.6, Nova Pro/Lite/Micro |
| Google Vertex AI | GCP project + ADC | Gemini 2.5 Pro/Flash |

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- An API key from **any** supported provider (no server environment variables needed)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gayakaci20/light-chat.git
   cd light-chat
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), click the **Settings** button in the sidebar, choose a provider, and enter your API key.

> **No `.env` file is required** for normal chat usage.  
> If you enable **Web Search** in Settings, configure `TAVILY_API_KEY` on the server to power the `web_search` tool.

---

## Settings UI

Open the settings panel by clicking the gear icon (⚙) at the bottom of the sidebar, or via the badge in the top-right corner of the chat.

The panel lets you:

- **Select a provider** from the full list of 17 supported providers
- **Enter your API key** (password-masked, with show/hide toggle)
- **Configure extra fields** where required (Azure resource name, Bedrock IAM credentials, Vertex project ID…)
- **Select a model** from a pre-populated list for the active provider
- **Test the connection** — fires a minimal API call to validate credentials before you start chatting
- **Remove a key** — wipes the stored credential for any provider

Settings are saved per-provider, so you can store multiple API keys and switch providers without re-entering credentials.

---

## Security Note

> ⚠ API keys are stored in **browser `localStorage`** (client-side only). They travel over HTTPS in the request body to your Next.js API route and are used server-side for the duration of a single request only — they are never persisted server-side.
>
> This approach is appropriate for personal or local use. For shared or production deployments, use server-side secret management (e.g. environment variables, a secrets manager) instead.

---

## Adding a Custom Provider

LightChat supports any OpenAI-compatible API via the **"OpenAI-compatible"** provider option. Enter your base URL and model ID in the settings panel.

To add a natively supported provider, make two edits:

1. **`src/lib/providers.ts`** — add a new entry to `PROVIDERS` (models, labels, docs URL, any extra config fields).
2. **`src/app/api/_model-factory.ts`** — add a `case` in the `switch` using the corresponding `@ai-sdk/*` package.

No other files need to change.

---

## Tech Stack

- **Next.js 16** with Turbopack
- **React 19** + **TypeScript**
- **Vercel AI SDK v6** (`ai`, `@ai-sdk/react`, and 15 provider packages)
- **Tailwind CSS 4**
- **Zustand** — conversation state
- **Framer Motion** — animations
- **Bun** — package manager and runtime

---

## Project Structure

```
src/
  app/
    api/
      _model-factory.ts      # Server-side model factory (all 17 providers)
      chat/
        route.ts             # Streaming chat endpoint (POST /api/chat)
        test/route.ts        # Connection test endpoint (POST /api/chat/test)
    layout.tsx               # Root layout — wraps app in <LLMProvider>
    page.tsx                 # Home page
    globals.css
  components/
    Chat.tsx                 # Chat interface (useChat hook)
    ChatMessage.tsx          # Message rendering with markdown
    SettingsModal.tsx        # Provider / API key / model settings panel
    Sidebar.tsx              # Conversation sidebar + settings button
    LoadingDots.tsx          # Loading animation
  contexts/
    llm-context.tsx          # LLMProvider + useLLM() hook (localStorage persistence)
  lib/
    providers.ts             # Provider catalogue — models, labels, config fields
    store.ts                 # Zustand store (conversations)
    utils.ts                 # Utility functions (cn helper)
```

---

## License

This project is licensed under the MIT License. Free and open source.
