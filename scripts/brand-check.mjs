#!/usr/bin/env node
/**
 * Brand-asset gate shared by browser-smoke.mjs.
 * Games must ship a custom share card; default og.grok.me is not acceptable for them.
 *
 *   node scripts/brand-check.mjs [--game] [--placeholder-ok] [--root <dir>]
 */
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { OG_SITE_REL_PATH, readOgSite, siteHasCustomCard } from "./grok-pwa-shared.mjs";

export const MAX_CARD_BYTES = 600 * 1024;
export const OG_PENDING_REL_PATH = ".grok/og-pending";
export const OG_PENDING_MAX_AGE_MS = 10 * 60 * 1000;

export function siteDeclaresOgTypeGame(site) {
  return String(site?.type ?? "").toLowerCase() === "x:game";
}

export function ogPendingActive(workspaceRoot, now = Date.now()) {
  const marker = join(workspaceRoot, OG_PENDING_REL_PATH);
  if (!existsSync(marker)) return false;
  try {
    const age = now - statSync(marker).mtimeMs;
    return age >= 0 && age < OG_PENDING_MAX_AGE_MS;
  } catch {
    return false;
  }
}

export function findCardFile(workspaceRoot) {
  for (const name of ["public/og.jpg", "public/og.png"]) {
    const p = join(workspaceRoot, name);
    if (existsSync(p)) return p;
  }
  return null;
}

export function checkBrandAssets({
  workspaceRoot,
  isGame = false,
  placeholderOk = false,
} = {}) {
  const messages = [];
  const warnings = [];
  const site = readOgSite(workspaceRoot);
  const cardPath = findCardFile(workspaceRoot);
  const hasCustom = siteHasCustomCard(site) || Boolean(cardPath);

  if (isGame && !placeholderOk) {
    if (!hasCustom) {
      warnings.push("game apps require a custom share card (public/og.jpg|png + site.json card=custom)");
    }
    if (!siteDeclaresOgTypeGame(site)) {
      warnings.push('games should set "type": "x:game" in src/lib/og/site.json');
    }
    const banner = join(workspaceRoot, "public/x-banner.jpg");
    if (!existsSync(banner)) {
      messages.push("optional: public/x-banner.jpg for X feed card (50:11)");
    }
  }

  if (cardPath) {
    try {
      const size = statSync(cardPath).size;
      if (size > MAX_CARD_BYTES) {
        warnings.push(`share card ${cardPath} is ${size} bytes (max ${MAX_CARD_BYTES})`);
      }
    } catch {}
  }

  if (!existsSync(join(workspaceRoot, OG_SITE_REL_PATH))) {
    messages.push(`missing ${OG_SITE_REL_PATH}`);
  }

  return {
    ok: warnings.length === 0,
    hasCustomCard: hasCustom,
    pending: ogPendingActive(workspaceRoot),
    warnings,
    messages,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  let isGame = false;
  let placeholderOk = false;
  let workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--game") isGame = true;
    else if (args[i] === "--placeholder-ok") placeholderOk = true;
    else if (args[i] === "--root" && args[i + 1]) {
      workspaceRoot = args[++i];
    }
  }
  const result = checkBrandAssets({ workspaceRoot, isGame, placeholderOk });
  const { warnings, messages } = result;
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        hasCustomCard: result.hasCustomCard,
        pending: result.pending,
        warnings: warnings.length,
        messages,
      },
      null,
      2,
    ),
  );
  process.exitCode = warnings.length === 0 ? 0 : 1;
}
