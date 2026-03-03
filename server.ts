import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import session from "express-session";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("q_platform.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    full_name TEXT,
    q_score INTEGER DEFAULT 100,
    consistency_score INTEGER DEFAULT 100,
    timeliness_score INTEGER DEFAULT 100,
    stability_score INTEGER DEFAULT 100,
    wallet_balance INTEGER DEFAULT 0,
    boot_balance INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by INTEGER,
    is_admin BOOLEAN DEFAULT 0,
    password_hash TEXT,
    is_verified BOOLEAN DEFAULT 0,
    verification_token TEXT,
    verification_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'TV', 'Phone', 'Laptop', etc.
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATETIME,
    end_date DATETIME,
    reward_formula TEXT, -- e.g., '100 per referral'
    boot_pool_max INTEGER,
    boots_issued INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS boot_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'earned_campaign', 'earned_behavior', 'payment'
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    base_cost INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS slot_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    device_limit INTEGER NOT NULL,
    downloads_enabled BOOLEAN DEFAULT 0,
    min_q_score INTEGER DEFAULT 0,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER,
    billing_cycle_start DATETIME,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
  );

  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    slot_type_id INTEGER,
    user_id INTEGER,
    status TEXT DEFAULT 'available',
    renewal_date DATETIME,
    allocation TEXT, -- Profile name or sub-account detail
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (slot_type_id) REFERENCES slot_types(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER, -- NULL if broadcast or specific admin
    content TEXT,
    image_data TEXT, -- Base64 for simplicity in this environment
    is_from_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lunar_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    platform TEXT,
    genre TEXT,
    added_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lunar_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    status TEXT DEFAULT 'active',
    expiry_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'funding', 'payment', 'refund'
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const subCount = db.prepare("SELECT COUNT(*) as count FROM subscriptions").get() as { count: number };
if (subCount.count === 0) {
  const insertSub = db.prepare("INSERT INTO subscriptions (name, description, base_cost) VALUES (?, ?, ?)");
  const insertSlotType = db.prepare("INSERT INTO slot_types (subscription_id, name, price, device_limit, downloads_enabled, min_q_score) VALUES (?, ?, ?, ?, ?, ?)");

  const netflixId = insertSub.run("Netflix", "Premium 4K Streaming", 8000).lastInsertRowid;
  insertSlotType.run(netflixId, "Profile Slot", 2500, 4, 1, 70);
  insertSlotType.run(netflixId, "Download Slot", 1700, 2, 1, 50);
  insertSlotType.run(netflixId, "Streaming Slot", 1000, 2, 0, 0);

  const spotifyId = insertSub.run("Spotify", "Family Plan", 1500).lastInsertRowid;
  insertSlotType.run(spotifyId, "Standard Slot", 750, 1, 1, 0);

  const youtubeId = insertSub.run("YouTube Premium", "Family Plan", 1700).lastInsertRowid;
  insertSlotType.run(youtubeId, "Standard Slot", 800, 1, 1, 0);
}

const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare(`
    INSERT INTO users (email, phone, full_name, q_score, wallet_balance, boot_balance, referral_code, is_admin) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('demo@jointheq.com', '+2348012345678', 'Demo User', 88, 5000, 350, 'Q-DEMO-123', 0);

  db.prepare(`
    INSERT INTO users (email, phone, full_name, q_score, wallet_balance, boot_balance, referral_code, is_admin) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('admin@jointheq.com', '+2348000000000', 'Q Admin', 100, 0, 0, 'Q-ADMIN-001', 1);
}

const campaignCount = db.prepare("SELECT COUNT(*) as count FROM campaigns").get() as { count: number };
if (campaignCount.count === 0) {
  db.prepare(`
    INSERT INTO campaigns (name, description, start_date, end_date, reward_formula, boot_pool_max)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'Easter Jar 🌸',
    'Grow your Easter Jar by inviting friends. Earn 100 Boots per qualified referral.',
    new Date().toISOString(),
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    '100_per_referral',
    500000
  );
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'q-secret-fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Console Auth State
  const loginAttempts = new Map<string, { count: number, lockUntil: number }>();

  const authMiddleware = (req: any, res: any, next: any) => {
    if (req.session.admin) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const BASE_URL = process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : 'http://localhost:3000';

  // WebSocket handling
  const clients = new Map<number, WebSocket>();

  wss.on("connection", (ws) => {
    let currentUserId: number | null = null;

    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());

      if (data.type === "auth") {
        currentUserId = data.userId;
        if (currentUserId) clients.set(currentUserId, ws);
      }

      if (data.type === "chat") {
        const { senderId, receiverId, content, imageData, isFromAdmin } = data;
        const result = db.prepare(`
          INSERT INTO messages (sender_id, receiver_id, content, image_data, is_from_admin)
          VALUES (?, ?, ?, ?, ?)
        `).run(senderId, receiverId || null, content, imageData || null, isFromAdmin ? 1 : 0);

        const msg = {
          id: result.lastInsertRowid,
          senderId,
          receiverId,
          content,
          imageData,
          isFromAdmin,
          createdAt: new Date().toISOString()
        };

        // Broadcast to receiver if online
        if (receiverId && clients.has(receiverId)) {
          clients.get(receiverId)?.send(JSON.stringify({ type: "message", data: msg }));
        }

        // If from user, notify all admins
        if (!isFromAdmin) {
          const admins = db.prepare("SELECT id FROM users WHERE is_admin = 1").all() as any[];
          admins.forEach(admin => {
            if (clients.has(admin.id)) {
              clients.get(admin.id)?.send(JSON.stringify({ type: "message", data: msg }));
            }
          });
        }

        // Echo back to sender
        ws.send(JSON.stringify({ type: "message", data: msg }));
      }
    });

    ws.on("close", () => {
      if (currentUserId) clients.delete(currentUserId);
    });
  });

  // Auth & Signup Routes
  app.post("/api/signup", async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const hash = await bcrypt.hash(password, 10);
      const token = uuidv4();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      const referralCode = `Q-${name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      db.prepare(`
        INSERT INTO users (full_name, email, phone, password_hash, verification_token, verification_token_expires, referral_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, email, phone, hash, token, expires, referralCode);

      // Send Smart Link via Resend
      const verificationLink = `${BASE_URL}/verify-account?token=${token}`;

      const { error } = await resend.emails.send({
        from: 'Q Platform <onboarding@resend.dev>', // Use verified domain in prod
        to: email,
        subject: 'Verify your Q Account',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #141414;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Welcome to Q, ${name}!</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">You're almost there. Tap the button below to verify your account and start your journey with Q.</p>
            <a href="${verificationLink}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 30px 0;">Verify Account</a>
            <p style="font-size: 14px; color: #999;">If you didn't create this account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #bbb;">© 2026 jointheq. All rights reserved.</p>
          </div>
        `
      });

      if (error) {
        console.error("Resend Error:", error);
        // We still created the user, so they can try to re-verify or we can handle it
      }

      res.json({ success: true, message: "Verification email sent" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/verify-account", (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const user = db.prepare("SELECT * FROM users WHERE verification_token = ?").get(token) as any;

    if (!user) return res.status(400).json({ error: "Invalid token" });
    if (new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ error: "Token expired" });
    }

    db.prepare("UPDATE users SET is_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?").run(user.id);

    // Redirect to login or success page
    res.redirect("/?verified=true");
  });

  app.post("/api/user/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.is_verified) return res.status(403).json({ error: "Please verify your email first" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    // For demo simplicity, just returning user info
    // In production, use session or JWT
    res.json({ success: true, user });
  });

  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  app.get("/api/subscriptions", (req, res) => {
    const subs = db.prepare("SELECT * FROM subscriptions WHERE is_active = 1").all();
    const subsWithSlots = subs.map((sub: any) => {
      const slots = db.prepare("SELECT * FROM slot_types WHERE subscription_id = ?").all(sub.id);
      return { ...sub, slot_types: slots };
    });
    res.json(subsWithSlots);
  });

  app.post("/api/wallet/fund", (req, res) => {
    const { userId, amount } = req.body;
    db.transaction(() => {
      db.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(amount, userId);
      db.prepare("INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'funding', 'Wallet funding via Paystack')").run(userId, amount);
    })();
    res.json({ success: true });
  });

  app.get("/api/campaigns", (req, res) => {
    const campaigns = db.prepare("SELECT * FROM campaigns WHERE status = 'active'").all();
    res.json(campaigns);
  });

  app.post("/api/slots/join", (req, res) => {
    const { userId, slotTypeId, useBoots } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    const slotType = db.prepare("SELECT * FROM slot_types WHERE id = ?").get(slotTypeId) as any;

    if (!user || !slotType) return res.status(404).json({ error: "User or Slot Type not found" });

    const totalPrice = slotType.price;
    let bootsToUse = 0;
    let coinsToUse = totalPrice;

    if (useBoots) {
      // Logic: 50% Coins + 50% Boots
      bootsToUse = totalPrice / 2;
      coinsToUse = totalPrice / 2;

      if (user.boot_balance < bootsToUse) {
        return res.status(400).json({ error: "Insufficient boot balance for 50/50 split" });
      }
    }

    if (user.wallet_balance < coinsToUse) return res.status(400).json({ error: "Insufficient coin balance" });
    if (user.q_score < slotType.min_q_score) return res.status(400).json({ error: "Q Score too low for this slot" });

    // Find or create a group with space
    let group = db.prepare(`
      SELECT g.id FROM groups g 
      JOIN subscriptions s ON g.subscription_id = s.id
      WHERE g.subscription_id = ? AND g.status = 'active'
      LIMIT 1
    `).get(slotType.subscription_id) as any;

    if (!group) {
      const result = db.prepare("INSERT INTO groups (subscription_id, billing_cycle_start) VALUES (?, ?)").run(slotType.subscription_id, new Date().toISOString());
      group = { id: result.lastInsertRowid };
    }

    db.transaction(() => {
      if (coinsToUse > 0) {
        db.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").run(coinsToUse, userId);
        db.prepare("INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'payment', ?)").run(userId, coinsToUse, `Joined ${slotType.name} (Coins)`);
      }

      if (bootsToUse > 0) {
        db.prepare("UPDATE users SET boot_balance = boot_balance - ? WHERE id = ?").run(bootsToUse, userId);
        db.prepare("INSERT INTO boot_transactions (user_id, amount, type, description) VALUES (?, ?, 'payment', ?)").run(userId, -bootsToUse, `Joined ${slotType.name} (Boots)`);
      }

      db.prepare("INSERT INTO slots (group_id, slot_type_id, user_id, status, renewal_date) VALUES (?, ?, ?, 'active', ?)").run(
        group.id,
        slotTypeId,
        userId,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      );
    })();

    res.json({ success: true });
  });

  app.get("/api/user/:id/slots", (req, res) => {
    const slots = db.prepare(`
      SELECT s.*, st.name as slot_name, sub.name as sub_name, st.price
      FROM slots s
      JOIN slot_types st ON s.slot_type_id = st.id
      JOIN subscriptions sub ON st.subscription_id = sub.id
      WHERE s.user_id = ?
    `).all(req.params.id);
    res.json(slots);
  });

  app.post("/api/slots/:id/allocation", (req, res) => {
    const { allocation } = req.body;
    db.prepare("UPDATE slots SET allocation = ? WHERE id = ?").run(allocation, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/user/:id/devices", (req, res) => {
    const devices = db.prepare("SELECT * FROM devices WHERE user_id = ?").all(req.params.id);
    res.json(devices);
  });

  app.post("/api/user/:id/devices", (req, res) => {
    const { name, type } = req.body;
    db.prepare("INSERT INTO devices (user_id, name, type) VALUES (?, ?, ?)").run(req.params.id, name, type);
    res.json({ success: true });
  });

  app.delete("/api/devices/:id", (req, res) => {
    db.prepare("DELETE FROM devices WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/chat/history/:userId", (req, res) => {
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE sender_id = ? OR receiver_id = ? 
      ORDER BY created_at ASC
    `).all(req.params.userId, req.params.userId);
    res.json(messages);
  });

  app.get("/api/admin/chat/users", (req, res) => {
    const users = db.prepare(`
      SELECT DISTINCT u.id, u.full_name, u.email
      FROM users u
      JOIN messages m ON u.id = m.sender_id
      WHERE u.is_admin = 0
    `).all();
    res.json(users);
  });

  app.post("/api/user/:id/update-phone", (req, res) => {
    const { phone } = req.body;
    const { id } = req.params;
    try {
      db.prepare("UPDATE users SET phone = ? WHERE id = ?").run(phone, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/console/login", async (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || 'unknown';
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminHash = process.env.SUPER_ADMIN_PASSWORD_HASH;

    // Check lock
    const attempts = loginAttempts.get(ip);
    if (attempts && attempts.lockUntil > Date.now()) {
      const remaining = Math.ceil((attempts.lockUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `Too many attempts. Try again in ${remaining} minutes.` });
    }

    if (!adminEmail || !adminHash) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const clearAttempts = () => loginAttempts.delete(ip);
    const incrementAttempts = () => {
      const current = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
      current.count += 1;
      if (current.count >= 5) {
        current.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins
      }
      loginAttempts.set(ip, current);
    };

    if (email !== adminEmail) {
      incrementAttempts();
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, adminHash);

    if (isValid) {
      clearAttempts();
      (req.session as any).admin = { email };
      res.json({ success: true });
    } else {
      incrementAttempts();
      res.status(401).json({ error: "Invalid credentials." });
    }
  });

  app.get("/api/console/status", (req, res) => {
    if ((req.session as any).admin) {
      res.json({ authenticated: true, user: (req.session as any).admin });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.post("/api/console/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  // Protect Admin API Routes
  app.use("/api/admin/*", authMiddleware);

  // Server-side protection for console routes (browser requests)
  app.get("/console/*", (req, res, next) => {
    if (req.path === "/console" || req.path === "/console/") return next();
    if (!(req.session as any).admin) {
      return res.redirect("/console");
    }
    next();
  });

  // Lunar Endpoints
  app.get("/api/lunar/status/:userId", (req, res) => {
    const sub = db.prepare("SELECT * FROM lunar_subscriptions WHERE user_id = ?").get(req.params.userId) as any;
    if (!sub) return res.json({ subscribed: false });

    const isExpired = new Date(sub.expiry_date) < new Date();
    res.json({
      subscribed: !isExpired,
      expiry_date: sub.expiry_date,
      status: sub.status
    });
  });

  app.post("/api/lunar/subscribe", (req, res) => {
    const { userId } = req.body;
    const price = 1500;

    const user = db.prepare("SELECT wallet_balance FROM users WHERE id = ?").get(userId) as any;
    if (!user || user.wallet_balance < price) {
      return res.status(400).json({ error: "Insufficient balance to subscribe to Lunar (₦1,500 required)" });
    }

    db.transaction(() => {
      db.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").run(price, userId);
      db.prepare("INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'payment', 'Lunar Subscription')").run(userId, price);

      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare(`
        INSERT INTO lunar_subscriptions (user_id, expiry_date) 
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET expiry_date = ?, status = 'active'
      `).run(userId, expiry, expiry);
    })();

    res.json({ success: true });
  });

  app.get("/api/lunar/memories", (req, res) => {
    const memories = db.prepare("SELECT * FROM lunar_memories ORDER BY created_at DESC").all();
    res.json(memories);
  });

  app.post("/api/lunar/memories", (req, res) => {
    const { title, description, platform, genre, addedBy } = req.body;
    db.prepare(`
      INSERT INTO lunar_memories (title, description, platform, genre, added_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, description, platform, genre, addedBy);
    res.json({ success: true });
  });

  app.delete("/api/lunar/memories/:id", (req, res) => {
    db.prepare("DELETE FROM lunar_memories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
