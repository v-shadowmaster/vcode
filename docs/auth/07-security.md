# Chapter 7 — Security

"Secure by default" was a requirement, not a nice-to-have. The good news: if you followed Chapters 3–6, you've *already* built in most of the defenses. This chapter pulls them together, names the attack each one stops, and adds the few remaining hardening steps. No new heavy machinery — just discipline.

---

## 7.1 The threat-to-defense map

Every defense in this system exists to stop a specific attack. Here's the whole picture on one page:

| Attack | What the attacker tries | Our defense | Where it lives |
|--------|------------------------|-------------|----------------|
| **CSRF on login** | Forge a callback to log you into *their* account | `state` validated against Redis | Ch. 3 |
| **Authorization-code interception** | Steal the code from the redirect and redeem it | **PKCE** `code_verifier` | Ch. 3 |
| **ID-token forgery** | Send a fake "I'm Alice" token | Verify signature against Google's JWKS | Ch. 3 |
| **Token meant for another app** | Replay a Google token issued to a different client | Check `aud` == our client id | Ch. 3 |
| **ID-token replay** | Reuse an old captured ID token | `nonce` match | Ch. 3 |
| **XSS token theft** | Malicious JS reads your token | **HttpOnly** cookies | Ch. 4 |
| **CSRF on API** | Trick your browser into a state-changing call | `SameSite` cookies + CSRF token | this chapter |
| **DB leak → usable tokens** | Steal refresh tokens from the database | Store only **hashes** | Ch. 4 |
| **Refresh-token theft** | Use a stolen refresh token | **Rotation** + reuse detection | this chapter |
| **Account takeover via email** | Make a Google account with your email | Link on `sub`, require `email_verified` | Ch. 5 |
| **Brute force / abuse** | Hammer endpoints | **Rate limiting** (Redis) | this chapter |
| **Open redirect** | Bounce users to a phishing site after login | Allowlist `returnTo` | this chapter |

The rest of this chapter expands the four rows marked "this chapter."

---

## 7.2 Cookie security (the foundation)

Every auth cookie carries the same four flags. Each flag stops something:

```ts
res.cookie("access_token", token, {
  httpOnly: true,  // JS can't read it          -> stops XSS token theft
  secure: true,    // HTTPS only                -> stops network sniffing
  sameSite: "lax", // not sent cross-site        -> stops most CSRF
  path: "/",       // (refresh token: scoped)    -> limits exposure
});
```

| Flag | Without it | With it |
|------|-----------|---------|
| `httpOnly` | A single XSS bug steals every token | JS literally cannot see the cookie |
| `secure` | Tokens sent over plain HTTP can be sniffed | Only ever sent over TLS |
| `sameSite=lax` | Other sites can trigger authenticated requests | Cookie withheld on cross-site requests |
| scoped `path` | Long-lived refresh token rides on every request | Refresh token only goes to `/api/auth/refresh` |

> `HttpOnly` is the big one. It's the reason we use cookies instead of `localStorage`: **tokens in `localStorage` are readable by any script on your page, so one XSS = total account compromise.** Cookies with `HttpOnly` take that prize off the table.

---

## 7.3 CSRF — the part `SameSite` doesn't fully cover

**CSRF (Cross-Site Request Forgery):** a malicious site makes *your* browser send an authenticated request to *our* API, relying on the browser auto-attaching your cookies.

`SameSite=Lax` already blocks the common cases (it withholds the cookie on cross-site `POST`s). For defense-in-depth on state-changing requests, add the **double-submit cookie** pattern:

1. On login, also set a **non-HttpOnly** cookie `csrf_token` = a random value. (Non-HttpOnly *on purpose* — the frontend must read it.)
2. The frontend sends that value back in an `X-CSRF-Token` header on every `POST`/`DELETE`.
3. The backend checks header == cookie.

```ts
function requireCsrf(req, res, next) {
  const cookie = req.cookies?.csrf_token;
  const header = req.headers["x-csrf-token"];
  if (!cookie || cookie !== header) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Bad CSRF token" } });
  }
  next();
}
```

Why it works: a malicious cross-site page **can't read** your `csrf_token` cookie (it's on our domain), so it can't put the matching value in the header. Same-origin JS can. Apply `requireCsrf` to mutating endpoints; skip it on pure reads.

---

## 7.4 Refresh-token rotation & reuse detection

We rotate refresh tokens on every use (Chapter 4). Rotation's real superpower is **catching theft**.

The logic: a refresh token is single-use. The moment it's used, it's replaced. So if a token is *ever presented twice*, exactly one of these is true — and both are bad:

- the legitimate user used it, then an attacker replayed their stolen copy, or
- an attacker used it first, and now the legitimate user's copy looks "old."

Either way, **a token reappearing after it was rotated away means the session is compromised.** The correct response is harsh and correct: **kill the whole session** (force re-login on that device).

### The simple version (what our schema supports today)

Our `session` row stores the *current* token hash. If a refresh comes in that doesn't match any live session, we reject it. That covers the basic case.

