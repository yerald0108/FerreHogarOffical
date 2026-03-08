import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, ArrowLeft, ArrowRight, Check, User, MapPin, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { StepPersonalData } from '@/components/register/StepPersonalData';
import { StepAddress } from '@/components/register/StepAddress';
import { StepPassword } from '@/components/register/StepPassword';
import { cn } from '@/lib/utils';
import { isValidCubanPhone } from '@/lib/validators';
import { SEOHead } from '@/components/SEOHead';

const steps = [
  { id: 1, title: 'Tus Datos', icon: User },
  { id: 2, title: 'Tu Dirección', icon: MapPin },
  { id: 3, title: 'Contraseña', icon: Lock },
];

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [animating, setAnimating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    province: '',
    municipality: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const goToStep = (step: number) => {
    if (animating) return;
    setDirection(step > currentStep ? 'forward' : 'backward');
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setAnimating(false);
    }, 250);
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        toast.error('Por favor completa todos los campos');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Correo electrónico inválido');
        return false;
      }
      if (!isValidCubanPhone(formData.phone)) {
        toast.error('Ingresa un teléfono cubano válido (ej: +53 5XXXXXXX o 5XXXXXXX)');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.province || !formData.municipality) {
        toast.error('Por favor selecciona tu provincia y municipio');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    goToStep(currentStep + 1);
  };

  const handleBack = () => {
    goToStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Debes aceptar los Términos de Uso');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
      phone: formData.phone,
      address: formData.address,
      province: formData.province,
      municipality: formData.municipality,
    });

    if (error) {
      toast.error(error.message || 'Error al crear la cuenta');
    } else {
      // Update profile with province and municipality
      toast.success('¡Cuenta creada! Revisa tu correo para confirmar.');
      navigate('/login');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Crear Cuenta" description="Regístrate en FerreHogar para comprar herramientas y materiales con entrega a domicilio en Cuba." />
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md p-8 overflow-hidden">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mx-auto mb-4">
              <Wrench className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Crear Cuenta</h1>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 px-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ease-out',
                        isCompleted && 'bg-emerald-500 text-white scale-100',
                        isCurrent && 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30',
                        !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 animate-scale-in" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] mt-1.5 font-medium transition-colors duration-300',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-2 mt-[-18px]">
                      <div className="h-0.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                          style={{ width: isCompleted ? '100%' : '0%' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <form onSubmit={handleSubmit}>
            <div
              className={cn(
                'transition-all duration-300 ease-out',
                animating && direction === 'forward' && 'opacity-0 translate-x-8',
                animating && direction === 'backward' && 'opacity-0 -translate-x-8',
                !animating && 'opacity-100 translate-x-0'
              )}
            >
              {currentStep === 1 && (
                <StepPersonalData formData={formData} onChange={handleInputChange} />
              )}
              {currentStep === 2 && (
                <StepAddress
                  formData={formData}
                  onChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                />
              )}
              {currentStep === 3 && (
                <StepPassword
                  formData={formData}
                  acceptedTerms={acceptedTerms}
                  onAcceptedTermsChange={setAcceptedTerms}
                  onChange={handleInputChange}
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
              )}
              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext} className="flex-1">
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !acceptedTerms}
                >
                  {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
