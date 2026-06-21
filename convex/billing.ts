import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { createNotification } from "./notificationHelpers";
import { createUserActivityLog } from "./activityHelpers";

const DAY_MS = 24 * 60 * 60 * 1000;
const RENEWAL_WINDOW_DAYS = 7;
const PAYSTACK_BASE = "https://api.paystack.co";

function dateToMs(dateStr: string | undefined | null): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.getTime();
}

function getPaystackSecretKey() {
    return (
        process.env.PAYSTACK_SECRET_KEY ||
        process.env.PAYSTACK_SECRET ||
        process.env.PAYSTACK_SECURITY_KEY ||
        process.env.PAYSTACK_SECRET_LIVE ||
        ""
    );
}

async function getDueSubscriptionsHandler(ctx: any, userId: Id<"users">) {
    const now = Date.now();
    const cutoff = now + RENEWAL_WINDOW_DAYS * DAY_MS;

    const slots = await ctx.db
        .query("subscription_slots")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .filter((q) => q.eq(q.field("status"), "filled"))
        .collect();

    const due = [];
    for (const slot of slots) {
        const dueAt = dateToMs(slot.renewal_date);
        if (!dueAt || dueAt > cutoff) continue;

        const slotType = slot.slot_type_id ? await ctx.db.get(slot.slot_type_id) : null;
        const account = slot.subscription_id ? await ctx.db.get(slot.subscription_id) : null;
        const group = slot.group_id ? await ctx.db.get(slot.group_id) : null;

        let catalog = null;
        if (account?.platform_catalog_id) {
            catalog = await ctx.db.get(account.platform_catalog_id);
        } else if (group?.subscription_catalog_id) {
            catalog = await ctx.db.get(group.subscription_catalog_id);
        }

        due.push({
            _id: slot._id,
            slot_name: slotType?.name ?? slot.profile_name ?? "Slot",
            service_name: account?.platform ?? catalog?.name ?? group?.account_email ?? "Subscription",
            amount: slotType?.price ?? 0,
            renewal_date: slot.renewal_date,
            due_at: dueAt,
            days_overdue: Math.max(0, Math.floor((now - dueAt) / DAY_MS)),
            auto_renew: slot.auto_renew ?? false,
        });
    }

    due.sort((a, b) => a.due_at - b.due_at);
    return due;
}

// ── Queries ──

export const getDueSubscriptions = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        return getDueSubscriptionsHandler(ctx, args.user_id);
    },
});

export const getUserBillingDashboard = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const pendingInvoices = await ctx.db
            .query("invoices")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .order("desc")
            .collect();

        const paidInvoices = await ctx.db
            .query("invoices")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.eq(q.field("status"), "paid"))
            .order("desc")
            .take(20);

        const invoicesWithItems = await Promise.all(
            [...pendingInvoices, ...paidInvoices].map(async (inv) => {
                const items = await ctx.db
                    .query("invoice_items")
                    .withIndex("by_invoice", (q) => q.eq("invoice_id", inv._id))
                    .collect();
                return { ...inv, items };
            })
        );

        const totalDue = pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
        const breakdown: Record<string, number> = {};
        for (const inv of pendingInvoices) {
            const items = await ctx.db
                .query("invoice_items")
                .withIndex("by_invoice", (q) => q.eq("invoice_id", inv._id))
                .collect();
            for (const item of items) {
                breakdown[item.service_name] = (breakdown[item.service_name] || 0) + item.amount;
            }
        }

        const dueSlots = await getDueSubscriptionsHandler(ctx, args.user_id);

        return {
            pendingInvoices: invoicesWithItems.filter((i) => i.status === "pending"),
            paidInvoices: invoicesWithItems.filter((i) => i.status === "paid"),
            totalDue,
            breakdown,
            dueSlotsPreview: dueSlots.slice(0, 10),
            dueCount: dueSlots.length,
        };
    },
});

export const getInvoice = query({
    args: { invoice_id: v.id("invoices") },
    handler: async (ctx, args) => {
        const invoice = await ctx.db.get(args.invoice_id);
        if (!invoice) return null;
        const items = await ctx.db
            .query("invoice_items")
            .withIndex("by_invoice", (q) => q.eq("invoice_id", args.invoice_id))
            .collect();
        return { ...invoice, items };
    },
});

export const getUserInvoices = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .order("desc")
            .collect();

        return Promise.all(
            invoices.map(async (inv) => {
                const items = await ctx.db
                    .query("invoice_items")
                    .withIndex("by_invoice", (q) => q.eq("invoice_id", inv._id))
                    .collect();
                return { ...inv, items };
            })
        );
    },
});

