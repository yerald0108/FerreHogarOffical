import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageTransition } from '@/components/PageTransition';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOrder } from '@/hooks/useOrders';
import { useUserProfile, useUpdateProfile } from '@/hooks/useProfile';
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import { StepContactInfo } from '@/components/checkout/StepContactInfo';
import { StepDelivery } from '@/components/checkout/StepDelivery';
import { StepPayment } from '@/components/checkout/StepPayment';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { checkStockAvailability, getUnavailableItems, StockCheckResult } from '@/hooks/useStockValidation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { isValidCubanPhone } from '@/lib/validators';
import { useCoupon } from '@/hooks/useCoupon';
import { SEOHead } from '@/components/SEOHead';

const STEPS = [
  { number: 1, title: 'Contacto', description: 'Tus datos' },
  { number: 2, title: 'Entrega', description: 'Dirección y horario' },
  { number: 3, title: 'Pago', description: 'Método de pago' },
];

const CHECKOUT_STORAGE_KEY = 'ferrehogar-checkout';

const Checkout = () => {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  const { couponCode, setCouponCode, couponResult, isValidating, validateCoupon, clearCoupon, discountAmount } = useCoupon();
  
  // Restore step from sessionStorage
  const savedData = typeof window !== 'undefined' ? sessionStorage.getItem(CHECKOUT_STORAGE_KEY) : null;
  const parsed = savedData ? JSON.parse(savedData) : null;
  
  const [currentStep, setCurrentStep] = useState(parsed?.step || 1);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [stockCheckPending, setStockCheckPending] = useState(false);
  const [stockIssues, setStockIssues] = useState<StockCheckResult[]>([]);
  const [formData, setFormData] = useState(parsed?.formData || {
    fullName: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    municipality: '',
    deliveryTime: '',
    paymentMethod: 'efectivo',
    notes: '',
  });

  // Persist to sessionStorage on changes
  useEffect(() => {
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({ step: currentStep, formData }));
  }, [currentStep, formData]);

  // Auto-fill form with profile data when loaded (only if not restored from session)
  useEffect(() => {
    if (profile && !parsed) {
      setFormData((prev: typeof formData) => ({
        ...prev,
        fullName: profile.full_name || prev.fullName,
        phone: profile.phone || prev.phone,
        email: profile.email || user?.email || prev.email,
        address: profile.address || prev.address,
        province: (profile as any).province || prev.province,
        municipality: profile.municipality || prev.municipality,
      }));
    } else if (user?.email && !parsed) {
      setFormData((prev: typeof formData) => ({
        ...prev,
        email: user.email || prev.email,
      }));
    }
  }, [profile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.fullName.trim()) {
          toast.error('Por favor ingresa tu nombre completo');
          return false;
        }
        if (!formData.phone.trim() || !isValidCubanPhone(formData.phone)) {
          toast.error('Ingresa un teléfono cubano válido (ej: +53 5XXXXXXX)');
          return false;
        }
        return true;
      case 2:
        if (!formData.province) {
          toast.error('Por favor selecciona tu provincia');
          return false;
        }
        if (!formData.municipality) {
          toast.error('Por favor selecciona tu municipio');
          return false;
        }
        if (!formData.address.trim()) {
          toast.error('Por favor ingresa tu dirección completa');
          return false;
        }
        if (!formData.deliveryTime) {
          toast.error('Por favor selecciona un horario de entrega');
          return false;
        }
        return true;
      case 3:
        if (!formData.paymentMethod) {
          toast.error('Por favor selecciona un método de pago');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.fullName.trim().length > 0 && isValidCubanPhone(formData.phone);
      case 2:
        return formData.province.length > 0 && formData.municipality.length > 0 && formData.address.trim().length > 0 && formData.deliveryTime.length > 0;
      case 3:
        return formData.paymentMethod.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev: number) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev: number) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para realizar un pedido');
      navigate('/login');
      return;
    }

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setStockCheckPending(true);
    setStockIssues([]);
    
    try {
      const { allAvailable, results } = await checkStockAvailability(items);
      
      if (!allAvailable) {
        const unavailable = getUnavailableItems(results);
        setStockIssues(unavailable);
        toast.error('Algunos productos no tienen suficiente stock');
        setStockCheckPending(false);
        return;
      }

      const finalTotal = getTotalPrice() - discountAmount;

      const order = {
        user_id: user.id,
        total_amount: finalTotal,
        delivery_address: formData.address,
        province: formData.province,
        municipality: formData.municipality,
        phone: formData.phone,
        delivery_time: formData.deliveryTime,
        payment_method: formData.paymentMethod,
        notes: formData.notes || null,
        coupon_code: couponResult?.valid ? couponCode.toUpperCase() : null,
        discount_amount: discountAmount,
      };

      const orderItems = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price_at_purchase: item.product.price,
      }));

      const orderData = await createOrder.mutateAsync({ order, items: orderItems });

      // Send order confirmation email (fire and forget)
      try {
        await supabase.functions.invoke('send-order-confirmation', {
          body: {
            customerEmail: formData.email || user.email,
            customerName: formData.fullName,
            orderId: orderData.id,
            orderItems: orderItems,
            totalAmount: getTotalPrice(),
            deliveryAddress: formData.address,
            province: formData.province,
            municipality: formData.municipality,
            deliveryTime: formData.deliveryTime,
            paymentMethod: formData.paymentMethod,
          },
        });
        console.log('Order confirmation email sent');
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      // Save profile data if checkbox is checked
      if (saveToProfile) {
        try {
          await updateProfile.mutateAsync({
            full_name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            province: formData.province,
            municipality: formData.municipality,
          } as any);
        } catch (profileError) {
          console.error('Error saving profile:', profileError);
        }
      }

      // Clear checkout session
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);

      // Notify admin (fire and forget)
      supabase.functions.invoke('send-new-order-admin-notification', {
        body: {
          orderId: orderData.id,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          totalAmount: finalTotal,
          itemCount: items.length,
          deliveryAddress: formData.address,
          municipality: formData.municipality,
          paymentMethod: formData.paymentMethod,
        },
      }).catch(err => console.error('Admin notification error:', err));
      
      toast.success('¡Pedido realizado con éxito!');
      clearCart();
      navigate(`/pedido/${orderData.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pedido');
    } finally {
      setStockCheckPending(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">No hay productos en tu carrito</h1>
            <p className="text-muted-foreground mb-6">
              Añade algunos productos antes de proceder al pago
            </p>
            <Link to="/productos">
              <Button size="lg">Ver Productos</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Inicia sesión para continuar</h1>
            <p className="text-muted-foreground mb-6">
              Necesitas una cuenta para realizar pedidos
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/login">
                <Button size="lg">Iniciar Sesión</Button>
              </Link>
              <Link to="/registro">
                <Button size="lg" variant="outline">Crear Cuenta</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepContactInfo
            formData={{ fullName: formData.fullName, phone: formData.phone, email: formData.email }}
            onInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <StepDelivery
            formData={{
              address: formData.address,
              province: formData.province,
              municipality: formData.municipality,
              deliveryTime: formData.deliveryTime,
              notes: formData.notes,
            }}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
          />
        );
      case 3:
        return (
          <div className="space-y-6">
            <StepPayment
              paymentMethod={formData.paymentMethod}
              onPaymentChange={(value) => handleSelectChange('paymentMethod', value)}
            />
            
            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg border">
              <Checkbox
                id="saveProfile"
                checked={saveToProfile}
                onCheckedChange={(checked) => setSaveToProfile(checked === true)}
              />
              <Label htmlFor="saveProfile" className="text-sm cursor-pointer flex items-center gap-2">
                <Save className="h-4 w-4 text-muted-foreground" />
                Guardar mis datos para futuros pedidos
              </Label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Checkout" description="Completa tu pedido en FerreHogar. Entrega a domicilio en toda Cuba." />
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[
            { label: 'Carrito', href: '/carrito' },
            { label: 'Checkout' },
          ]} />
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Finalizar Compra</h1>
          <p className="text-muted-foreground mb-8">Completa los pasos para confirmar tu pedido</p>
          
          <CheckoutProgress currentStep={currentStep} steps={STEPS} />
          
          {stockIssues.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Problemas de stock</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {stockIssues.map((issue) => (
                    <li key={issue.product_id}>
                      <strong>{issue.product_name}</strong>: Solicitaste {issue.requested}, solo hay {issue.available} disponibles
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">Por favor ajusta las cantidades en tu carrito.</p>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {renderStep()}
            </div>
            
            <div>
              <OrderSummary
                items={items}
                totalPrice={getTotalPrice()}
                currentStep={currentStep}
                totalSteps={STEPS.length}
                onNext={handleNext}
                onBack={handleBack}
                onSubmit={handleSubmit}
                isSubmitting={createOrder.isPending || stockCheckPending}
                canProceed={canProceedToNext()}
                couponCode={couponCode}
                onCouponCodeChange={setCouponCode}
                onApplyCoupon={() => validateCoupon(getTotalPrice())}
                onClearCoupon={clearCoupon}
                couponResult={couponResult}
                isValidatingCoupon={isValidating}
                discountAmount={discountAmount}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Checkout;
