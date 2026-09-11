import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { APPLICATIONS_FILE, DATA_DIR } from './paths.js';
import type { Application } from './types.js';
import type { ApplicationInput } from './validate.js';

/**
 * Serialises writes behind a promise chain. Read-modify-write on a JSON file is
 * not atomic, so two concurrent submissions would otherwise read the same
 * array and the second write would drop the first row.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Application[]> {
  try {
    const raw = await fs.readFile(APPLICATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as { applications?: Application[] };
    return parsed.applications ?? [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

async function append(input: ApplicationInput): Promise<Application> {
  const application: Application = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    ...input,
  };

  const applications = await readAll();
  applications.push(application);

  await fs.mkdir(DATA_DIR, { recursive: true });
  // Write to a temp file then rename, so a crash mid-write cannot truncate the
  // existing submissions.
  const tmp = path.join(DATA_DIR, `.applications.${process.pid}.tmp`);
  await fs.writeFile(tmp, JSON.stringify({ applications }, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, APPLICATIONS_FILE);

  return application;
}

export function saveApplication(input: ApplicationInput): Promise<Application> {
  const next = writeQueue.then(
    () => append(input),
    () => append(input),
  );
  writeQueue = next.catch(() => undefined);
  return next;
}
