import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// PUREX STORE Manager API
// Keep Discord Client Secret in Render Environment Variables only, never inside the extension.

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BRAND_NAME = process.env.BRAND_NAME || "PUREX STORE";
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1507511509339607060";
const EXTENSION_ID = process.env.EXTENSION_ID || "bicngpoijkcigllgeeocfoifegobhkfj";
const SUPPORT_URL = process.env.SUPPORT_URL || "";

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

function allowedDiscordIds() {
  return String(process.env.ALLOWED_DISCORD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function pickDiscordId(input = {}) {
  return String(
    input.discordUserId ||
    input.discord_user_id ||
    input.discordId ||
    input.discord_id ||
    input.userId ||
    input.user_id ||
    input.id ||
    input.sub ||
    ""
  ).trim();
}

function pickToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return String(req.body?.access_token || req.body?.accessToken || req.query?.access_token || req.query?.accessToken || "").trim();
}

async function getDiscordUserFromToken(accessToken) {
  if (!accessToken) return null;
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) return null;
  return await response.json();
}

function authResponse(discordId, extra = {}) {
  const allowedList = allowedDiscordIds();
  const registered = Boolean(discordId && allowedList.includes(String(discordId)));
  return {
    ok: true,
    success: registered,
    allowed: registered,
    authorized: registered,
    registered,
    isRegistered: registered,
    brand: BRAND_NAME,
    discordUserId: discordId || null,
    clientId: DISCORD_CLIENT_ID,
    supportUrl: SUPPORT_URL,
    message: registered
      ? `Discord account is registered in ${BRAND_NAME}.`
      : `Discord account is not registered in ${BRAND_NAME}.`,
    ...extra
  };
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: `${BRAND_NAME} Manager API`,
    brand: BRAND_NAME,
    status: "running",
    extensionId: EXTENSION_ID,
    clientId: DISCORD_CLIENT_ID
  });
});

app.get("/health", (req, res) => res.json({ ok: true, status: "healthy" }));

app.get(["/api/manager/config", "/api/config", "/config"], (req, res) => {
  res.json({
    ok: true,
    brand: BRAND_NAME,
    clientId: DISCORD_CLIENT_ID,
    discordClientId: DISCORD_CLIENT_ID,
    extensionId: EXTENSION_ID,
    redirectUri: `https://${EXTENSION_ID}.chromiumapp.org/`,
    redirectUris: [
      `https://${EXTENSION_ID}.chromiumapp.org/`,
      `https://${EXTENSION_ID}.chromiumapp.org/callback`
    ],
    supportUrl: SUPPORT_URL
  });
});

app.get(["/api/manager/status", "/api/status"], (req, res) => {
  res.json({ ok: true, brand: BRAND_NAME, status: "online" });
});

app.all([
  "/api/manager/auth/verify",
  "/api/manager/auth/discord",
  "/api/manager/auth/login",
  "/api/manager/auth/me",
  "/api/auth/verify",
  "/api/auth/discord",
  "/auth/verify",
  "/auth/discord"
], async (req, res) => {
  try {
    let discordId = pickDiscordId(req.body) || pickDiscordId(req.query);
    let discordUser = null;

    if (!discordId) {
      const token = pickToken(req);
      discordUser = await getDiscordUserFromToken(token);
      discordId = discordUser?.id || "";
    }

    res.json(authResponse(discordId, { user: discordUser }));
  } catch (error) {
    res.status(500).json({ ok: false, registered: false, error: error.message });
  }
});

app.all(["/api/manager/session", "/api/session", "/session"], async (req, res) => {
  try {
    let discordId = pickDiscordId(req.body) || pickDiscordId(req.query);
    let discordUser = null;

    if (!discordId) {
      const token = pickToken(req);
      discordUser = await getDiscordUserFromToken(token);
      discordId = discordUser?.id || "";
    }

    const base = authResponse(discordId, { user: discordUser });
    res.json({
      ...base,
      session: base.registered
        ? { active: true, brand: BRAND_NAME, discordUserId: discordId }
        : { active: false }
    });
  } catch (error) {
    res.status(500).json({ ok: false, registered: false, error: error.message });
  }
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

// Flexible manager fallback for the obfuscated extension.
// Some builds call custom /api/manager/... routes. This handler answers safely
// using the Discord token or Discord user id, instead of returning "not implemented".
async function flexibleManagerHandler(req, res) {
  try {
    console.log("Flexible manager route:", req.method, req.originalUrl, { body: req.body, query: req.query });

    let discordId = pickDiscordId(req.body) || pickDiscordId(req.query);
    let discordUser = null;

    if (!discordId) {
      const token = pickToken(req);
      discordUser = await getDiscordUserFromToken(token);
      discordId = discordUser?.id || "";
    }

    const base = authResponse(discordId, { user: discordUser });

    res.json({
      ...base,
      data: {
        ...base,
        brand: BRAND_NAME,
        manager: BRAND_NAME,
        access: base.registered,
        controls: base.registered,
        canUseControls: base.registered,
        unlocked: base.registered
      },
      manager: {
        name: BRAND_NAME,
        brand: BRAND_NAME,
        status: "online",
        supportUrl: SUPPORT_URL
      },
      permissions: {
        controls: base.registered,
        access: base.registered,
        admin: base.registered
      },
      route: req.path
    });
  } catch (error) {
    res.status(500).json({ ok: false, registered: false, error: error.message });
  }
}

app.all("/api/manager/*", flexibleManagerHandler);
app.all("/manager/*", flexibleManagerHandler);

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Route not found", method: req.method, path: req.path });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`${BRAND_NAME} Manager API running on port ${PORT}`);
});
