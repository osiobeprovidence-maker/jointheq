import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const BANK_PAGE_SIZE = 100;
const MAX_BANK_PAGES = 20;

function getPaystackSecretKey() {
  return (
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_SECRET ||
    process.env.PAYSTACK_SECURITY_KEY ||
    process.env.PAYSTACK_SECRET_LIVE ||
    ""
  );
}

export const getBanks = action({
  args: {},
  handler: async (ctx) => {
    const secretKey = getPaystackSecretKey();
    if (!secretKey) {
      throw new Error("Paystack secret key is not configured.");
    }

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
        throw new Error(payload?.message || "Could not load banks.");
      }

      banks.push(...(payload.data || []));

      const pageCount = Number(payload.meta?.pageCount || page);
      const hasMore = page < pageCount && (payload.data || []).length > 0;
      if (!hasMore) break;
    }

    const uniqueBanks = new Map<string, { name: string; code: string }>();
    for (const bank of banks) {
      if (!bank?.name || !bank?.code) continue;
      uniqueBanks.set(bank.code, {
        name: bank.name,
        code: bank.code,
      });
    }

    return [...uniqueBanks.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const resolveBank = action({
  args: {
    accountNumber: v.string(),
    bankCode: v.string(),
  },
  handler: async (ctx, args) => {
    const secretKey = getPaystackSecretKey();
    if (!secretKey) {
      throw new Error("Paystack secret key is not configured.");
    }

    const accountNumber = args.accountNumber.replace(/\\D/g, "");
    const bankCode = args.bankCode.trim();

    if (accountNumber.length !== 10 || !bankCode) {
      throw new Error("Enter a 10-digit account number and select a bank.");
    }

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(
        accountNumber
      )}&bank_code=${encodeURIComponent(bankCode)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.status) {
      throw new Error(payload?.message || "Could not verify account details.");
    }

    return {
      accountNumber: payload.data.account_number,
      accountName: payload.data.account_name,
      bankId: payload.data.bank_id,
    };
  },
});

export const verifyWalletFunding = action({
  args: {
    reference: v.string(),
    userId: v.id("users"),
    walletCreditAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const secretKey = getPaystackSecretKey();
    if (!secretKey) throw new Error("Paystack secret key is not configured.");

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(args.reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.status) {
      throw new Error(payload?.message || "Could not verify transaction.");
    }

    const data = payload.data;
    if (data.status !== "success") {
      throw new Error(`Transaction is not successful. Status: ${data.status}`);
    }

    // Amount is in kobo, convert to NGN.
    const amountNGN = data.amount / 100;
    const walletCreditAmount = args.walletCreditAmount ?? amountNGN;

    if (!Number.isFinite(walletCreditAmount) || walletCreditAmount <= 0) {
      throw new Error("Invalid wallet funding amount.");
    }

    if (walletCreditAmount > amountNGN) {
      throw new Error("Paid amount is lower than the wallet credit amount.");
    }

    let cardDetails;
    if (data.authorization && data.authorization.reusable) {
      cardDetails = {
        last4: data.authorization.last4,
        brand: data.authorization.brand,
        expiry: `${data.authorization.exp_month}/${data.authorization.exp_year}`,
        auth_token: data.authorization.authorization_code,
      };
    }

    await ctx.runMutation(internal.users.creditWalletAndSaveCard, {
      userId: args.userId,
      amount: walletCreditAmount,
      reference: args.reference,
      cardDetails,
    });

    return { success: true, amount: walletCreditAmount, paidAmount: amountNGN, cardSaved: !!cardDetails };
  },
});