// ── Mutations ──

export const createInvoiceFromDueSubscriptions = mutation({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const dueSlots = await getDueSubscriptionsHandler(ctx, args.user_id);
        if (dueSlots.length === 0) {
            throw new Error("No due subscriptions found.");
        }

        const slotIds = new Set(dueSlots.map((s) => s._id));

        // Check no existing pending invoice covers any of these slots
        const existingInvoices = await ctx.db
            .query("invoices")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        for (const inv of existingInvoices) {
            const items = await ctx.db
                .query("invoice_items")
                .withIndex("by_invoice", (q) => q.eq("invoice_id", inv._id))
                .collect();
            for (const item of items) {
                if (slotIds.has(item.slot_id)) {
                    throw new Error("An existing pending invoice already covers some of these subscriptions.");
                }
            }
        }

        const totalAmount = dueSlots.reduce((sum, s) => sum + s.amount, 0);
        const now = Date.now();

        const invoiceId = await ctx.db.insert("invoices", {
            user_id: args.user_id,
            total_amount: totalAmount,
            status: "pending",
            created_at: now,
            metadata: { slot_count: dueSlots.length },
        });

        for (const slot of dueSlots) {
            await ctx.db.insert("invoice_items", {
                invoice_id: invoiceId,
                slot_id: slot._id,
                service_name: slot.service_name,
                slot_name: slot.slot_name,
                amount: slot.amount,
                renewal_date: slot.renewal_date,
            });
        }

        return { invoiceId, totalAmount, itemCount: dueSlots.length };
    },
});

export const cancelInvoice = mutation({
    args: { invoice_id: v.id("invoices") },
    handler: async (ctx, args) => {
        const invoice = await ctx.db.get(args.invoice_id);
        if (!invoice) throw new Error("Invoice not found.");
        if (invoice.status !== "pending") {
            throw new Error("Only pending invoices can be cancelled.");
        }
        await ctx.db.patch(args.invoice_id, { status: "cancelled" });

        try {
            await createUserActivityLog(ctx, {
                userId: invoice.user_id,
                category: "payment",
                action: "Payment Failed",
                status: "failed",
                amount: invoice.total_amount,
            });
        } catch (e) {
            console.error("Failed to log activity:", e);
        }

        return { success: true };
    },
});

// Internal mutation for webhook to mark invoice paid and extend slots
export const markInvoicePaid = internalMutation({
    args: {
        invoice_id: v.id("invoices"),
        paystack_reference: v.string(),
        raw_response: v.any(),
    },
    handler: async (ctx, args) => {
        const invoice = await ctx.db.get(args.invoice_id);
        if (!invoice) throw new Error("Invoice not found.");

        // Idempotency guard
        if (invoice.status === "paid") {
            return { alreadyProcessed: true };
        }

        const now = Date.now();

        // Mark invoice paid
        await ctx.db.patch(args.invoice_id, {
            status: "paid",
            paid_at: now,
            paystack_reference: args.paystack_reference,
        });

        // Record in ledger
        await ctx.db.insert("payments_ledger", {
            user_id: invoice.user_id,
            invoice_id: args.invoice_id,
            amount: invoice.total_amount,
            provider: "paystack",
            status: "success",
            reference: args.paystack_reference,
            raw_response: args.raw_response,
            created_at: now,
        });

        // Fetch invoice items
        const items = await ctx.db
            .query("invoice_items")
            .withIndex("by_invoice", (q) => q.eq("invoice_id", args.invoice_id))
            .collect();

        // Extend each slot's renewal date by 30 days
        for (const item of items) {
            const slot = await ctx.db.get(item.slot_id);
            if (!slot) continue;

            const currentRenewal = slot.renewal_date ? new Date(slot.renewal_date) : new Date();
            const nextRenewal = new Date(currentRenewal.getTime() + 30 * DAY_MS);

            await ctx.db.patch(item.slot_id, {
                renewal_date: nextRenewal.toISOString(),
                status: "filled",
                removal_scheduled_at: undefined,
            });

            // Record slot-level payment in the existing subscription_payments table
            await ctx.db.insert("subscription_payments", {
                slot_id: item.slot_id,
                user_id: invoice.user_id,
                amount: item.amount,
                status: "completed",
                payment_date: new Date(now).toISOString(),
                created_at: now,
            });
        }

        // Create notification
        await createNotification(ctx, {
            userId: invoice.user_id,
            title: "Invoice paid successfully",
            message: `Your invoice of ₦${invoice.total_amount.toLocaleString()} has been paid. ${items.length} subscription(s) extended.`,
            type: "subscription",
        });

        try {
            await createUserActivityLog(ctx, {
                userId: invoice.user_id,
                category: "payment",
                action: "Payment Completed",
                status: "success",
                amount: invoice.total_amount,
            });
        } catch (e) {
            console.error("Failed to log activity:", e);
        }

        return { success: true, itemsProcessed: items.length };
    },
});

