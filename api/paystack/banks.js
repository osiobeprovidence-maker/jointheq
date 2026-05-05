const PAYSTACK_BASE_URL = "https://api.paystack.co";
const BANK_PAGE_SIZE = 100;
const MAX_BANK_PAGES = 20;

function getSecretKey() {
  return process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || "";
}

async function fetchPaystackBanks(secretKey) {
  const banks = [];

  for (let page = 1; page <= MAX_BANK_PAGES; page += 1) {
    const params = new URLSearchParams({
      country: "nigeria",
      perPage: String(BANK_PAGE_SIZE),
      page: String(page),
    });

    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.status) {
      const error = new Error(payload?.message || "Could not load banks.");
      error.statusCode = response.status || 400;
      throw error;
    }

    banks.push(...(payload.data || []));

    const meta = payload.meta || {};
    const pageCount = Number(meta.pageCount || page);
    const hasMore = page < pageCount && (payload.data || []).length > 0;
    if (!hasMore) break;
  }

  const uniqueBanks = new Map();
  for (const bank of banks) {
    if (!bank?.name || !bank?.code) continue;
    uniqueBanks.set(bank.code, {
      name: bank.name,
      code: bank.code,
    });
  }

  return [...uniqueBanks.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default async function handler(_req, res) {
  const secretKey = getSecretKey();
  if (!secretKey) {
    res.status(500).json({ message: "Paystack secret key is not configured." });
    return;
  }

  try {
    const banks = await fetchPaystackBanks(secretKey);
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({ banks });
  } catch (error) {
    console.error("Failed to fetch Paystack banks", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Could not load banks." });
  }
}
