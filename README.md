# DARC — Dating and Relationship Coach

DARC (Dating and Relationship Coach) is a modern, AI-powered relationship coaching platform built on top of Next.js and Google's Gemini API. It is designed to act as an empathetic, objective, and psychologically grounded relationship advisor that helps users navigate dating, friendships, marriage, communication advice, breakups, physical intimacy, kinks, and relationship psychology.

---

## Key Features

- **Empathetic AI Persona**: Powered by customized system instructions that keep DARC focused entirely on relationship counseling with direct, concise, and actionable guidance.
- **Dynamic Routing & Session Management**: Chats reside on unique, shareable URLs (`/chat/[chat-id]`). New chats started on the landing page transition seamlessly to their unique paths without disrupting stream connections.
- **Database-Driven Context**: Message histories are saved to a PostgreSQL database via Prisma and combined on the server side prior to querying Gemini, ensuring robust multi-turn conversations.
- **Interactive Sidebar History**: View, share, rename, or delete past chats directly from a responsive collapsible sidebar.
- **Open Intimacy Safe Space**: Tuned safety parameters and guardrails that allow mature, healthy discussions about sex, physical intimacy, and kinks.
- **Secure Authentication**: Built-in Google social login and session handling powered by Better-Auth.

---

## Tech Stack

### Core Frameworks & UI
*   **Next.js 16 (App Router)**: Dynamic routing, Server Actions, Route Handlers, and Turbopack compiler.
*   **React 19**: Modern component model, hooks (`useCallback`, `useMemo`, `useRef`, etc.), and concurrent rendering.
*   **Tailwind CSS 4**: Curated sleek dark mode design system.
*   **Framer Motion**: Smooth entry, exit, and list micro-animations.
*   **Lucide React**: Clean iconography for sidebar controls.

### Backend & Database
*   **PostgreSQL**: Secure relational database for accounts, sessions, chats, and messages.
*   **Prisma ORM**: Modern database schema design, migrations, and type-safe client queries.
*   **Better-Auth**: Feature-rich authentication library utilizing PostgreSQL adapter for session persistence.

### AI Integration
*   **Google GenAI SDK (`@google/genai`)**: Interfacing with the state-of-the-art `gemini-3.1-flash-lite` model for streaming completions.

---

## Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Bun](https://bun.sh/) (recommended package manager and runtime)
- [PostgreSQL](https://www.postgresql.org/) (running locally or hosted)

### 1. Clone & Install Dependencies
Navigate to the project root and install the dependencies:
```bash
bun install
```

### 2. Configure Environment Variables
Create a `.env` file and a `.env.local` file in the root of the project:

#### `.env` (Used for Database Connection)
```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>"
BETTER_AUTH_URL="http://localhost:3000"
```

#### `.env.local` (Used for AI and Auth credentials)
```env
GEMINI_API_KEY="your-gemini-api-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
BETTER_AUTH_SECRET="your-random-better-auth-secret-string"
```

### 3. Initialize the Database
Generate the Prisma client and run migrations to set up the database tables:
```bash
# Generate Prisma Client
bunx prisma generate

# Push schema changes to your database
bunx prisma db push
```

### 4. Run the Development Server
Start the Next.js development server:
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start using DARC.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/            # Better-Auth endpoints
│   │   └── chat/            # Gemini API integration (stream handler)
│   ├── chat/[id]/           # Dynamic chat routes
│   ├── actions.ts           # Server actions for CRUD (chats & messages)
│   ├── layout.tsx           # Global sidebar layout wrapper
│   └── page.tsx             # New chat landing page
├── components/
│   ├── chat/
│   │   └── ChatInterface.tsx # Dynamic client chat manager
│   ├── Sidebar.tsx          # Collapsible history and options dropdown
│   └── ...                  # Reusable UI components
├── lib/
│   ├── auth-client.ts       # Client authentication hooks
│   ├── auth.ts              # Better-Auth server configuration
│   ├── chat-context.tsx     # Global chat context provider
│   └── db.ts                # Prisma Database Client
└── prisma/
    └── schema.prisma        # Database schema definitions
```

---

## Code Quality & Production Build

### Run Linter
Verify code style and rules:
```bash
bun run lint
```

### Production Build
Generate an optimized production build of the Next.js application:
```bash
bun run build
```
