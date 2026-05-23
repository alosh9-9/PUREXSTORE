import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const BRAND_NAME = process.env.BRAND_NAME || "PUREX STORE";
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1507511509339607060";
const EXTENSION_ID = process.env.EXTENSION_ID || "bicngpoijkcigllgeeocfoifegobhkfj";
const SUPPORT_URL = process.env.SUPPORT_URL || "https://discord.gg/a99";

function listFromEnv(name) {
  return String(process.env[name] || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function loadSubscribers() {
  const allowed = listFromEnv("ALLOWED_DISCORD_IDS");
  let map = {};

  for (const id of allowed) {
    map[id] = {
      id,
      name: `مشترك ${id.slice(-4)}`,
      plan: "vip",
      expiresAt: "2099-12-31",
      status: "active"
    };
  }

  if (process.env.SUBSCRIBERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.SUBSCRIBERS_JSON);
      for (const [id, info] of Object.entries(parsed)) {
        map[id] = {
          id,
          name: info.name || `مشترك ${id.slice(-4)}`,
          plan: info.plan || "vip",
          expiresAt: info.expiresAt || "2099-12-31",
          status: info.status || "active"
        };
      }
    } catch (error) {
      console.error("SUBSCRIBERS_JSON parse error:", error.message);
    }
  }

  return map;
}

function isExpired(expiresAt) {
  if (!expiresAt || expiresAt === "never" || expiresAt === "lifetime") return false;
  const end = new Date(`${expiresAt}T23:59:59Z`);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < Date.now();
}

function getDiscordId(body = {}, query = {}) {
  return String(
    body.discordUserId ||
      body.discord_user_id ||
      body.discord_id ||
      body.userId ||
      body.id ||
      query.discordUserId ||
      query.discord_user_id ||
      query.discord_id ||
      query.userId ||
      query.id ||
      ""
  ).trim();
}

function verifySubscriber(discordId) {
  const subscribers = loadSubscribers();
  const sub = subscribers[discordId];
  const exists = Boolean(sub);
  const active = exists && sub.status === "active" && !isExpired(sub.expiresAt);
  return {
    exists,
    active,
    subscriber: exists ? sub : null,
    message: active
      ? `حساب Discord مسجل ومفعل في ${BRAND_NAME}.`
      : exists
        ? `الاشتراك غير فعال أو منتهي في ${BRAND_NAME}.`
        : `حساب Discord غير مسجل في ${BRAND_NAME}.`
  };
}

function managerPayload(discordId = "") {
  const check = verifySubscriber(discordId);
  return {
    ok: true,
    brand: BRAND_NAME,
    registered: check.active,
    allowed: check.active,
    active: check.active,
    message: check.message,
    user: check.subscriber,
    subscription: check.subscriber
      ? {
          plan: check.subscriber.plan,
          status: check.active ? "active" : check.subscriber.status,
          expiresAt: check.subscriber.expiresAt
        }
      : null,
    permissions: check.active
      ? ["tabs", "kick", "queue", "profiles", "activity", "mute", "reload", "open_all"]
      : [],
    config: getConfig()
  };
}

function getConfig() {
  const defaultStreamers = listFromEnv("DEFAULT_STREAMERS");
  return {
    brandName: BRAND_NAME,
    clientId: DISCORD_CLIENT_ID,
    extensionId: EXTENSION_ID,
    supportUrl: SUPPORT_URL,
    font: "Cairo",
    locale: "ar",
    direction: "rtl",
    theme: {
      primary: "#8b5cf6",
      secondary: "#06b6d4",
      background: "#070816"
    },
    defaultStreamers,
    features: {
      discordLogin: true,
      subscribers: true,
      liveQueue: true,
      profiles: true,
      activity: true,
      kickTabs: true
    }
  };
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: `${BRAND_NAME} Manager API`,
    brand: BRAND_NAME,
    version: "4.0.0",
    status: "running",
    extensionId: EXTENSION_ID,
    clientId: DISCORD_CLIENT_ID,
    message: "السيرفر يعمل بنجاح"
  });
});

app.get("/health", (req, res) => res.json({ ok: true, status: "healthy" }));
app.get("/api/manager/health", (req, res) => res.json({ ok: true, status: "healthy", brand: BRAND_NAME }));
app.get("/api/manager/config", (req, res) => res.json({ ok: true, config: getConfig() }));
app.get("/api/manager/settings", (req, res) => res.json({ ok: true, settings: getConfig() }));

app.post("/api/manager/auth/verify", (req, res) => {
  const discordId = getDiscordId(req.body, req.query);
  res.json(managerPayload(discordId));
});

app.get("/api/manager/auth/verify", (req, res) => {
  const discordId = getDiscordId(req.body, req.query);
  res.json(managerPayload(discordId));
});

app.post("/api/manager/login", (req, res) => {
  const discordId = getDiscordId(req.body, req.query);
  res.json(managerPayload(discordId));
});

app.get("/api/manager/me", (req, res) => {
  const discordId = getDiscordId(req.body, req.query);
  res.json(managerPayload(discordId));
});

app.post("/api/manager/me", (req, res) => {
  const discordId = getDiscordId(req.body, req.query);
  res.json(managerPayload(discordId));
});

app.get("/api/manager/subscription", (req, res) => {
  const discordId = getDiscordId(req.body, req.query);
  res.json(managerPayload(discordId));
});

app.get("/api/manager/streamers", (req, res) => {
  res.json({
    ok: true,
    streamers: getConfig().defaultStreamers.map((name) => ({ name, url: `https://kick.com/${name}` }))
  });
});

app.get("/api/manager/profiles", (req, res) => {
  res.json({
    ok: true,
    profiles: [
      { id: "default", name: "الملف الافتراضي", description: "إعدادات PUREX STORE الافتراضية", active: true }
    ]
  });
});

app.get("/api/manager/queue", (req, res) => {
  res.json({ ok: true, queue: [], message: "قائمة الانتظار جاهزة." });
});

app.post("/api/manager/queue", (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  res.json({ ok: true, accepted: items.length, queue: items, message: "تم استلام قائمة الانتظار." });
});

app.get("/api/manager/activity", (req, res) => {
  res.json({
    ok: true,
    activity: [
      { time: new Date().toISOString(), type: "system", message: "PUREX STORE API يعمل بنجاح." }
    ]
  });
});

app.get("/api/manager/dashboard", (req, res) => {
  const discordId = getDiscordId(req.body, req.query);
  res.json({ ...managerPayload(discordId), dashboard: { queueCount: 0, activeProfiles: 1, activeTabs: 0 } });
});

app.get("/api/manager/extension/updates.xml", (req, res) => {
  res.type("application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">\n  <app appid="${EXTENSION_ID}">\n    <updatecheck status="noupdate"/>\n  </app>\n</gupdate>`);
});

// Safe fallback for any manager route requested by older/custom extension builds.
app.all("/api/manager/*", (req, res) => {
  const discordId = getDiscordId(req.body, req.query);
  res.json({
    ...managerPayload(discordId),
    route: req.path,
    method: req.method,
    note: "تمت معالجة هذا المسار بواسطة PUREX STORE Manager API v4."
  });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "المسار غير موجود", path: req.path });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`${BRAND_NAME} Manager API v4 running on port ${PORT}`);
});
