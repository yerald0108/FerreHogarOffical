import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Check, X, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { TermsModal } from './TermsModal';
import { cn } from '@/lib/utils';

interface StepPasswordProps {
  formData: {
    password: string;
    confirmPassword: string;
  };
  acceptedTerms: boolean;
  onAcceptedTermsChange: (checked: boolean) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StepPassword = ({
  formData,
  acceptedTerms,
  onAcceptedTermsChange,
  onChange,
}: StepPasswordProps) => {
  const [termsOpen, setTermsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordsMatch =
    formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const passwordsMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={onChange}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrengthMeter password={formData.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={onChange}
            className={cn(
              'pl-10 pr-16 transition-all duration-300',
              passwordsMatch && 'border-emerald-500 ring-1 ring-emerald-500/30',
              passwordsMismatch && 'border-destructive ring-1 ring-destructive/30'
            )}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {formData.confirmPassword.length > 0 && (
              <span className="animate-scale-in">
                {passwordsMatch ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {passwordsMismatch && (
          <p className="text-xs text-destructive animate-fade-in">Las contraseñas no coinciden</p>
        )}
        {passwordsMatch && (
          <p className="text-xs text-emerald-500 animate-fade-in">¡Las contraseñas coinciden!</p>
        )}
      </div>

      <div className="flex items-start space-x-2 pt-2">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => onAcceptedTermsChange(checked === true)}
        />
        <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
          He leído y acepto los{' '}
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-primary font-medium hover:underline"
          >
            Términos de Uso
          </button>
        </label>
      </div>

      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
};
