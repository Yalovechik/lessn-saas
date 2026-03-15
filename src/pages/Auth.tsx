import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { validatePassword } from "@/utils/validatePassword";

type AuthView = "login" | "register" | "reset-password" | "new-password";

export default function Auth() {
    const [view, setView] = useState<AuthView>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeat, setRepeat] = useState("");
    const [error, setError] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [repeatError, setRepeatError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const completedRef = useRef(false);

    const {
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        authEvent,
    } = useAuth();
    const navigate = useNavigate();

    // Switch to new-password view on PASSWORD_RECOVERY event
    useEffect(() => {
        if (authEvent === "PASSWORD_RECOVERY") {
            setView("new-password");
        }
    }, [authEvent]);

    // Cleanup: sign out if user leaves new-password view without completing
    useEffect(() => {
        if (view !== "new-password") return;
        completedRef.current = false;
        return () => {
            if (!completedRef.current) {
                signOut();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]); // signOut is stable, intentionally omitted

    const resetFormState = () => {
        setEmail("");
        setPassword("");
        setRepeat("");
        setError("");
        setPasswordError(null);
        setRepeatError(null);
        setSuccessMessage("");
        setLoading(false);
    };

    const switchView = (next: AuthView) => {
        resetFormState();
        setView(next);
    };

    // --- Login ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signIn(email, password);
            navigate("/");
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Помилка авторизації",
            );
        } finally {
            setLoading(false);
        }
    };

    // --- Register ---
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const { passwordError: pwErr, repeatError: rpErr } = validatePassword(
            password,
            repeat,
        );
        setPasswordError(pwErr);
        setRepeatError(rpErr);
        if (pwErr || rpErr) return;

        setError("");
        setLoading(true);
        try {
            await signUp(email, password);
            setSuccessMessage("Перевірте вашу пошту для підтвердження акаунту");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Помилка реєстрації");
        } finally {
            setLoading(false);
        }
    };

    // --- Reset password ---
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await resetPassword(email);
            setSuccessMessage(
                "Посилання для скидання паролю надіслано на вашу пошту",
            );
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Помилка скидання паролю",
            );
        } finally {
            setLoading(false);
        }
    };

    // --- New password ---
    const handleNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const { passwordError: pwErr, repeatError: rpErr } = validatePassword(
            password,
            repeat,
        );
        setPasswordError(pwErr);
        setRepeatError(rpErr);
        if (pwErr || rpErr) return;

        setError("");
        setLoading(true);
        try {
            await updatePassword(password);
            completedRef.current = true;
            await signOut();
            switchView("login");
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Помилка оновлення паролю",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-5 bg-background">
            <div className="w-full max-w-[480px] text-center">
                <div className="mb-10">
                    <div className="flex items-center justify-center gap-0 mb-2">
                        <span className="text-4xl font-bold text-foreground tracking-tight">
                            less
                        </span>
                        <span className="text-4xl font-bold text-mint-dark tracking-tight">
                            n
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Ваш асистент з обліку уроків
                    </p>
                </div>

                <div className="bg-card rounded-lg border border-border shadow-sm">
                    <div className="p-8 text-left">
                        {/* ── LOGIN ── */}
                        {view === "login" && (
                            <>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    Увійти
                                </h2>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Увійдіть до свого акаунту
                                </p>

                                <form onSubmit={handleLogin}>
                                    {error && (
                                        <div className="mb-4 p-3 rounded-md bg-coral-light text-coral-dark text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                                            required
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                            Пароль
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-mint-dark disabled:opacity-50"
                                    >
                                        {loading ? "Вхід…" : "Увійти"}
                                    </button>
                                </form>

                                <button
                                    onClick={() => switchView("reset-password")}
                                    className="mt-3 text-sm text-muted-foreground hover:underline bg-transparent border-none cursor-pointer w-full text-center"
                                >
                                    Забули пароль?
                                </button>

                                <p className="text-center text-sm text-muted-foreground mt-4">
                                    Немає акаунту?{" "}
                                    <button
                                        onClick={() => switchView("register")}
                                        className="text-mint-dark font-semibold hover:underline bg-transparent border-none cursor-pointer"
                                    >
                                        Зареєструватися
                                    </button>
                                </p>
                            </>
                        )}

                        {/* ── REGISTER ── */}
                        {view === "register" && (
                            <>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    Створити акаунт
                                </h2>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Створіть акаунт для початку роботи
                                </p>

                                {successMessage ? (
                                    <div className="p-3 rounded-md bg-coral-light text-coral-dark text-sm mb-4">
                                        {successMessage}
                                    </div>
                                ) : (
                                    <form onSubmit={handleRegister}>
                                        {error && (
                                            <div className="mb-4 p-3 rounded-md bg-coral-light text-coral-dark text-sm">
                                                {error}
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                                Пароль
                                            </label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                                                required
                                                minLength={6}
                                            />
                                            {passwordError && (
                                                <p className="text-xs text-coral-dark mt-1">
                                                    {passwordError}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                                Повторіть пароль
                                            </label>
                                            <input
                                                type="password"
                                                value={repeat}
                                                onChange={(e) =>
                                                    setRepeat(e.target.value)
                                                }
                                                className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                                                required
                                            />
                                            {repeatError && (
                                                <p className="text-xs text-coral-dark mt-1">
                                                    {repeatError}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-mint-dark disabled:opacity-50"
                                        >
                                            {loading
                                                ? "Реєстрація…"
                                                : "Зареєструватися"}
                                        </button>
                                    </form>
                                )}

                                <p className="text-center text-sm text-muted-foreground mt-6">
                                    Вже маєте акаунт?{" "}
                                    <button
                                        onClick={() => switchView("login")}
                                        className="text-mint-dark font-semibold hover:underline bg-transparent border-none cursor-pointer"
                                    >
                                        Увійти
                                    </button>
                                </p>
                            </>
                        )}

                        {/* ── RESET PASSWORD ── */}
                        {view === "reset-password" && (
                            <>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    Відновлення паролю
                                </h2>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Введіть email для отримання посилання
                                </p>

                                {successMessage ? (
                                    <div className="p-3 rounded-md bg-coral-light text-coral-dark text-sm mb-4">
                                        {successMessage}
                                    </div>
                                ) : (
                                    <form onSubmit={handleResetPassword}>
                                        {error && (
                                            <div className="mb-4 p-3 rounded-md bg-coral-light text-coral-dark text-sm">
                                                {error}
                                            </div>
                                        )}

                                        <div className="mb-6">
                                            <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-mint-dark disabled:opacity-50"
                                        >
                                            {loading
                                                ? "Надсилання…"
                                                : "Надіслати посилання"}
                                        </button>
                                    </form>
                                )}

                                <p className="text-center text-sm text-muted-foreground mt-6">
                                    <button
                                        onClick={() => switchView("login")}
                                        className="text-mint-dark font-semibold hover:underline bg-transparent border-none cursor-pointer"
                                    >
                                        ← Назад до входу
                                    </button>
                                </p>
                            </>
                        )}

                        {/* ── NEW PASSWORD ── */}
                        {view === "new-password" && (
                            <>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    Новий пароль
                                </h2>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Введіть новий пароль для вашого акаунту
                                </p>

                                <form onSubmit={handleNewPassword}>
                                    {error && (
                                        <div className="mb-4 p-3 rounded-md bg-coral-light text-coral-dark text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                            Новий пароль
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                                            required
                                            minLength={6}
                                            autoComplete="new-password"
                                        />
                                        {passwordError && (
                                            <p className="text-xs text-coral-dark mt-1">
                                                {passwordError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">
                                            Повторіть пароль
                                        </label>
                                        <input
                                            type="password"
                                            value={repeat}
                                            onChange={(e) =>
                                                setRepeat(e.target.value)
                                            }
                                            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                                            required
                                            autoComplete="new-password"
                                        />
                                        {repeatError && (
                                            <p className="text-xs text-coral-dark mt-1">
                                                {repeatError}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-mint-dark disabled:opacity-50"
                                    >
                                        {loading
                                            ? "Збереження…"
                                            : "Зберегти пароль"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
