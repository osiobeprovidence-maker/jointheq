// Utility to strictly sanitize and validate `slot_types` payloads
// Must only include fields defined in the schema and must validate types.

export type SlotType = {
  access_type?: string;
  capacity?: number;
  device_limit: number;
  downloads_enabled: boolean;
  features?: string[];
  min_q_score: number;
  name: string;
  price: number;
  subscription_id?: string; // must match schema field name exactly
};

function toNumber(value: unknown, fieldName: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value as number;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  throw new Error(`Invalid or missing numeric field '${fieldName}'`);
}

function toBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim();
    if (v === 'true') return true;
    if (v === 'false') return false;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  throw new Error(`Invalid or missing boolean field '${fieldName}'`);
}

function toString(value: unknown, fieldName: string): string {
  if (typeof value === 'string') return value;
  throw new Error(`Invalid or missing string field '${fieldName}'`);
}

function toStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) throw new Error(`Invalid field '${fieldName}': must be an array of strings`);
  for (const it of value) {
    if (typeof it !== 'string') throw new Error(`Invalid '${fieldName}' item: all entries must be strings`);
  }
  return value as string[];
}

export function sanitizeSlotType(input: unknown): SlotType {
  if (input == null || typeof input !== 'object') {
    throw new Error('slot_type input must be an object');
  }
  const obj = input as { [k: string]: unknown };

  // Only allow the exact schema fields; ignore or reject any others.
  const allowed = new Set([
    'access_type',
    'capacity',
    'device_limit',
    'downloads_enabled',
    'features',
    'min_q_score',
    'name',
    'price',
    'subscription_id',
  ]);

  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new Error(`Unexpected field '${key}' present on slot_type; only schema fields allowed`);
    }
  }

  // Required fields: device_limit (float64), downloads_enabled (boolean), min_q_score (float64), name (string), price (float64)
  const device_limit = toNumber(obj['device_limit'], 'device_limit');
  const downloads_enabled = toBoolean(obj['downloads_enabled'], 'downloads_enabled');
  const min_q_score = toNumber(obj['min_q_score'], 'min_q_score');
  const name = toString(obj['name'], 'name');
  const price = toNumber(obj['price'], 'price');

  const out: SlotType = {
    device_limit,
    downloads_enabled,
    min_q_score,
    name,
    price,
  };

  if ('access_type' in obj && obj['access_type'] !== undefined && obj['access_type'] !== null) {
    out.access_type = toString(obj['access_type'], 'access_type');
  }

  if ('capacity' in obj && obj['capacity'] !== undefined && obj['capacity'] !== null) {
    out.capacity = toNumber(obj['capacity'], 'capacity');
  }

  if ('features' in obj && obj['features'] !== undefined && obj['features'] !== null) {
    out.features = toStringArray(obj['features'], 'features');
  }

  if ('subscription_id' in obj && obj['subscription_id'] !== undefined && obj['subscription_id'] !== null) {
    // Strict: accept only a string id for subscription_id. Do not accept other field names.
    if (typeof obj['subscription_id'] === 'string') {
      out.subscription_id = obj['subscription_id'] as string;
    } else {
      throw new Error("Invalid 'subscription_id': must be a string identifier matching schema");
    }
  }

  return out;
}

export function sanitizeSlotTypesArray(input: unknown): SlotType[] {
  if (!Array.isArray(input)) throw new Error('slot_types must be an array');
  return input.map((it, i) => {
    try {
      return sanitizeSlotType(it);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`slot_types[${i}]: ${msg}`);
    }
  });
}

// Example usage (server-side Convex function):
// const sanitized = sanitizeSlotType(rawSlot);
// await db.insert('slot_types', sanitized);
