# PC Quotation Builder

A minimal, fast web app for a computer hardware shop to create custom PC build quotations from its own inventory.

## Features

- **Quotation Builder**: pick components category by category (CPU, GPU, RAM, etc.), enter the selling price manually per quote, set quantity, and generate the grand total in ₹.
- **Inventory Admin** (`/admin`): add / edit / delete products per category (name, brand, specs, notes).
- **Quotations** (`/quotations`): saved quotation history with auto reference numbers (`Q-YYYY-NNNN`) and a print-optimized layout (use browser Print → Save as PDF).

## Tech Stack

- Next.js (App Router, JavaScript)
- SQLite + Prisma ORM (local file database, zero setup)
- Tailwind CSS

## Run Locally

Requires Node.js 18+.

```bash
npm install
npx prisma migrate dev --name init   # creates the SQLite DB and seeds categories + sample products
npm run dev
```

Open http://localhost:3000

- `/` — Quotation Builder
- `/quotations` — Saved quotations (view / print)
- `/admin` — Inventory management

The database is a local file at `prisma/dev.db`. Back it up by copying that file.
