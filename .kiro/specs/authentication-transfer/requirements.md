# Requirements Document

## Introduction

Transfer the authentication logic and security checks from `lessn` into `lessn-saas`, preserving all security validations and the password-reset flow. The `lessn-saas` login page design must remain unchanged. `lessn-saas` connects to a hosted (remote) Supabase instance, not a local one.

The transfer covers:

- Password validation rules (min 6 chars, confirmation match)
- Registration with email + password only (name is collected post-confirmation in the existing Onboarding step)
- Login via email + password
- Password-reset email flow
- New-password (reset completion) flow handled as a view state inside the Auth page, triggered by the `PASSWORD_RECOVERY` event from `supabase.auth.onAuthStateChange`
- Supabase client wired to hosted env vars

## Glossary

- **Auth_System**: The authentication subsystem in `lessn-saas` responsible for sign-in, sign-up, password reset, and session management.
- **Supabase_Client**: The `@supabase/supabase-js` client instance configured with hosted `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
- **Password_Validator**: The utility function (`validatePassword`) that checks password length and confirmation match.
- **Auth_Page**: The existing `lessn-saas` login/register page (`src/pages/Auth.tsx`) whose visual design must not change.
- **Reset_Flow**: The two-step password-reset process: (1) request a reset email, (2) set a new password via the reset link.
- **useAuth_Hook**: The React context hook (`src/hooks/useAuth.tsx`) that exposes auth state and actions to the rest of the app.

---

## Requirements

### Requirement 1: Supabase Client Configuration

**User Story:** As a developer, I want `lessn-saas` to connect to the hosted Supabase backend, so that authentication calls reach the production database.

#### Acceptance Criteria

1. THE Supabase_Client SHALL be initialised using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables sourced from the hosted Supabase project.
2. IF `VITE_SUPABASE_URL` is absent at startup, THEN THE Supabase_Client SHALL throw an error with the message `"Missing env var: VITE_SUPABASE_URL"`.
3. IF `VITE_SUPABASE_ANON_KEY` is absent at startup, THEN THE Supabase_Client SHALL throw an error with the message `"Missing env var: VITE_SUPABASE_ANON_KEY"`.
4. THE Supabase_Client SHALL be a singleton exported from `src/lib/supabase.ts` and reused by all auth operations.

---

### Requirement 2: Password Validation Utility

**User Story:** As a developer, I want a shared password validation utility in `lessn-saas`, so that all forms enforce the same security rules consistently.

#### Acceptance Criteria

1. THE Password_Validator SHALL accept a `password` string and a `repeat` string and return a `PasswordValidationResult` object containing `passwordError` and `repeatError` fields.
2. WHEN `password` has fewer than 6 characters, THE Password_Validator SHALL return a non-null `passwordError`.
3. WHEN `password` has 6 or more characters, THE Password_Validator SHALL return a null `passwordError`.
4. WHEN `password` and `repeat` are not equal, THE Password_Validator SHALL return a non-null `repeatError`.
5. WHEN `password` and `repeat` are equal, THE Password_Validator SHALL return a null `repeatError`.
6. THE Password_Validator SHALL be located at `src/utils/validatePassword.ts` and exported as a named export.

---

### Requirement 3: Login

**User Story:** As a teacher, I want to sign in with my email and password, so that I can access my account.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Auth_System SHALL call `supabase.auth.signInWithPassword` with the provided email and password.
2. WHEN sign-in succeeds, THE Auth_System SHALL update the session via `onAuthStateChange` without requiring a page reload.
3. IF sign-in fails, THEN THE Auth_System SHALL display the error message returned by Supabase to the user.
4. WHILE a sign-in request is in progress, THE Auth_Page SHALL disable the submit button and show a loading indicator.
5. THE Auth_Page SHALL preserve the existing `lessn-saas` visual design for the login form, including Tailwind CSS classes, layout, and colour tokens.

---

### Requirement 4: Registration

**User Story:** As a new teacher, I want to create an account with my email and password, so that I can start using the app.

#### Acceptance Criteria

1. WHEN a user submits the registration form, THE Auth_System SHALL validate the password using the Password_Validator before calling Supabase.
2. IF `passwordError` is non-null, THEN THE Auth_System SHALL display the password error inline and SHALL NOT call Supabase.
3. IF `repeatError` is non-null, THEN THE Auth_System SHALL display the repeat-password error inline and SHALL NOT call Supabase.
4. WHEN validation passes, THE Auth_System SHALL call `supabase.auth.signUp` with `email` and `password` only, without any `options.data` metadata.
5. WHEN sign-up succeeds, THE Auth_System SHALL display a confirmation message instructing the user to verify their email before logging in.
6. IF sign-up fails, THEN THE Auth_System SHALL display the error message returned by Supabase.
7. WHILE a sign-up request is in progress, THE Auth_Page SHALL disable the submit button and show a loading indicator.

---

### Requirement 5: Password Reset Request

**User Story:** As a teacher who forgot their password, I want to receive a reset link by email, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user submits a valid email on the reset form, THE Auth_System SHALL call `supabase.auth.resetPasswordForEmail` with the email and `redirectTo` set to `window.location.origin`.
2. WHEN the reset email is sent successfully, THE Auth_System SHALL display a confirmation message and hide the form.
3. IF the reset request fails, THEN THE Auth_System SHALL display the error message returned by Supabase.
4. WHILE a reset request is in progress, THE Auth_Page SHALL disable the submit button and show a loading indicator.
5. THE Auth_Page SHALL provide navigation back to the login view from the reset form.

---

### Requirement 6: New Password (Reset Completion)

**User Story:** As a teacher who clicked a reset link, I want to set a new password, so that I can log in with updated credentials.

#### Acceptance Criteria

1. WHEN `supabase.auth.onAuthStateChange` emits a `PASSWORD_RECOVERY` event, THE Auth_Page SHALL switch to the `new-password` view state without navigating to a separate route.
2. WHEN a user submits the new-password form, THE Auth_System SHALL validate the password using the Password_Validator before calling Supabase.
3. IF `passwordError` or `repeatError` is non-null, THEN THE Auth_System SHALL display the respective errors inline and SHALL NOT call Supabase.
4. WHEN validation passes, THE Auth_System SHALL call `supabase.auth.updateUser` with the new password.
5. WHEN the password update succeeds, THE Auth_System SHALL call `supabase.auth.signOut` and switch the Auth_Page back to the `login` view state.
6. IF the user navigates away from the new-password view before completing the reset, THEN THE Auth_System SHALL call `supabase.auth.signOut` to invalidate the recovery session.
7. IF the password update fails, THEN THE Auth_System SHALL display the error message returned by Supabase.

---

### Requirement 7: Session Management

**User Story:** As a teacher, I want my session to persist across page reloads, so that I do not have to log in every time I open the app.

#### Acceptance Criteria

1. THE useAuth_Hook SHALL subscribe to `supabase.auth.onAuthStateChange` on mount and unsubscribe on unmount.
2. WHEN the app loads, THE useAuth_Hook SHALL call `supabase.auth.getSession` to restore any existing session.
3. WHEN a session is present, THE useAuth_Hook SHALL expose a non-null `user` object to consumers.
4. WHEN no session is present, THE useAuth_Hook SHALL expose a null `user` and render the Auth_Page.
5. WHEN `signOut` is called, THE useAuth_Hook SHALL clear the `user` and `teacher` state and call `supabase.auth.signOut`.
