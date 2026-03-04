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
import type * as campaigns from "../campaigns.js";
import type * as devices from "../devices.js";
import type * as email from "../email.js";
import type * as init from "../init.js";
import type * as lunar from "../lunar.js";
import type * as messages from "../messages.js";
import type * as migration from "../migration.js";
import type * as reputation from "../reputation.js";
import type * as subscriptions from "../subscriptions.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  campaigns: typeof campaigns;
  devices: typeof devices;
  email: typeof email;
  init: typeof init;
  lunar: typeof lunar;
  messages: typeof messages;
  migration: typeof migration;
  reputation: typeof reputation;
  subscriptions: typeof subscriptions;
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
