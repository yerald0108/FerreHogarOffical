import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
}

const getStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Muy débil', color: 'bg-destructive' },
    { label: 'Débil', color: 'bg-orange-500' },
    { label: 'Regular', color: 'bg-accent' },
    { label: 'Fuerte', color: 'bg-emerald-500' },
    { label: 'Excelente', color: 'bg-emerald-600' },
  ];

  const index = Math.min(score, 5) - 1;
  if (index < 0) return { score: 0, label: 'Muy débil', color: 'bg-destructive' };
  return { score, ...levels[index] };
};

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const strength = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-full transition-all duration-500 ease-out',
              i <= strength.score ? strength.color : 'bg-muted'
            )}
            style={{
              transform: i <= strength.score ? 'scaleY(1)' : 'scaleY(0.6)',
              transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.05}s`,
            }}
          />
        ))}
      </div>
      <p
        className={cn(
          'text-xs font-medium transition-all duration-300',
          strength.score <= 1 && 'text-destructive',
          strength.score === 2 && 'text-orange-500',
          strength.score === 3 && 'text-accent-foreground',
          strength.score >= 4 && 'text-emerald-500'
        )}
      >
        {strength.label}
      </p>
    </div>
  );
};
