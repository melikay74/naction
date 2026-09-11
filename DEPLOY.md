# Deploying to hosting.com (cPanel + Node.js 20)

cPanel's "Setup Node.js App" runs Phusion Passenger. This guide targets a **staging subdomain first**,
with search engines blocked, because the partner directory is still placeholder data.

Everything compiles locally. The host only ever installs `express` — no TypeScript, Vite, or React.

---

## 1. Build the bundle

```bash
cd site
./scripts/build-deploy.sh
```

Produces `deploy/naction-deploy.zip` (~1.7 MB) in **staging** mode: crawlers blocked, warning banner
shown. Use `./scripts/build-deploy.sh production` only when the real directory is in and you're going
live.

## 2. Decide the URL

**If your plan allows a subdomain** (cPanel → Domains → Create A New Domain): make
`staging.yourdomain.com` and use it as the Application URL.

**If it doesn't:** deploy to the main domain and set a `STAGING_PASSWORD` (step 5). That is actually the
stronger option — a subdomain is still publicly reachable by anyone who guesses the URL, whereas a
password makes the preview genuinely private. It matters here because the placeholder data looks like
emergency phone numbers.

## 3. Create the persistent data directory

**Do this before the first deploy.** cPanel → **File Manager**, and in your home directory (not inside
the app folder) create:

```
/home/<cpanel-user>/naction-data/
```

Upload `site/data/partners.json` into it.

This is where partner applications accumulate. It lives **outside** the app directory on purpose — a
redeploy replaces the app folder wholesale, which would otherwise wipe every application received since
the last deploy and overwrite your real partner list with whatever shipped in the bundle.

## 4. Upload the app

If you have already created the Node.js application, cPanel will have made
`/home/<cpanel-user>/naction/` containing `public/` and `tmp/`. **Leave both alone** — Passenger uses
`tmp/restart.txt` to trigger restarts.

File Manager → open `/home/<cpanel-user>/naction/` → upload `naction-deploy.zip` → **Extract** *there*.

The bundle is zipped flat, with no wrapping folder, so its contents land directly in that directory
alongside `public/` and `tmp/`. Afterwards the folder should hold:

```
app.js        package.json    client/    server/    data/    public/    tmp/
```

Delete the zip once extracted.

## 5. Set up the Node app

cPanel → **Setup Node.js App** → Create Application:

| Field | Value |
|---|---|
| Node.js version | **20.x** |
| Application mode | Production |
| Application root | `naction` |
| Application URL | your staging subdomain |
| Application startup file | `app.js` |

Before saving, add two **environment variables**:

| Name | Value |
|---|---|
| `NACTION_DATA_DIR` | `/home/<cpanel-user>/naction-data` |
| `SITE_ENV` | `staging` |
| `STAGING_PASSWORD` | a password you choose — required if staging is on the main domain |
| `STAGING_USER` | optional, defaults to `preview` |

With `STAGING_PASSWORD` set, every request — page, API, and assets alike — returns `401` until the
browser's login prompt is satisfied. Clear the variable and restart to lift it; no rebuild needed.

Save, then click **Run NPM Install**, then **Restart**.

## 5b. Email notifications

Applications are always written to `applications.json` first — email is a notification on top of that
record, so a mail outage can never cost you an application.

**In cPanel → Email Accounts**, create a mailbox on your domain — the username is entirely your choice.
Then add these environment variables to the Node app:

