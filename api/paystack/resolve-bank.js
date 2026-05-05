const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey() {
  return (
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_SECRET ||
    process.env.PAYSTACK_SECURITY_KEY ||
    process.env.PAYSTACK_SECRET_LIVE ||
    ""
  );
}

export default async function handler(req, res) {
  const secretKey = getSecretKey();
  if (!secretKey) {
    res.status(500).json({ message: "Paystack secret key is not configured." });
    return;
  }

  const accountNumber = String(req.query.account_number || "").replace(/\D/g, "");
  const bankCode = String(req.query.bank_code || "").trim();

  if (accountNumber.length !== 10 || !bankCode) {
    res.status(400).json({ message: "Enter a 10-digit account number and select a bank." });
    return;
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.status) {
      res.status(response.status || 400).json({ message: payload?.message || "Could not verify account details." });
      return;
    }

    res.status(200).json({
      accountNumber: payload.data.account_number,
      accountName: payload.data.account_name,
      bankId: payload.data.bank_id,
    });
  } catch (error) {
    console.error("Failed to resolve Paystack account", error);
    res.status(500).json({ message: "Could not verify account details." });
  }
}
