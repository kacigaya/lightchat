# LightChat

LightChat is a modern, minimalist AI chat application powered by Google Gemini through the [Vercel AI SDK](https://ai-sdk.dev/) for real-time intelligent responses.

Live demo: [https://lightchat-two.vercel.app](https://lightchat-two.vercel.app)

---

## Features

- Modern, responsive chat interface with smooth animations
- Server-side streaming via the Vercel AI SDK and Google Gemini
- Conversation management (create, rename, delete)
- Markdown rendering with syntax-highlighted code blocks
- Dark mode UI
- Mobile-friendly layout

---

## Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- A Google Gemini API key (set as `GOOGLE_GENERATIVE_AI_API_KEY`)

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gayakaci20/light-chat.git
   cd light-chat
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Create a `.env.local` file at the project root with your API key:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   bun run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Usage

1. Open the application in your browser.
2. Type a message in the input field.
3. Press **Enter** or click the send button.
4. The AI will respond in real time via streaming.

---

## Tech Stack

- **Next.js 16** with Turbopack
- **React 19** + **TypeScript**
- **Vercel AI SDK** (`ai`, `@ai-sdk/google`, `@ai-sdk/react`)
- **Tailwind CSS 4**
- **Zustand** for client-side state management
- **Framer Motion** for animations
- **Bun** as the package manager and runtime

---

## Project Structure

```
src/
  app/
    api/chat/route.ts   # Server-side AI streaming endpoint
    layout.tsx           # Root layout
    page.tsx             # Home page
    globals.css          # Global styles
  components/
    Chat.tsx             # Chat interface (useChat hook)
    ChatMessage.tsx      # Message rendering with markdown
    Sidebar.tsx          # Conversation sidebar
    ModelSelector.tsx    # AI model selector
    LoadingDots.tsx      # Loading animation
  lib/
    store.ts             # Zustand store
    utils.ts             # Utility functions
```

---

## License

This project is licensed under the MIT License. Free and open source.
