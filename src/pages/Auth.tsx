import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Помилка авторизації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-background">
      <div className="w-full max-w-[480px] text-center">
        <div className="mb-10">
          <div className="flex items-center justify-center gap-0 mb-2">
            <span className="text-4xl font-bold text-foreground tracking-tight">less</span>
            <span className="text-4xl font-bold text-mint-dark tracking-tight">n</span>
          </div>
          <p className="text-sm text-muted-foreground">Ваш асистент з обліку уроків</p>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-8 text-left">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {isSignUp ? 'Створити акаунт' : 'Увійти'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isSignUp ? 'Створіть акаунт для початку роботи' : 'Увійдіть до свого акаунту'}
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 rounded-md bg-coral-light text-coral-dark text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {loading ? 'Завантаження...' : isSignUp ? 'Зареєструватися' : 'Увійти'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isSignUp ? 'Вже маєте акаунт?' : 'Немає акаунту?'}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-mint-dark font-semibold hover:underline bg-transparent border-none cursor-pointer"
              >
                {isSignUp ? 'Увійти' : 'Зареєструватися'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
