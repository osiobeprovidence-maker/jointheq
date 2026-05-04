const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey() {
  return process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || "";
}

export default async function handler(_req, res) {
  const secretKey = getSecretKey();
  if (!secretKey) {
    res.status(500).json({ message: "Paystack secret key is not configured." });
    return;
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria&perPage=100`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.status) {
      res.status(response.status || 400).json({ message: payload?.message || "Could not load banks." });
      return;
    }

    res.status(200).json({
      banks: (payload.data || []).map((bank) => ({
        name: bank.name,
        code: bank.code,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch Paystack banks", error);
    res.status(500).json({ message: "Could not load banks." });
  }
}
