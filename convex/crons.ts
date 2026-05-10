import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
    "subscription renewal reminders",
    { hourUTC: 8, minuteUTC: 0 },
    internal.subscriptionReminders.processDailySubscriptionReminders,
);

export default crons;
