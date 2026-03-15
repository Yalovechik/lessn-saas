# Design Document

## Overview

Transfer authentication logic from `lessn` into `lessn-saas`, wiring it to the hosted Supabase instance. The existing `Auth.tsx` visual design is preserved. The new-password flow is handled as a view state inside `Auth.tsx`, triggered by the `PASSWORD_RECOVERY` event from `onAuthStateChange` — no new routes needed.

---

## Architecture

### Files to create or modify

| File                                  | Action | Purpose                                                                    |
| ------------------------------------- | ------ | -------------------------------------------------------------------------- |
| `src/utils/validatePassword.ts`       | Create | Password validation utility (min 6 chars, confirmation match)              |
| `src/pages/Auth.tsx`                  | Modify | Add `reset-password`, `new-password` views; wire `PASSWORD_RECOVERY` event |
| `src/hooks/useAuth.tsx`               | Modify | Expose `resetPassword`, `updatePassword`; handle `PASSWORD_RECOVERY` event |
| `src/integrations/supabase/client.ts` | Note   | Already exists; uses `VITE_SUPABASE_PUBLISHABLE_KEY` — no change needed    |

> Note: `lessn-saas` already has a Supabase client at `src/integrations/supabase/client.ts`. The spec refers to `VITE_SUPABASE_ANON_KEY` but the existing client uses `VITE_SUPABASE_PUBLISHABLE_KEY`. The design preserves the existing client as-is to avoid breaking changes.

---

## Component Design

### `src/utils/validatePassword.ts`

Ported directly from `lessn`, with the minimum length changed from 8 to 6.

```ts
export interface PasswordValidationResult {
    passwordError: string | null;
    repeatError: string | null;
}

export function validatePassword(
    password: string,
    repeat: string,
): PasswordValidationResult {
    return {
        passwordError:
            password.length < 6
                ? "Пароль має містити щонайменше 6 символів"
                : null,
        repeatError: password !== repeat ? "Паролі не збігаються" : null,
    };
}
```

---

### `src/hooks/useAuth.tsx` — changes

Add to `AuthContextType`:

- `resetPassword(email: string): Promise<void>` — calls `supabase.auth.resetPasswordForEmail`
- `updatePassword(password: string): Promise<void>` — calls `supabase.auth.updateUser`

The `onAuthStateChange` listener already exists. Extend it to detect the `PASSWORD_RECOVERY` event and expose it to consumers so `Auth.tsx` can switch views.

Two approaches for surfacing the `PASSWORD_RECOVERY` event to `Auth.tsx`:

**Chosen approach**: expose an `authEvent` state value (`string | null`) from the hook. `Auth.tsx` reads it and switches to `new-password` view when it equals `'PASSWORD_RECOVERY'`. After the reset completes or the user navigates away, the hook clears `authEvent`.

```ts
// additions to AuthContextType
authEvent: string | null;
resetPassword: (email: string) => Promise<void>;
updatePassword: (password: string) => Promise<void>;
```

Inside `onAuthStateChange`:

```ts
supabase.auth.onAuthStateChange((event, session) => {
    setAuthEvent(event); // new
    setUser(session?.user ?? null);
    // ... existing logic
});
```

---

### `src/pages/Auth.tsx` — view state machine

Current views: `login` | `sign-up` (via `isSignUp` boolean).

New view type:

```ts
type AuthView = "login" | "register" | "reset-password" | "new-password";
```

Replace the `isSignUp` boolean with an `AuthView` state. The visual design of the login/register forms is preserved exactly — only the toggle logic changes from a boolean to an enum.

#### View transitions

```
login ──────────────────────────────────────────────────────► register
login ──────────────────────────────────────────────────────► reset-password
reset-password ─────────────────────────────────────────────► login (back link)
PASSWORD_RECOVERY event (from useAuth) ─────────────────────► new-password
new-password (on success or abandon) ───────────────────────► login
```

#### `new-password` view

Rendered inline inside the existing card. Uses `validatePassword` before calling `updatePassword`. On success: calls `signOut` then sets view to `login`. On unmount without completion: calls `signOut` (cleanup via `useEffect` return).

#### `reset-password` view

Calls `resetPassword(email)`. On success: shows a confirmation message. Provides a back-to-login link.

#### `register` view

Calls `signUp(email, password)` — no `full_name`. On success: shows a confirmation message asking the user to verify their email.

---

## Data Flow

```
User clicks reset link in email
  └─► Supabase redirects to app origin with recovery token in URL hash
        └─► supabase.auth.onAuthStateChange fires PASSWORD_RECOVERY
              └─► useAuth sets authEvent = 'PASSWORD_RECOVERY'
                    └─► Auth.tsx useEffect detects authEvent, sets view = 'new-password'
                          └─► User submits new password
                                └─► supabase.auth.updateUser({ password })
                                      └─► success: signOut → view = 'login'
```

---

## Error Handling

| Scenario                        | Behaviour                                         |
| ------------------------------- | ------------------------------------------------- |
| Sign-in fails                   | Display Supabase error message inline             |
| Sign-up fails                   | Display Supabase error message inline             |
| Password validation fails       | Display inline field errors; do not call Supabase |
| Reset email fails               | Display Supabase error message inline             |
| Password update fails           | Display Supabase error message inline             |
| User abandons new-password view | `useEffect` cleanup calls `signOut`               |

---

## Correctness Properties

### Password Validator

1. `validatePassword(p, p).repeatError === null` for all strings `p` (equal passwords never produce a repeat error).
2. `validatePassword(p, q).repeatError !== null` when `p !== q` (unequal passwords always produce a repeat error).
3. `validatePassword(p, r).passwordError === null` when `p.length >= 6` (passwords of sufficient length never produce a length error).
4. `validatePassword(p, r).passwordError !== null` when `p.length < 6` (short passwords always produce a length error).

### Round-trip / idempotence

5. Calling `validatePassword` twice with the same inputs returns an equivalent result (pure function, no side effects).

### Auth flow

6. WHEN `PASSWORD_RECOVERY` is emitted, the `new-password` view is shown exactly once (idempotent view switch).
7. IF the user abandons the `new-password` view, `signOut` is called exactly once via the cleanup effect.
