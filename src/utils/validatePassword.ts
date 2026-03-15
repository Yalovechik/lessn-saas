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
