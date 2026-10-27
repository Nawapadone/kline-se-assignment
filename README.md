# TestLab Bank — Frontend Developer Assignment

Three screens from the provided design, built as a React + TypeScript app with
Redux Toolkit and the team's HTML/CSS converted to components.

| Route | From | What it does |
|-------|------|--------------|
| `/` | `splash.html` | Loads the profile, then hands over to the PIN screen |
| `/pin` | `pin.html` | Six-digit PIN with a three-attempt lockout |
| `/main` | `bank_main.html` | Accounts, recent payees, debit cards and banners |

## At a glance

**Run it:** `bun install && bun run dev`, open http://localhost:5173, PIN **123456**.
No backend needed. `docker compose up --build` serves the production build on :8080.

**Five decisions that shape the code**

1. **The PIN block belongs to the authority, not the keypad.** Three wrong PINs
   start an escalating cooldown (1 min, 5 min), then a lock only the bank lifts,
   following NIST SP 800-63B. The mock client plays that authority and survives
   reloads. [Details](#features)
2. **One data boundary.** Screens talk to an `ApiClient`; a mock serves fixtures
   by default and `VITE_USE_MOCK=false` switches to the real endpoints. CI proves
   a real-backend build carries no fixtures. [Details](#api)
3. **Failure is designed, not ignored.** Every screen has loading, error-with-retry
   and empty states; one failed list never blanks the rest; a 401/403 ends the
   session; sign-out clears every balance from memory.
4. **The team's CSS is kept as delivered.** `th-bank.css` is untouched; the few
   additions live in `styles/app.css`. [Why not Tailwind](#decisions-worth-knowing)
5. **Logic lives in plain functions.** Masking, PIN rules and error wording sit in
   `src/lib`, so they are unit-tested without a DOM.

**Quality gates, all in CI:** 112 unit tests, 57 Playwright end-to-end tests
(including fault injection for half-loaded screens), 32 Storybook stories,
typecheck, lint with React hooks rules, and a Docker job that checks the security
headers. English and Thai UI via `VITE_LOCALE`.

**Where to look first:** `src/features/` (the three screens), `src/store/` (state
and session rules), `src/lib/` (business rules), and [Known gaps](#known-gaps)
for what the provided resources left open.

## Setup

**bun is required** — not only as the package manager. Vite, Playwright and
Storybook all run under npm, but the unit tests use `bun test`, which has no npm
equivalent. Install bun from [bun.sh](https://bun.sh) first.

```bash
bun install
bun run dev          # http://localhost:5173
```

The demo PIN is **123456**. Mock data is served from `src/api/mock/data`, so no
backend is needed.

```bash
bun run test         # unit tests (112)
bun run test:e2e     # Playwright end-to-end (57), starts the servers itself
bun run typecheck    # tsc --build
bun run build        # production build into dist/
bun run storybook    # component explorer and interaction tests on :6006
bun run test-storybook --url <url>  # play functions against a served Storybook
bun run lint         # oxlint, with the React hooks rules
```

CI (`.github/workflows/ci.yml`) runs all of these on pushes to `main` and on
pull requests, with Storybook as a static build: it serves `storybook-static`
and renders every story in Chromium, running the play functions where a story
has one.

### Docker

```bash
docker compose up --build      # http://localhost:8080
```

Or without compose:

```bash
docker build -t kline-frontend .
docker run --rm -p 8080:8080 kline-frontend
```

The image is built in two stages: bun installs and runs `bun run build`, which
is `tsc -b && vite build`, so a type error fails the build; the second stage is
nginx with only `dist/` copied in, so neither bun nor `node_modules` nor the
sources ship. `docker/nginx.conf` returns `index.html` for unmatched paths —
without that, reloading on `/pin` or `/main` would 404 — and caches the
fingerprinted files in `/assets/` while keeping `index.html` fresh. The image
runs nginx unprivileged and sends a Content-Security-Policy plus the usual
security headers; its `connect-src` takes `VITE_API_BASE_URL`.

Vite inlines `VITE_*` at build time, so configuration is **build arguments**,
not runtime environment. A different setting means a different image:

```bash
docker build --build-arg VITE_USE_MOCK=false \
             --build-arg VITE_API_BASE_URL=https://api.example.com \
             -t kline-frontend .
```

The UI ships in English and Thai; `VITE_LOCALE=th` builds the Thai one:

```bash
docker build --build-arg VITE_LOCALE=th -t kline-frontend:th .
VITE_LOCALE=th bun run dev
```

The end-to-end suite needs a browser once: `bunx playwright install chromium`.

Configuration is optional — every variable has a working default. Copy
`.env.example` to `.env` to change any of them; `.env` is git-ignored, and the
test suites pin their own values so a local file cannot change what they test.

## Project structure

```
src/
├── api/                    # the only place that knows where data comes from
│   ├── types.ts            #   ApiClient — the contract both clients implement
│   ├── client.ts           #   RealApiClient: fetch against api-specs.md
│   ├── error.ts            #   ApiError, carrying the HTTP status
│   ├── index.ts            #   picks a client from VITE_USE_MOCK
│   └── mock/
│       ├── client.ts       #   MockApiClient: fixtures, latency, attempt counting
│       └── data/*.json     #   responses copied from api-specs.md
├── i18n/                   # en/th dictionaries and t(); locale fixed per build
├── lib/                    # business logic, no React, unit-tested
│   ├── account.ts          #   titles, product lines, actions, main-account moves
│   ├── card.ts             #   card-number masking, status labels
│   ├── money.ts            #   ฿62,000.00
│   ├── pin.ts              #   PIN length, attempt budget, error wording
│   └── load-error.ts       #   failure -> a line a user can read
├── store/                  # Redux Toolkit
│   ├── slices/             #   user, auth, accounts, dashboard
│   ├── selectors.ts        #   memoised reads
│   ├── actions.ts          #   shared `signedOut` action
│   ├── createApiThunk.ts   #   thunk factory that classifies errors
│   └── hooks.ts            #   pre-typed useAppSelector / useAppDispatch
├── components/             # presentational, plus their stories
│   └── InertLink.tsx       #   template links with no destination
├── features/               # one folder per screen, with its own hooks
├── app/                    # routes, the PIN guard and the render error boundary
├── styles/
│   ├── th-bank.css         #   provided, unmodified
│   └── app.css             #   every rule added here, kept separate
└── img/                    # provided images

e2e/                        # Playwright specs (routing, PIN flow, main screen,
                            #   and the app running with no backend reachable)
```

Three rules shape it:

- **One data boundary.** Features import `apiClient` and never learn whether a
  fixture or a server answered. Swapping in a backend is one env variable.
  CI builds with `VITE_USE_MOCK=false` and fails if known fixture strings — the
  demo PIN, the mock's lockout key, a card and an account number — are in the
  output (`bun run check:real-bundle`).
- **Logic outside React.** Anything that decides something — what a card is
  called, which action it offers, how an amount reads, when a PIN locks — lives
  in `src/lib` as a plain function, which is why the tests need no DOM.
- **Provided CSS is ground truth.** `th-bank.css` is vendored byte-for-byte;
  components reuse its class names, and additions go in `app.css`.

## Features

**Splash** fetches `/api/user` and holds for at least 800ms, so the screen does
not flash past. The profile it loads is what the next two screens greet the user
with. A failed load shows the reason and a retry.

**PIN** submits on the sixth digit — `pin.html` has no submit button. A wrong PIN
clears the dots and spends one of three attempts. Digits can also be typed, which
matters on a desktop. Entered digits live only in Redux state, and `/main` is
unreachable without them: the session is held in memory, so a reload returns to
the keypad.

Spending all three attempts blocks the keypad, and there are two ways it can be
blocked — the screen says which:

| Wrong PINs | What happens | What the user reads |
|------------|--------------|---------------------|
| 1–2 | The attempt is spent | `Invalid PIN Code. / You have N attempts left.` |
| 3 | Wait one minute, counted down on screen, then three fresh attempts | `Too many incorrect attempts. / Try again in 0:59.` |
| 6 | Wait five minutes | `… / Try again in 5:00.` |
| 9 | Blocked until the bank lifts it | `Your PIN is locked. / Please contact our call centre to unlock it.` |

Throttling first and locking only after repeated rounds follows NIST SP 800-63B
and OWASP ASVS, which both prefer rate limiting to a lockout: a lock anyone can
trigger by guessing someone else's PIN is itself a denial of service. The wait
escalates the way a phone passcode's does, so a mistyped PIN costs a minute while
someone guessing pays progressively more for the same number of tries.

The block belongs to the authority, not the keypad. `verifyPin` returns the lock
and refuses even a correct PIN while one is in force, so a disabled keypad is a
convenience rather than the control. The screen counts the wait down against a
deadline, which keeps it honest in a backgrounded tab where browsers throttle
timers. With a backend the server times the cooldown; the bundled mock times it
with the device clock, so winding that forward shortens the wait.

With no backend, that authority is `MockApiClient`, so its counters are kept in
`localStorage` — otherwise a reload would clear every block, which is the hole
the design exists to close. One thing is worth knowing: the spec has no endpoint
that reports a standing block, so after a reload the keypad looks usable until
the first attempt. That attempt is refused and costs nothing from the budget. A
backend could close the gap by returning the lock from the session endpoint.

**When data does not arrive** the screens say so rather than sitting blank. The
only waiting affordance the provided CSS ships is `.loader`, the splash spinner,
so it is reused while the accounts load; everything else — a failure message, a
retry, an empty list — is markup the resources do not contain, and lives in
`Notice` plus `styles/app.css`. Three cases are distinguished:

| Case | What the screen shows |
|------|-----------------------|
| Nothing loaded | Full-screen message naming the cause, with a retry. Every route behaves this way — the PIN screen shows it instead of a keypad that cannot check anything |
| One section failed | The accounts stay usable; an inline notice takes the failed strip's place with its own Reload, which re-runs just that request |
| Loaded but empty | "You have no accounts yet." — no retry, because nothing failed |

The wording comes from the status: a 404 reads as "not available yet", a 5xx as a
server problem, and an unreachable backend as "no connection". The three
dashboard lists are fetched with `Promise.allSettled`, so a failing endpoint
costs only its own list instead of discarding the two that answered.

A 401 or 403 from the backend ends a signed-in session and returns to the PIN
screen. Requests time out after 15 s and say so in their own message.

**Main** renders entirely from the payloads. Card colours come from the API
rather than the stylesheet's colour classes, titles fall back to a type label
when the payload carries no name, goal accounts draw their gauge from `progress`,
loans switch from "Disburse" to "Pay" once flagged overdue, and card numbers are
masked to `9440 78•• •••• 3115`. The action menu promotes any account to main —
the card moves to the large slot and keeps its own colour — or copies the account
number, with confirmation. The first-visit hint from the template shows once per
browser.

## API

Endpoints follow `api-specs.md`: `GET /api/user`, `/api/accounts`,
`/api/transactions/recent`, `/api/debit-cards`, `/api/banners`.

Two documented additions, both because the design needs something the spec does
not provide:

| Addition | Why |
|----------|-----|
| `name?` on an account | The design titles cards "Travel New York" and "Need to repay"; neither can be derived from `type`. Absent, the UI falls back to a label from `type`. |
| `POST /api/auth/pin` | The PIN screen needs an authority to check against. The mock compares with `VITE_DEMO_PIN` and owns the attempt budget, the escalating cooldown and the final lock. |

```jsonc
// POST /api/auth/pin  { "pin": "123456" }
{ "success": true }
{ "success": false, "attemptsLeft": 2 }
{ "success": false, "lock": { "kind": "cooldown", "secondsRemaining": 60 } }
{ "success": false, "lock": { "kind": "locked" } }
```

Three rules for whoever implements it:

- **All four are `200` responses.** A block is an answer, not an error. A 4xx or
  5xx — including the `429` that "throttle this endpoint" usually suggests — is
  read as "we could not check your PIN" and leaves the keypad usable, so a
  throttle expressed that way would switch the feature off.
- **`secondsRemaining` is required for `kind: "cooldown"`** and must be a
  positive number. A lock in any other shape is ignored and the attempt is
  spent, rather than leaving the user with a keypad disabled for good.
- **Never send `attemptsLeft: 0` without a lock.** Zero attempts and nothing
  blocking them reads as a dead end on a working keypad.

Whoever implements the backend should note two things the client cannot decide
on its own. Requests are sent with `credentials: 'include'`, so a cookie session
needs CSRF protection on `POST /api/auth/pin`; and the attempt budget has to be
enforced server-side, because a disabled keypad is a convenience, not a control.
The payload shapes are also not trusted blindly: a response that is not the
documented array is treated as empty rather than being handed to the renderer.

## Decisions worth knowing

**Vite, not create-react-app.** CRA is deprecated and does not work with bun. The
deliverable — React from the template HTML — is unchanged.

**`bun test`, not Jest.** Same `describe`/`it`/`expect` API, no extra config on
bun. It covers `src/lib`, the reducers and the mock client — the logic that
decides things, with no DOM needed.

**Playwright on top of that.** Unit tests cannot see wiring: whether the sixth
digit actually submits, whether the guard redirects, whether a menu button is
reachable. One project drives the app against the mock client. A second runs it
with `VITE_USE_MOCK=false` against an origin nothing listens on, which turns
`page.route` into fault injection — a test can serve some endpoints from the
same fixtures and fail others, which is the only way to reproduce a half-loaded
screen and check what it shows.

Between them the tests caught three real defects, each described in the commit
that fixed it: serialised rejections defeating every `instanceof ApiError`
check, two accounts sharing a key, and an outside-click handler that closed the
action menu before its own buttons could be clicked.

**Tailwind was considered and rejected.** The team supplied 1,430 lines of CSS
whose class names match the markup. Rewriting them as utilities would risk the
design for no gain, and Tailwind's preflight fights the stylesheet's own reset.

## Known gaps

- `th-bank.css` points at `img/common/bg_profile.png` and `img/common/bg_logo.png`,
  and `bank_main.html` at `img/main/img-debitcard-make.png`. None ship with the
  resources, so `Avatar` falls back to an icon; the build logs these two URLs as
  unresolved.
- `.main-acc__act` (the corner action on secondary cards) has no rule in
  `th-bank.css`, so it is invisible here exactly as it is in the provided HTML.
- `bank_main.html` prints the second account as `฿300.100`. That is `300.10` with
  a misplaced separator, so this app shows `฿300.10`.
- "Edit Name and Color" is rendered because the template lists it, but is inert:
  no form, colour picker or endpoint was provided for it.
- The screens are framed as a phone on wider viewports. `th-bank.css` has no
  breakpoint past 474px, and `design.jpeg` presents them in phone outlines.
- `VITE_USE_MOCK` defaults to **on**, which suits a project that ships no
  backend but means a deployment that forgets the variable serves fixtures
  instead of failing loudly. Set it explicitly in any real environment.
- Promoting an account to main is a local change. No endpoint in the spec
  accepts it, so the mock stays read-only and a reload shows the server's own
  ordering again.
