import fs from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR, SUBSCRIPTIONS_FILE } from './paths.js';
import type { Tier } from './types.js';

/**
 * The record of who is paying for which membership.
 *
 * Deliberately separate from partners.json. That file is hand-edited and is
 * the source of truth for what the site shows; this one is written by machine
 * from Stripe events. Keeping them apart means a webhook can never corrupt the
 * partner directory, and you stay the one who decides when a tier goes live.
 *
 * Lives in the data directory, so it survives a redeploy like applications.json.
 */

export interface Subscription {
  /** Stripe subscription id — the row's identity, so replays cannot duplicate. */
  id: string;
  partnerId: string;
  tier: Tier;
  category: string;
  businessName: string;
  /** Stripe's own status: active, past_due, canceled, incomplete… */
  status: string;
  customerId: string;
  email: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
  /** Set when the subscription ends, so a freed slot is obvious in the file. */
  endedAt?: string;
}

let writeQueue: Promise<unknown> = Promise.resolve();

export async function readSubscriptions(): Promise<Subscription[]> {
  try {
    const raw = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as { subscriptions?: Subscription[] };
    return parsed.subscriptions ?? [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

async function write(subscriptions: Subscription[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // Temp file then rename, so a crash mid-write cannot truncate the record.
  const tmp = path.join(DATA_DIR, `.subscriptions.${process.pid}.tmp`);
  await fs.writeFile(tmp, JSON.stringify({ subscriptions }, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, SUBSCRIPTIONS_FILE);
}

/**
 * Inserts or updates one subscription, keyed on the Stripe id.
 *
 * Stripe retries a webhook until it gets a 2xx and may deliver the same event
 * more than once, so this has to be idempotent: the same event arriving twice
 * must leave one row, not two.
 */
async function upsert(record: Subscription): Promise<boolean> {
  const all = await readSubscriptions();
  const existing = all.findIndex((s) => s.id === record.id);
  const isNew = existing === -1;

  if (isNew) {
    all.push(record);
  } else {
    all[existing] = { ...all[existing], ...record, createdAt: all[existing].createdAt };
  }

  await write(all);
  return isNew;
}

/** Resolves true when this subscription had not been recorded before. */
export function saveSubscription(record: Subscription): Promise<boolean> {
  const next = writeQueue.then(
    () => upsert(record),
    () => upsert(record),
  );
  writeQueue = next.catch(() => undefined);
  return next;
}

/** Patches status on an existing row; used when a subscription lapses or ends. */
export function updateSubscriptionStatus(
  id: string,
  status: string,
  endedAt?: string,
): Promise<void> {
  const apply = async () => {
    const all = await readSubscriptions();
    const row = all.find((s) => s.id === id);
    if (!row) return;
    row.status = status;
    row.updatedAt = new Date().toISOString();
    if (endedAt) row.endedAt = endedAt;
    await write(all);
  };
  const next = writeQueue.then(apply, apply);
  writeQueue = next.catch(() => undefined);
  return next;
}
