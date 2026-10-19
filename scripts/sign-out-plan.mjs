// @ts-check

export const PREVIEW_SIGN_OUT_TIMEOUT_MS = 1500;
export const DEPLOYED_SIGN_OUT_TIMEOUT_MS = 10_000;

/** @param {boolean} livePreview */
export function signOutTimeoutMs(livePreview) {
  return livePreview ? PREVIEW_SIGN_OUT_TIMEOUT_MS : DEPLOYED_SIGN_OUT_TIMEOUT_MS;
}

/** @param {() => unknown | Promise<unknown>} start @param {number} timeoutMs */
export function settleWithin(start, timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve("timeout"), timeoutMs);
    /** @param {"ok" | "failed" | "timeout"} outcome */
    const done = (outcome) => {
      clearTimeout(timer);
      resolve(outcome);
    };
    try {
      Promise.resolve(start()).then(
        () => done("ok"),
        () => done("failed"),
      );
    } catch {
      done("failed");
    }
  });
}

/** @param {{livePreview: boolean, hasBearer: boolean, requestSignOut: () => unknown | Promise<unknown>, clearToken: () => void, redirect: () => void, timeoutMs?: number}} options */
export async function runSignOut(options) {
  const { livePreview, hasBearer, requestSignOut, clearToken, redirect, timeoutMs } = options;
  if (livePreview) {
    if (hasBearer) {
      await settleWithin(requestSignOut, timeoutMs ?? signOutTimeoutMs(livePreview));
    }
    clearToken();
    redirect();
    return;
  }

  const outcome = await settleWithin(requestSignOut, timeoutMs ?? signOutTimeoutMs(livePreview));
  if (outcome !== "ok") {
    throw new Error(
      outcome === "timeout"
        ? "Sign-out timed out — you are still signed in. Please try again."
        : "Sign-out failed — you are still signed in. Please try again.",
    );
  }
  clearToken();
  redirect();
}

/** @param {{livePreview: boolean, hasBearer: boolean, requestSignOut: () => unknown | Promise<unknown>, clearToken: () => void, timeoutMs?: number}} options */
export async function runPreSignInSignOut(options) {
  const { livePreview, hasBearer, requestSignOut, clearToken, timeoutMs } = options;
  if (hasBearer || !livePreview) {
    await settleWithin(requestSignOut, timeoutMs ?? signOutTimeoutMs(livePreview));
  }
  clearToken();
}
