export function getUserFacingErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const rawMessage =
    typeof error === "string"
      ? error
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";

  const cleaned = rawMessage
    .replace(/^\[CONVEX [^\]]+\]\s*Server Error\s*/i, "")
    .replace(/^\[CONVEX [^\]]+\]\s*/i, "")
    .replace(/^Uncaught Error:\s*/i, "")
    .replace(/\s*Called by client\s*$/i, "")
    .trim();

  if (!cleaned) {
    return fallback;
  }

  if (/insufficient coin balance/i.test(cleaned)) {
    return "Insufficient wallet balance. Fund your wallet to join this slot.";
  }

  if (/insufficient wallet balance/i.test(cleaned)) {
    return "Insufficient wallet balance. Fund your wallet to continue.";
  }

  if (/insufficient balance to renew/i.test(cleaned)) {
    return "Insufficient wallet balance. Fund your wallet to renew this subscription.";
  }

  if (/insufficient boot balance/i.test(cleaned)) {
    return "You do not have enough BOOTS for the 50/50 payment split.";
  }

  if (/q score too low/i.test(cleaned)) {
    return "Your Q Score is too low for this slot right now.";
  }

  if (/no open slots found|no available open slot/i.test(cleaned)) {
    return "This slot is currently full. Please try another listing.";
  }

  if (/user or slot type not found|invalid slot type/i.test(cleaned)) {
    return "This listing is no longer available. Please refresh and try again.";
  }

  if (/slot not found or inactive/i.test(cleaned)) {
    return "This subscription is no longer available to renew.";
  }

  if (/network|failed to fetch|load failed/i.test(cleaned)) {
    return "Network issue detected. Please check your connection and try again.";
  }

  return cleaned;
}