| Name | Value |
|---|---|
| `SMTP_HOST` | `mail.nactionadvisors.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | the mailbox you created, e.g. `hello@nactionadvisors.com` |
| `SMTP_PASS` | that mailbox's password |
| `SMTP_FROM` | `NAction Advisors <hello@nactionadvisors.com>` |
| `APPLICATIONS_TO` | where you want to read them — any address, your normal inbox is fine |

`SMTP_FROM` must be on your own domain or SPF will reject it, but the display name in front of the
address is free text and is what applicants see in their inbox. `APPLICATIONS_TO` is just the variable
name, not an address — it can point anywhere.

Use port `465`; the app switches to STARTTLS automatically if you set `587` instead.

On restart the log tells you which state you're in:

```
[naction] SMTP ready — notifications go to you@example.com
[naction] SMTP check FAILED — applications will save but no email will send: ...
[naction] SMTP is not configured — applications are saved to disk but no email is sent.
```

**Two emails go out per application:** a notification to `APPLICATIONS_TO`, with the applicant set as
`Reply-To` so replying reaches them directly; and a confirmation to the applicant, with your address as
`Reply-To`.

**Check SPF and DKIM before relying on the applicant confirmation.** cPanel → **Email Deliverability**
lists your domain and flags anything missing, usually with a "Repair" button. Without them, mail sent to
strangers from a shared host frequently lands in spam. The notification to yourself is unaffected — that
never leaves your own mail server.

`SMTP_PASS` belongs only in cPanel's environment variables, never in the repository.

## 6. Check it

Visit the subdomain. You should see the site with a dark red "Staging preview" bar across the top.

```bash
curl -sI https://staging.yourdomain.com/ | grep -i x-robots-tag
#   X-Robots-Tag: noindex, nofollow, noarchive, nosnippet

curl -s https://staging.yourdomain.com/robots.txt
#   User-agent: *
#   Disallow: /

curl -s "https://staging.yourdomain.com/api/partners?zip=90210&categories=tow&limit=2"

# With a password set, expect 401 without credentials and 200 with them:
curl -s -o /dev/null -w '%{http_code}\n' https://yourdomain.com/
curl -s -o /dev/null -w '%{http_code}\n' -u preview:YOURPASSWORD https://yourdomain.com/
```

Submit the partner form once, then confirm the row appears in
`/home/<cpanel-user>/naction-data/applications.json`.

---

## Redeploying

```bash
./scripts/build-deploy.sh
```

Upload and extract over `/home/<cpanel-user>/naction/`, then **Restart** in Setup Node.js App. Re-run
NPM Install only if `express` changed version.

`naction-data/` is never touched by a redeploy.

## Going live

Only after the real partner directory replaces the placeholder data.

1. `./scripts/build-deploy.sh production`
2. Upload, extract, change `SITE_ENV` to `production`, and **delete `STAGING_PASSWORD`**
3. Restart
4. Verify `robots.txt` now reads `Allow: /` and the staging banner is gone
5. Point the root domain at the app (Setup Node.js App → change Application URL), or create a second
   application for it

## Before going live — still outstanding

- **`data/partners.json` holds 56 fictional businesses** with `example.com` sites and 555 phone numbers.
  This is the blocker: a real visitor calling one of these reaches a dead line.
- Placeholder contact details in `client/src/config.ts` — phone `(800) 555-1234`, email, website.
- The privacy policy still carries its "Draft for legal review" banner and needs a lawyer's eyes.
- `service-area.png` and `join-qr.png` were never added, so the coverage map and QR show empty frames.
- The legal questions noted in README.md: CalOPPA, § 6155 lawyer referral registration, and paid-placement
  disclosure for the platinum/gold/silver tiers.

## Email: the working setup

Reached after a long debugging session — the details below are the ones that mattered.

**The domain's mail lives at Titan** (MX → `mx1/mx2.titan.email`), white-labelled by hosting.com, so
webmail is at `https://webmail.hosting.com/mail/`, not Titan's own site.

**Sending goes through cPanel, not Titan.** Titan returned `535 authentication failed` for SMTP even with
a password that worked in webmail, from both `smtp.titan.email` and `smtp.hosting.com` (the same backend).
That appears to be a plan-level restriction. The working configuration:

| Name | Value |
|---|---|
| `SMTP_HOST` | `mail.nactionadvisors.com` — cPanel's mail server |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | a **cPanel** mailbox, e.g. `noreply@nactionadvisors.com` |
| `SMTP_PASS` | that mailbox's password |
| `SMTP_FROM` | must be an address that **exists at Titan** — see below |
| `APPLICATIONS_TO` | `jose@nactionadvisors.com` (the Titan inbox) |

**The trap that cost the most time: `SMTP_FROM` must exist at Titan, not just in cPanel.**

