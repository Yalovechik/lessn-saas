# Implementation Plan: Authentication Transfer

## Overview

Port the authentication logic from `lessn` into `lessn-saas`, wiring it to the existing hosted Supabase client. The work touches three files: a new utility, the auth hook, and the auth page. The existing visual design of `Auth.tsx` is preserved throughout.

## Tasks

- [x]   1. Create `src/utils/validatePassword.ts`
    - Port `validatePassword` from `lessn/src/utils/validatePassword.ts`, changing the minimum length from 8 to 6
    - Export `PasswordValidationResult` interface and `validatePassword` named export
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

    - [ ]\* 1.1 Write property tests for `validatePassword` in `src/utils/validatePassword.test.ts`
        - **Property 1: Equal passwords never produce a repeatError** — `validatePassword(p, p).repeatError === null` for all strings `p`
        - **Validates: Requirements 2.5**
    - [ ]\* 1.2 Write property test: unequal passwords always produce a repeatError
        - **Property 2: Mismatched passwords always produce a repeatError** — `validatePassword(p, q).repeatError !== null` when `p !== q`
        - **Validates: Requirements 2.4**
    - [ ]\* 1.3 Write property test: passwords of sufficient length never produce a passwordError
        - **Property 3: Sufficient-length passwords never produce a passwordError** — `validatePassword(p, r).passwordError === null` when `p.length >= 6`
        - **Validates: Requirements 2.3**
    - [ ]\* 1.4 Write property test: short passwords always produce a passwordError
        - **Property 4: Short passwords always produce a passwordError** — `validatePassword(p, r).passwordError !== null` when `p.length < 6`
        - **Validates: Requirements 2.2**
    - [ ]\* 1.5 Write property test: pure function — same inputs always return equivalent result
        - **Property 5: Round-trip / idempotence** — calling `validatePassword` twice with the same inputs returns an equivalent result
        - **Validates: Requirements 2.1**

- [x]   2. Update `src/hooks/useAuth.tsx` — add `authEvent`, `resetPassword`, `updatePassword` - Add `authEvent: string | null` state and expose it via `AuthContextType` - Extend the existing `onAuthStateChange` listener to call `setAuthEvent(event)` on every event - Add `resetPassword(email: string): Promise<void>` — calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })`; throws on error - Add `updatePassword(password: string): Promise<void>` — calls `supabase.auth.updateUser({ password })`; thro

    ws on error
    - _Requirements: 5.1, 6.1, 6.4, 7.1, 7.2_

- [x]   3. Checkpoint — ensure `validatePassword` tests pass and `useAuth` compiles
    - Ensure all tests pass, ask the user if questions arise.

- [x]   4. Update `src/pages/Auth.tsx` — replace `isSignUp` boolean with `AuthView` state machine
    - Define `type AuthView = "login" | "register" | "reset-password" | "new-password"`
    - Replace `isSignUp` boolean state with `const [view, setView] = useState<AuthView>("login")`
    - Add a `useEffect` that watches `authEvent` from `useAuth` and sets `view = "new-password"` when `authEvent === "PASSWORD_RECOVERY"`
    - _Requirements: 6.1_

    - [x] 4.1 Implement `login` view
        - Preserve the existing Tailwind CSS classes, layout, and colour tokens exactly
        - Wire the submit handler to call `signIn(email, password)`; display Supabase error inline; show loading state on button
        - Add "Зареєструватися" link → `setView("register")` and "Забули пароль?" link → `setView("reset-password")`
        - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

    - [x] 4.2 Implement `register` view
        - Add `repeat` password field and inline `passwordError` / `repeatError` display
        - On submit: run `validatePassword`; if errors exist display them and do not call Supabase (Requirements 4.2, 4.3)
        - When validation passes call `signUp(email, password)` without any `options.data` metadata; on success show email-verification confirmation message
        - Show loading state on button; display Supabase error inline on failure
        - Add "Вже є акаунт?" link → `setView("login")`
        - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

    - [x] 4.3 Implement `reset-password` view
        - On submit call `resetPassword(email)`; on success hide the form and show confirmation message
        - Show loading state on button; display Supabase error inline on failure
        - Provide "Назад до входу" link → `setView("login")`
        - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

    - [x] 4.4 Implement `new-password` view
        - Add `password` and `repeat` fields with inline `passwordError` / `repeatError` display
        - On submit: run `validatePassword`; if errors exist display them and do not call Supabase
        - When validation passes call `updatePassword(password)`; on success call `signOut()` then `setView("login")`
        - Add a `useEffect` cleanup that calls `signOut()` if the user navigates away before completing the reset (use a `completedRef` to guard against double sign-out)
        - Show loading state on button; display Supabase error inline on failure
        - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x]   5. Final checkpoint — ensure all tests pass and the app compiles
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The existing Supabase client at `src/integrations/supabase/client.ts` must not be replaced or duplicated
- The visual design of `Auth.tsx` (Tailwind classes, layout, colour tokens) must remain unchanged
- Property tests use `fast-check` (already a dev dependency in `lessn`)
- Each task references specific requirements for traceability
