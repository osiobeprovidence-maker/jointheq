
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer } from "http";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAX_PORT_ATTEMPTS = 10;

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
