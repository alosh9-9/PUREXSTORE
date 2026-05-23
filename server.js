import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const BRAND_NAME = process.env.BRAND_NAME || "PUREX STORE";
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1507511509339607060";
const EXTENSION_ID = process.env.EXTENSION_ID || "bicngpoijkcigllgeeocfoifegobhkfj";
const SUPPORT_URL = process.env.SUPPORT_URL || "https://discord.gg/a99";

function splitIds(value = "") {
  return String(value)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function loadSubscribers() {
  const out = new Map();

  for (const id of splitIds(process.env.ALLOWED_DISCORD_IDS || "")) {
    out.set(id, {
      discordId: id,
      name: "مشترك",
      plan: "basic",
      role: "member",
      status: "active",
      expiresAt: "2099-12-31"
    });
  }

  try {
    const raw = process.env.SUBSCRIBERS_JSON;
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [id, info] of Object.entries(parsed)) {
        out.set(String(id), { discordId: String(id), ...info });
      }
    }
  } catch (err) {
    console.warn("SUBSCRIBERS_JSON غير صالح:", err.message);
  }

  try {
    const file = path.join(__dirname, "subscribers.json");
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      for (const [id, info] of Object.entries(parsed)) {
        if (!String(id).includes("PUT_YOUR")) {
          out.set(String(id), { discordId: String(id), ...info });
        }
      }
    }
  } catch (err) {
    console.warn("subscribers.json غير صالح:", err.message);
  }

  return out;
}

function isExpired(expiresAt) {
  if (!expiresAt || expiresAt === "lifetime") return false;
  const end = new Date(`${expiresAt}T23:59:59Z`);
  return Number.isFinite(end.getTime()) && Date.now() > end.getTime();
}

function extractDiscordUser(body = {}, query = {}) {
  const source = body.user || body.discordUser || body.profile || body || query || {};
  const id =
    source.id ||
    source.discordId ||
    source.discord_id ||
    body.discordUserId ||
    body.discord_id ||
    body.id ||
    query.discordUserId ||
    query.discord_id ||
    query.id ||
    "";

  return {
    id: String(id || "").trim(),
    username: source.username || body.username || query.username || "",
    globalName: source.global_name || source.globalName || body.globalName || "",
    avatar: source.avatar || body.avatar || ""
  };
}

async function getDiscordUserFromToken(token) {
  if (!token) return null;
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  return res.json();
}

function buildAccessResult(user) {
  const subscribers = loadSubscribers();
  const discordId = String(user?.id || "").trim();
  const sub = subscribers.get(discordId);
  const active = Boolean(sub && sub.status !== "banned" && sub.status !== "disabled" && !isExpired(sub.expiresAt));

  return {
    ok: true,
    brand: BRAND_NAME,
    registered: active,
    allowed: active,
    authenticated: active,
    message: active
      ? `Discord account is registered in ${BRAND_NAME}.`
      : `Discord account is not registered in ${BRAND_NAME}.`,
    message_ar: active
      ? `حساب ديسكورد مسجل ومفعّل في ${BRAND_NAME}.`
      : `حساب ديسكورد غير مسجل في ${BRAND_NAME}.`,
    user: {
      id: discordId,
      username: user?.username || "",
      globalName: user?.globalName || user?.global_name || "",
      avatar: user?.avatar || ""
    },
    subscription: active
      ? {
          status: "active",
          plan: sub.plan || "basic",
          role: sub.role || "member",
          name: sub.name || user?.username || "مشترك",
          expiresAt: sub.expiresAt || "2099-12-31"
        }
      : {
          status: sub?.status || "inactive",
          plan: sub?.plan || null,
          role: sub?.role || null,
          expiresAt: sub?.expiresAt || null
        },
    controls: {
      kickTabs: active,
      openChannels: active,
      muteTabs: active,
      reloadTabs: active,
      focusLock: active,
      sessions: active
    }
  };
}

async function verifyHandler(req, res) {
  try {
    let user = extractDiscordUser(req.body, req.query);
    const token = req.body.accessToken || req.body.access_token || req.query.accessToken || req.query.access_token;
    if (!user.id && token) {
      const discordUser = await getDiscordUserFromToken(token);
      if (discordUser) user = extractDiscordUser({ user: discordUser }, {});
    }

    if (!user.id) {
      return res.status(400).json({
        ok: false,
        registered: false,
        allowed: false,
        message: "Discord user id is required.",
        message_ar: "معرّف حساب Discord مطلوب."
      });
    }

    return res.json(buildAccessResult(user));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "server_error", message_ar: "حدث خطأ داخل السيرفر." });
  }
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: `${BRAND_NAME} Manager API`,
    brand: BRAND_NAME,
    status: "running",
    language: "ar",
    font: "Cairo",
    extensionId: EXTENSION_ID,
    clientId: DISCORD_CLIENT_ID
  });
});

app.get("/health", (req, res) => res.json({ ok: true, status: "healthy" }));

app.get("/api/manager/config", (req, res) => {
  res.json({
    ok: true,
    brand: BRAND_NAME,
    language: "ar",
    direction: "rtl",
    font: "Cairo",
    supportUrl: SUPPORT_URL,
    discordClientId: DISCORD_CLIENT_ID,
    extensionId: EXTENSION_ID,
    redirectUri: `https://${EXTENSION_ID}.chromiumapp.org/discord`,
    labels: {
      title: "نظام تحكم PUREX STORE",
      login: "تسجيل الدخول عبر Discord",
      registered: "الحساب مسجل ومفعل",
      notRegistered: "الحساب غير مسجل"
    }
  });
});

app.post("/api/manager/auth/verify", verifyHandler);
app.post("/api/manager/auth/discord", verifyHandler);
app.post("/api/manager/discord/verify", verifyHandler);
app.post("/api/manager/verify", verifyHandler);
app.get("/api/manager/auth/verify", verifyHandler);

app.all("/api/manager/me", verifyHandler);
app.all("/api/manager/session", (req, res) => {
  res.json({ ok: true, brand: BRAND_NAME, session: { active: true }, message_ar: "الجلسة جاهزة." });
});
app.all("/api/manager/subscription", verifyHandler);
app.all("/api/manager/controls", (req, res) => {
  res.json({
    ok: true,
    brand: BRAND_NAME,
    controls: {
      kickTabs: true,
      openChannels: true,
      muteTabs: true,
      reloadTabs: true,
      focusLock: true,
      sessions: true
    },
    message_ar: "تم تحميل أدوات التحكم."
  });
});

app.get("/api/manager/subscribers/count", (req, res) => {
  res.json({ ok: true, count: loadSubscribers().size });
});

app.get("/api/manager/extension/updates.xml", (req, res) => {
  res.type("application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="${EXTENSION_ID}">
    <updatecheck status="noupdate"/>
  </app>
</gupdate>`);
});

app.all("/api/manager/*", (req, res) => {
  res.json({
    ok: true,
    brand: BRAND_NAME,
    route: req.path,
    implemented: true,
    message: "Manager route handled by PUREX STORE API.",
    message_ar: "تمت معالجة مسار المدير بواسطة PUREX STORE API."
  });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "not_found", path: req.path, message_ar: "المسار غير موجود." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`${BRAND_NAME} Manager API v3 running on port ${PORT}`);
});
