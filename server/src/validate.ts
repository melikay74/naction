import { isCaliforniaZip } from './regions.js';
import { CATEGORIES, isCategory, type Category } from './types.js';

export class ValidationError extends Error {
  readonly field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const MAX_LEN = 200;

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function parseZip(raw: unknown): string {
  const zip = asString(raw);
  if (!zip) throw new ValidationError('Enter a zip code.', 'zip');
  if (!/^\d{5}$/.test(zip)) throw new ValidationError('Enter a 5-digit zip code.', 'zip');
  if (!isCaliforniaZip(zip)) {
    throw new ValidationError('We currently serve California zip codes only.', 'zip');
  }
  return zip;
}

export function parseCategories(raw: unknown): Category[] {
  const value = asString(raw);
  if (!value) return [...CATEGORIES];

  const parts = value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const categories = parts.filter(isCategory);

  if (categories.length !== parts.length) {
    throw new ValidationError(`Categories must be any of: ${CATEGORIES.join(', ')}.`, 'categories');
  }
  if (categories.length === 0) {
    throw new ValidationError('Select at least one service.', 'categories');
  }
  return [...new Set(categories)];
}

export function parseInteger(raw: unknown, fallback: number, min: number, max: number): number {
  const value = asString(raw);
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ValidationError(`Expected an integer between ${min} and ${max}.`);
  }
  return n;
}

export interface ApplicationInput {
  contactName: string;
  businessName: string;
  businessType: Category;
  phone: string;
  email: string;
  website: string;
  serviceArea: string;
}

/** Parse and normalise a partner application. Throws ValidationError on bad input. */
export function parseApplication(body: unknown): ApplicationInput {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Expected a JSON object.');
  }
  const b = body as Record<string, unknown>;

  // Honeypot: a real visitor never sees this field, so anything in it is a bot.
  if (asString(b.company_website_confirm)) {
    throw new ValidationError('Submission rejected.');
  }

  const contactName = asString(b.contactName);
  if (contactName.length < 2) throw new ValidationError('Enter your name.', 'contactName');

  const businessName = asString(b.businessName);
  if (businessName.length < 2) {
    throw new ValidationError('Enter your business name.', 'businessName');
  }

  const businessType = asString(b.businessType);
  if (!isCategory(businessType)) {
    throw new ValidationError('Choose a business type.', 'businessType');
  }

  const phone = asString(b.phone);
  if (phone.replace(/\D/g, '').length < 10) {
    throw new ValidationError('Enter a 10-digit phone number.', 'phone');
  }

  const email = asString(b.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new ValidationError('Enter a valid email address.', 'email');
  }

  const serviceArea = asString(b.serviceArea);
  if (serviceArea.length < 2) {
    throw new ValidationError('Tell us the area you serve.', 'serviceArea');
  }

  const application = {
    contactName,
    businessName,
    businessType,
    phone,
    email,
    website: asString(b.website),
    serviceArea,
  };

  for (const [field, value] of Object.entries(application)) {
    if (value.length > MAX_LEN) {
      throw new ValidationError(`That value is too long (max ${MAX_LEN} characters).`, field);
    }
  }

  return application;
}
