/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as admin from "../admin.js";
import type * as adminEnhanced from "../adminEnhanced.js";
import type * as adminWorkforce from "../adminWorkforce.js";
import type * as campaigns from "../campaigns.js";
import type * as campus from "../campus.js";
import type * as createSuperAdmin from "../createSuperAdmin.js";
import type * as devices from "../devices.js";
import type * as email from "../email.js";
import type * as fraud from "../fraud.js";
import type * as funding from "../funding.js";
import type * as init from "../init.js";
import type * as listings from "../listings.js";
import type * as lunar from "../lunar.js";
import type * as maintenance from "../maintenance.js";
import type * as marketplace from "../marketplace.js";
import type * as messages from "../messages.js";
import type * as migrated_subscriptions from "../migrated_subscriptions.js";
import type * as migration from "../migration.js";
import type * as migrations from "../migrations.js";
import type * as notificationHelpers from "../notificationHelpers.js";
import type * as notifications from "../notifications.js";
import type * as promotions from "../promotions.js";
import type * as push from "../push.js";
import type * as pushActions from "../pushActions.js";
import type * as reputation from "../reputation.js";
import type * as slotTypeSanitizer from "../slotTypeSanitizer.js";
import type * as slots_engine from "../slots_engine.js";
import type * as subscriptions from "../subscriptions.js";
import type * as support from "../support.js";
import type * as support_actions from "../support_actions.js";
import type * as tasks from "../tasks.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  admin: typeof admin;
  adminEnhanced: typeof adminEnhanced;
  adminWorkforce: typeof adminWorkforce;
  campaigns: typeof campaigns;
  campus: typeof campus;
  createSuperAdmin: typeof createSuperAdmin;
  devices: typeof devices;
  email: typeof email;
  fraud: typeof fraud;
  funding: typeof funding;
  init: typeof init;
  listings: typeof listings;
  lunar: typeof lunar;
  maintenance: typeof maintenance;
  marketplace: typeof marketplace;
  messages: typeof messages;
  migrated_subscriptions: typeof migrated_subscriptions;
  migration: typeof migration;
  migrations: typeof migrations;
  notificationHelpers: typeof notificationHelpers;
  notifications: typeof notifications;
  promotions: typeof promotions;
  push: typeof push;
  pushActions: typeof pushActions;
  reputation: typeof reputation;
  slotTypeSanitizer: typeof slotTypeSanitizer;
  slots_engine: typeof slots_engine;
  subscriptions: typeof subscriptions;
  support: typeof support;
  support_actions: typeof support_actions;
  tasks: typeof tasks;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
