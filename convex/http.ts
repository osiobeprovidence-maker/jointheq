import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const paystackWebhook = httpAction(async (ctx, request) => {
    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    let event;
    try {
        event = await request.json();
    } catch {
        return new Response("Invalid JSON", { status: 400 });
    }

    if (event.event !== "charge.success") {
        return new Response("Ignored", { status: 200 });
    }

    if (!event.data?.metadata?.invoiceId) {
        return new Response("No invoiceId in metadata", { status: 200 });
    }

    try {
        const result = await ctx.runAction(internal.billing.handlePaystackWebhook, {
            event,
        });

        if ((result as any).alreadyProcessed) {
            return new Response("Already processed", { status: 200 });
        }

        return new Response("OK", { status: 200 });
    } catch (error: any) {
        console.error("[paystackWebhook] Error:", error);
        return new Response(error.message || "Internal error", { status: 500 });
    }
});

const http = httpRouter();

http.route({
    path: "/paystack-webhook",
    method: "POST",
    handler: paystackWebhook,
});

export default http;