### The upgraded version (when you want true reuse detection)

To positively *detect a reused-but-previously-valid* token, keep a short history instead of overwriting. Promote refresh tokens to their own table with a rotation chain:

```prisma
model RefreshToken {
  id         String    @id @default(uuid()) @db.Uuid
  sessionId  String    @db.Uuid
  tokenHash  String    @unique
  rotatedAt  DateTime?            // set when this token is rotated away
  createdAt  DateTime  @default(now())
}
```

On refresh:

```ts
const row = await db.refreshToken.findUnique({ where: { tokenHash: hashToken(presented) } });

if (!row) {
  // Unknown token -> reject.
  return reject();
}
if (row.rotatedAt) {
  // 🚨 A token that was ALREADY rotated is being used again = theft.
  // Nuke the entire session (the whole token chain).
  await db.refreshToken.deleteMany({ where: { sessionId: row.sessionId } });
  await db.session.delete({ where: { id: row.sessionId } });
  await logAuthEvent(row.userId, "refresh_reuse_detected", req);
  return reject();
}
// Healthy: mark this one rotated, issue the next in the chain.
```

> Start with the simple version. Add the history table the day you want "we detected suspicious activity and signed you out" behavior. Both are correct; the upgrade is purely about *detection sharpness*.

---

## 7.5 Rate limiting (the other reason for Redis)

Without limits, attackers can hammer your endpoints — brute-forcing, spamming logins, abusing the refresh endpoint. A simple **counter with auto-expiry** stops it, and that's exactly what Redis is great at.

```ts
// Allow at most `limit` requests per `windowSec` per key (e.g. per IP).
async function rateLimit(key: string, limit: number, windowSec: number) {
  const count = await redis.incr(key);          // atomic increment
  if (count === 1) await redis.expire(key, windowSec); // first hit -> start the clock
  return count <= limit;
}

// Example: 10 login starts per IP per minute.
app.get("/api/auth/google/start", async (req, res, next) => {
  const ok = await rateLimit(`rl:login:${req.ip}`, 10, 60);
  if (!ok) return res.status(429).json({ error: { code: "RATE_LIMITED", message: "Slow down." } });
  next();
});
```

The key (`rl:login:<ip>`) auto-deletes after the window, so there's no cleanup and no permanent state. Apply tighter limits to sensitive endpoints:

| Endpoint | Suggested limit |
|----------|----------------|
| `/google/start` | 10 / min / IP |
| `/refresh` | 30 / min / IP |
| `/sessions/:id` DELETE | 20 / min / user |

---

## 7.6 Open-redirect protection

If you support `?returnTo=` (to send users back where they started after login), an attacker could pass `?returnTo=https://evil.com` and bounce your users to a phishing clone. Allow **only same-site, relative paths**:

```ts
function safeReturnTo(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  // Must start with a single "/" and not "//" (which means another host).
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}
```

The same rule applies to Google's `redirect_uri` — but Google enforces *that* one for us via the console allowlist (Chapter 3). This check covers the part *we* control.

---

## 7.7 Secrets & keys

- **`GOOGLE_CLIENT_SECRET` and `ACCESS_TOKEN_SECRET`** live in environment variables / a secret manager — **never** in the repo, never shipped to the frontend.
- The access-token secret should be long and random (e.g. `crypto.randomBytes(32)`).
- **Rotating the access-token secret** invalidates all existing access tokens (users transparently re-mint via `/refresh`). That's your "break glass" button if the secret ever leaks.
- When you outgrow one backend and multiple services must verify tokens, switch HS256 → **RS256**: the auth service signs with a private key, everyone else verifies with the public key. You don't need it yet — but now you know the upgrade.

---

## 7.8 The secure-by-default checklist

Pin this somewhere. If every box is checked, you've covered the fundamentals that matter at this scale.

**Tokens & cookies**
- [ ] Access + refresh tokens only in `HttpOnly`, `Secure`, `SameSite` cookies (never `localStorage`)
- [ ] Refresh cookie path-scoped to `/api/auth/refresh`
- [ ] Access tokens short-lived (~15 min); refresh tokens rotated on use
- [ ] Refresh tokens stored **hashed**, never in plaintext

**OAuth flow**
- [ ] `state` generated, stored server-side, validated, single-use
- [ ] PKCE (`code_challenge`/`code_verifier`) on every login
- [ ] ID token signature, `iss`, `aud`, `exp`, and `nonce` all verified
- [ ] Code exchanged server-side with the client secret

**Accounts**
- [ ] Identity keyed on provider `sub`, not email
- [ ] Auto-linking requires `email_verified == true`
- [ ] Users can't unlink their last login method

**Hardening**
- [ ] CSRF token on state-changing requests
- [ ] Rate limiting on auth endpoints
- [ ] `returnTo` / redirect targets allowlisted
- [ ] Secrets in env/secret-manager, never in code
- [ ] Auth events logged (Chapter 5)

**Next:** [Chapter 8 → Performance](./08-performance.md)
