import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CouponResult {
  valid: boolean;
  discount: number;
  message: string;
}

export function useCoupon() {
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateCoupon = async (orderAmount: number) => {
    if (!couponCode.trim()) return;
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .rpc('validate_coupon', { 
          p_code: couponCode.toUpperCase(), 
          p_order_amount: orderAmount 
        });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCouponResult(data[0] as CouponResult);
      } else {
        setCouponResult({ valid: false, discount: 0, message: 'Cupón no encontrado' });
      }
    } catch (err) {
      setCouponResult({ valid: false, discount: 0, message: 'Error al validar cupón' });
    } finally {
      setIsValidating(false);
    }
  };

  const clearCoupon = () => {
    setCouponCode('');
    setCouponResult(null);
  };

  return {
    couponCode,
    setCouponCode,
    couponResult,
    isValidating,
    validateCoupon,
    clearCoupon,
    discountAmount: couponResult?.valid ? couponResult.discount : 0,
  };
}