// ── Actions (external API calls) ──

export const initiatePaystackPayment = action({
    args: { invoice_id: v.id("invoices") },
    handler: async (ctx, args) => {
        const secretKey = getPaystackSecretKey();
        if (!secretKey) throw new Error("Paystack secret key is not configured.");

        const invoice = await ctx.runQuery(internal.billing.getInvoice, {
            invoice_id: args.invoice_id,
        });
        if (!invoice) throw new Error("Invoice not found.");
        if (invoice.status !== "pending") {
            throw new Error("Invoice is not in pending status.");
        }

        const user = await ctx.runQuery(internal.users.getById, {
            id: invoice.user_id,
        });
        if (!user) throw new Error("User not found.");

        const email = user.email;
        const amountKobo = Math.round(invoice.total_amount * 100);

        const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${secretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                amount: amountKobo,
                metadata: {
                    invoiceId: args.invoice_id,
                    userId: invoice.user_id,
                    invoiceType: "subscription_billing",
                },
                callback_url: `${process.env.VITE_APP_URL || process.env.VITE_CONVEX_SITE_URL || ""}/billing`,
            }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.status) {
            throw new Error(payload?.message || "Failed to initialize Paystack payment.");
        }

        const data = payload.data;

        // Save the Paystack reference and access code on the invoice
        await ctx.runMutation(internal.billing.savePaystackReference, {
            invoice_id: args.invoice_id,
            reference: data.reference,
            access_code: data.access_code,
        });

        try {
            await createUserActivityLog(ctx, {
                userId: invoice.user_id,
                category: "payment",
                action: "Payment Initiated",
                description: "Paystack payment for invoice",
                status: "pending",
                amount: invoice.total_amount,
            });
        } catch (e) {
            console.error("Failed to log activity:", e);
        }

        return {
            authorization_url: data.authorization_url,
            reference: data.reference,
            access_code: data.access_code,
        };
    },
});

export const savePaystackReference = internalMutation({
    args: {
        invoice_id: v.id("invoices"),
        reference: v.string(),
        access_code: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.invoice_id, {
            paystack_reference: args.reference,
            paystack_access_code: args.access_code,
        });
    },
});

export const handlePaystackWebhook = action({
    args: { event: v.any() },
    handler: async (ctx, args) => {
        const event = args.event;

        // Only process charge.success events
        if (event.event !== "charge.success") {
            return { ignored: true, reason: "Not a charge.success event" };
        }

        const data = event.data;
        const reference = data.reference;
        const metadata = data.metadata;

        if (!metadata?.invoiceId) {
            return { ignored: true, reason: "No invoiceId in metadata" };
        }

        if (!reference) {
            return { ignored: true, reason: "No reference in event data" };
        }

        // Verify the transaction with Paystack API
        const secretKey = getPaystackSecretKey();
        if (!secretKey) throw new Error("Paystack secret key is not configured.");

        const verifyResponse = await fetch(
            `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const verifyPayload = await verifyResponse.json();
        if (!verifyResponse.ok || !verifyPayload?.status) {
            throw new Error(verifyPayload?.message || "Failed to verify transaction.");
        }

        const txData = verifyPayload.data;
        if (txData.status !== "success") {
            throw new Error(`Transaction status is not success: ${txData.status}`);
        }

        // Verify amount matches (amount is in kobo)
        const invoiceId = metadata.invoiceId as Id<"invoices">;
        const invoice = await ctx.runQuery(internal.billing.getInvoice, { invoice_id: invoiceId });
        if (!invoice) {
            throw new Error("Invoice not found during webhook processing.");
        }

        const paidAmountNaira = txData.amount / 100;
        if (paidAmountNaira < invoice.total_amount) {
            throw new Error(
                `Paid amount (₦${paidAmountNaira}) is less than invoice total (₦${invoice.total_amount}).`
            );
        }

        // Mark invoice paid (idempotent)
        const result = await ctx.runMutation(internal.billing.markInvoicePaid, {
            invoice_id: invoiceId,
            paystack_reference: reference,
            raw_response: event,
        });

        return result;
    },
});
