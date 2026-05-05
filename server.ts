
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer } from "http";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env.production", override: false });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAX_PORT_ATTEMPTS = 10;
const PAYSTACK_BASE_URL = "https://api.paystack.co";
const BANK_PAGE_SIZE = 100;
const MAX_BANK_PAGES = 20;

function getPaystackSecretKey() {
  return (
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_SECRET ||
    process.env.PAYSTACK_SECURITY_KEY ||
    process.env.PAYSTACK_SECRET_LIVE ||
    ""
  );
}

function sendPaystackConfigError(res: express.Response) {
  res.status(500).json({ message: "Paystack secret key is not configured." });
}

async function fetchPaystack(pathname: string, res: express.Response) {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    sendPaystackConfigError(res);
    return null;
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}${pathname}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.status) {
    res.status(response.status || 400).json({
      message: payload?.message || "Paystack request failed.",
    });
    return null;
  }

  return payload;
}

async function fetchPaystackBanks(res: express.Response) {
  const banks = [];

  for (let page = 1; page <= MAX_BANK_PAGES; page += 1) {
    const params = new URLSearchParams({
      country: "nigeria",
      perPage: String(BANK_PAGE_SIZE),
      page: String(page),
    });

    const payload = await fetchPaystack(`/bank?${params.toString()}`, res);
    if (!payload) return null;

    banks.push(...(payload.data || []));

    const pageCount = Number(payload.meta?.pageCount || page);
    const hasMore = page < pageCount && (payload.data || []).length > 0;
    if (!hasMore) break;
  }

  const uniqueBanks = new Map<string, { name: string; code: string }>();
  for (const bank of banks) {
    if (!bank?.name || !bank?.code) continue;
    uniqueBanks.set(bank.code, {
      name: bank.name,
      code: bank.code,
    });
  }

  return [...uniqueBanks.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function listenWithFallback(server: ReturnType<typeof createServer>, preferredPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryListen = (port: number, attemptsRemaining: number) => {
      const handleError = (error: NodeJS.ErrnoException) => {
        server.off("listening", handleListening);
        if (error.code === "EADDRINUSE" && attemptsRemaining > 0) {
          console.warn(`Port ${port} is busy, trying ${port + 1}...`);
          setImmediate(() => tryListen(port + 1, attemptsRemaining - 1));
          return;
        }
        reject(error);
      };

      const handleListening = () => {
        server.off("error", handleError);
        resolve(port);
      };

      server.once("error", handleError);
      server.once("listening", handleListening);
      server.listen(port);
    };

    tryListen(preferredPort, MAX_PORT_ATTEMPTS);
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const preferredPort = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  app.get("/api/paystack/banks", async (_req, res) => {
    try {
      const banks = await fetchPaystackBanks(res);
      if (!banks) return;

      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
      res.json({ banks });
    } catch (error) {
      console.error("Failed to fetch Paystack banks", error);
      res.status(500).json({ message: "Could not load banks." });
    }
  });

  app.get("/api/paystack/resolve-bank", async (req, res) => {
    try {
      const accountNumber = String(req.query.account_number || "").replace(/\D/g, "");
      const bankCode = String(req.query.bank_code || "").trim();

      if (accountNumber.length !== 10 || !bankCode) {
        res.status(400).json({ message: "Enter a 10-digit account number and select a bank." });
        return;
      }

      const payload = await fetchPaystack(`/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`, res);
      if (!payload) return;

      res.json({
        accountNumber: payload.data.account_number,
        accountName: payload.data.account_name,
        bankId: payload.data.bank_id,
      });
    } catch (error) {
      console.error("Failed to resolve Paystack account", error);
      res.status(500).json({ message: "Could not verify account details." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const port = await listenWithFallback(server, preferredPort);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Note: This server and SQLite are deprecated. Data and API are now on Convex.`);
}

startServer();