Titan performs a *sender callout* — on receiving mail it connects back to the domain's MX and checks the
sender address is real. A cPanel-only mailbox fails that check, because MX points at Titan and the
address doesn't exist there:

```
550-Verification failed for <noreply@nactionadvisors.com>
550-Response: 550 5.1.1 Recipient address rejected: User unknown
550 Invalid sender
```

Two ways to satisfy it:

1. Set `SMTP_FROM` to an address that already exists at Titan (`jose@`), or
2. **Better:** create `noreply@` in **Titan** as a mailbox or alias, then use it. Sender callouts are not
   a Titan quirk — other providers do the same, so applicant confirmations to Gmail and Outlook can be
   rejected the same way if the From address isn't genuinely deliverable.

Also set cPanel → **Email Routing** to **Remote Mail Exchanger**. On "Local", cPanel delivers mail for
`@nactionadvisors.com` to itself instead of Titan — the send succeeds and the mail silently never arrives.

Do not create a cPanel mailbox with the same address as a Titan one. Mail can be delivered into the local
copy and sit in an inbox nobody opens.

## Diagnosing email

**`/api/diagnostics/email`** — staging only, 404s once `SITE_ENV=production`. Opens a real SMTP
connection and reports, redacted:

```json
{ "host": "...", "port": "465", "user": "n***@domain.com",
  "fromMatchesUser": true,
  "password": { "length": 11, "hasLeadingOrTrailingSpace": false, "looksQuoted": false },
  "verify": "ok — connected and authenticated" }
```

The `password.length` field exists because a control panel can mangle a value on save, which looks
identical to a wrong password from the server's side. Compare it against what you actually typed.

**`verify: ok` but no mail arriving** means sending works and the problem is delivery. Go to cPanel →
**Email → Track Delivery**, which is Exim's real log, and open the details on a failed row. That is what
finally exposed the sender-callout rejection above — nothing else in the stack reported it.

The server also logs its state at boot: `SMTP ready`, `SMTP check FAILED`, or `SMTP is not configured`.
cPanel's logs are gzipped and rotated, so the diagnostics endpoint is usually faster to read.

## HTTPS and certificate renewal

Free SSL comes from cPanel's **Let's Encrypt** plugin, not AutoSSL. Issue for both `yourdomain.com` and
`www.`, then enable **Force HTTPS Redirect** under Domains.

**The app must not swallow ACME validation.** Certificates renew automatically around day 60 by fetching
`/.well-known/acme-challenge/<token>`. The SPA fallback would answer that with `index.html` — a 200
containing the wrong body — so validation fails and the certificate quietly expires. `server/src/index.ts`
serves that path from `public/.well-known` and 404s anything unresolved, deliberately before the fallback.
Do not reorder those routes.

If the browser still shows "Not secure" after issuing, it is almost always a cached redirect: DevTools →
Application → Clear site data, or `chrome://net-internals/#hsts` → Delete domain security policies.

## Uploads flagged as a virus

cPanel's ClamAV ships Sanesecurity's Foxhole rules, which flag **any zip containing JavaScript**:

```
Sanesecurity.Foxhole.JS_Zip_12.UNOFFICIAL FOUND
```

A false positive — this bundle is entirely compiled JavaScript. `build-deploy.sh` emits
`naction-deploy.tar.gz` alongside the zip with identical contents; upload that instead. File Manager
extracts both.

## Troubleshooting

**502 / "We're sorry, but something went wrong"** — Passenger couldn't start the app. Check the log path
shown in Setup Node.js App, and confirm the startup file is exactly `app.js`.

**`Cannot use import statement outside a module`** — the bundle's top-level `package.json` must **not**
have `"type": "module"`; `server/package.json` must. `build-deploy.sh` sets both correctly, so this means
a file was hand-edited on the host.

**Site loads but search returns errors** — `NACTION_DATA_DIR` is wrong or `partners.json` isn't in it.
The server logs the path it tried.

**Applications aren't saving** — that directory must be writable by the cPanel user (permissions `0755`
on the folder).
