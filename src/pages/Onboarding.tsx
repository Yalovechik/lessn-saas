import { useState } from 'react';
import { SUBJECTS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const { createTeacher } = useAuth();

  const handleComplete = async () => {
    if (!name.trim() || !subject) return;
    setLoading(true);
    try {
      await createTeacher(name.trim(), subject);
    } catch (err) {
      console.error(err);
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

        <div className="bg-card rounded-lg border border-border shadow-sm text-left">
          <div className="p-8">
            {step === 0 && (
              <>
                <h2 className="text-xl font-bold text-foreground mb-1">Привіт!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Розкажіть трохи про себе, щоб Lessn працював для вас
                </p>

                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-muted-foreground mb-1.5">Ваше ім'я</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-border bg-card text-sm outline-none transition-all focus:border-foreground focus:shadow-[0_0_0_3px_rgba(26,35,68,0.08)]"
                    placeholder="Олена Іваненко"
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => name.trim() && setStep(1)}
                    disabled={!name.trim()}
                    className="px-7 py-3 rounded-md bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-mint-dark disabled:opacity-50"
                  >
                    Далі →
                  </button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-xl font-bold text-foreground mb-1">Що ви викладаєте?</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Оберіть ваш предмет — він автоматично буде у всіх учнів
                </p>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`py-3.5 px-2 rounded-[10px] text-[13px] font-medium transition-all cursor-pointer ${
                        subject === s
                          ? 'border-2 border-foreground bg-mint-50 text-foreground font-bold shadow-[0_0_0_3px_rgba(26,35,68,0.06)]'
                          : 'border-[1.5px] border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setStep(0)}
                    className="px-4 py-2.5 rounded-md bg-secondary text-secondary-foreground text-sm font-medium transition-all hover:bg-border"
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!subject || loading}
                    className="px-7 py-3 rounded-md bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-mint-dark disabled:opacity-50"
                  >
                    {loading ? 'Завантаження...' : 'Почати роботу'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
