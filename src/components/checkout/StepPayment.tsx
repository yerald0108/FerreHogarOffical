import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Banknote, Smartphone, ShieldCheck, Loader2, Wallet, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/lib/store';
import { formatCurrencyPrice } from '@/hooks/useProductPrices';

interface StepPaymentProps {
  paymentMethod: string;
  onPaymentChange: (value: string) => void;
}

const ALL_PAYMENT_OPTIONS: Record<string, { label: string; description: string; icon: any; iconColor: string; bgColor: string }> = {
  efectivo: { label: 'Efectivo (CUP)', description: 'Paga al recibir tu pedido', icon: Banknote, iconColor: 'text-green-600', bgColor: 'bg-green-50' },
  transfermovil: { label: 'Transfermóvil', description: 'Transferencia antes de la entrega', icon: Smartphone, iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  enzona: { label: 'EnZona', description: 'Pago por plataforma EnZona', icon: Smartphone, iconColor: 'text-teal-600', bgColor: 'bg-teal-50' },
  zelle: { label: 'Zelle', description: 'Pago por Zelle en USD', icon: Wallet, iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  usd: { label: 'USD efectivo', description: 'Pago en dólares al recibir', icon: Banknote, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  eur: { label: 'EUR efectivo', description: 'Pago en euros al recibir', icon: Banknote, iconColor: 'text-amber-600', bgColor: 'bg-amber-50' },
  tarjeta_clasica: { label: 'Tarjeta Clásica', description: 'Pago con tarjeta bancaria', icon: CreditCard, iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  mlc: { label: 'Tarjeta MLC', description: 'Pago con tarjeta en MLC', icon: CreditCard, iconColor: 'text-rose-600', bgColor: 'bg-rose-50' },
};

const DEFAULT_METHODS = ['efectivo', 'transfermovil', 'tarjeta_clasica'];

interface ProductPaymentInfo {
  productId: string;
  productName: string;
  productImage: string;
  methods: string[];
  prices: { currency: string; price: number }[];
}

export const StepPayment = ({ paymentMethod, onPaymentChange }: StepPaymentProps) => {
  const { items } = useCartStore();
  const [productPaymentInfo, setProductPaymentInfo] = useState<ProductPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const productIds = items.map(i => i.product.id);
      if (productIds.length === 0) {
        setProductPaymentInfo([]);
        setLoading(false);
        return;
      }

      const [methodsRes, pricesRes] = await Promise.all([
        supabase.from('product_payment_methods').select('product_id, method').in('product_id', productIds),
        supabase.from('product_prices').select('product_id, currency, price').in('product_id', productIds),
      ]);

      const methodsByProduct = new Map<string, string[]>();
      (methodsRes.data || []).forEach((row: any) => {
        if (!methodsByProduct.has(row.product_id)) methodsByProduct.set(row.product_id, []);
        methodsByProduct.get(row.product_id)!.push(row.method);
      });

      const pricesByProduct = new Map<string, { currency: string; price: number }[]>();
      (pricesRes.data || []).forEach((row: any) => {
        if (!pricesByProduct.has(row.product_id)) pricesByProduct.set(row.product_id, []);
        pricesByProduct.get(row.product_id)!.push({ currency: row.currency, price: row.price });
      });

      const info: ProductPaymentInfo[] = items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.image,
        methods: methodsByProduct.get(item.product.id) || DEFAULT_METHODS,
        prices: pricesByProduct.get(item.product.id) || [],
      }));

      setProductPaymentInfo(info);
      setLoading(false);
    };

    fetchData();
  }, [items]);

  // Collect all unique methods across all products
  const allMethods = Array.from(new Set(productPaymentInfo.flatMap(p => p.methods)));

  useEffect(() => {
    if (!loading && allMethods.length > 0 && !allMethods.includes(paymentMethod)) {
      onPaymentChange(allMethods[0]);
    }
  }, [allMethods.join(','), loading]);

  const paymentOptions = allMethods
    .map(m => ALL_PAYMENT_OPTIONS[m] ? { value: m, ...ALL_PAYMENT_OPTIONS[m] } : null)
    .filter(Boolean) as Array<{ value: string; label: string; description: string; icon: any; iconColor: string; bgColor: string }>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Per-product payment info */}
      {!loading && productPaymentInfo.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Información de pago por producto</h3>
          <div className="space-y-4">
            {productPaymentInfo.map((info) => (
              <div key={info.productId} className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img src={info.productImage} alt={info.productName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{info.productName}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {info.methods.map(m => {
                      const opt = ALL_PAYMENT_OPTIONS[m];
                      return (
                        <Badge key={m} variant="outline" className="text-[10px] px-1.5 py-0">
                          {opt?.label || m}
                        </Badge>
                      );
                    })}
                  </div>
                  {info.prices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {info.prices.map((p, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {formatCurrencyPrice(p.price, p.currency)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment method selection */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Método de Pago</h2>
            <p className="text-sm text-muted-foreground">Elige cómo quieres pagar tu pedido</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <RadioGroup
            value={paymentMethod}
            onValueChange={onPaymentChange}
            className="grid gap-4"
          >
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              // Show which products accept this method
              const acceptingProducts = productPaymentInfo.filter(p => p.methods.includes(option.value));
              const allAccept = acceptingProducts.length === productPaymentInfo.length;
              return (
                <div
                  key={option.value}
                  className={`relative flex items-center space-x-4 border-2 rounded-xl p-5 cursor-pointer transition-all ${
                    paymentMethod === option.value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  onClick={() => onPaymentChange(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className={`p-3 rounded-lg ${option.bgColor}`}>
                    <Icon className={`h-6 w-6 ${option.iconColor}`} />
                  </div>
                  <Label htmlFor={option.value} className="cursor-pointer flex-1">
                    <span className="font-semibold text-foreground text-lg">{option.label}</span>
                    <span className="block text-sm text-muted-foreground mt-0.5">{option.description}</span>
                    {!allAccept && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        Disponible en: {acceptingProducts.map(p => p.productName).join(', ')}
                      </span>
                    )}
                  </Label>
                  <div
                    className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                      paymentMethod === option.value
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    }`}
                  >
                    {paymentMethod === option.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        )}
      </Card>

      <Card className="p-5 bg-muted/30 border-dashed">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-100">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Compra Segura</p>
            <p className="text-xs text-muted-foreground">
              Tus datos están protegidos. Te contactaremos para confirmar antes del cobro.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
