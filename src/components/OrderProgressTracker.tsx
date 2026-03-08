import { useEffect, useState, useMemo } from 'react';
import { Check, Clock, Package, Truck, Home, X, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { key: 'pending', label: 'Pendiente', description: 'Tu pedido fue recibido', icon: Clock, color: 'text-amber-500' },
  { key: 'confirmed', label: 'Confirmado', description: 'El pedido ha sido verificado', icon: Check, color: 'text-blue-500' },
  { key: 'preparing', label: 'Preparando', description: 'Estamos preparando tu pedido', icon: Package, color: 'text-violet-500' },
  { key: 'shipped', label: 'Enviado', description: '¡Tu pedido está en camino!', icon: Truck, color: 'text-orange-500' },
  { key: 'delivered', label: 'Entregado', description: '¡Pedido entregado con éxito!', icon: PartyPopper, color: 'text-green-500' },
];

interface StatusHistoryEntry {
  new_status: string;
  created_at: string;
}

interface OrderProgressTrackerProps {
  status: string;
  statusHistory?: StatusHistoryEntry[];
}

export function OrderProgressTracker({ status, statusHistory = [] }: OrderProgressTrackerProps) {
  const [animatedIndex, setAnimatedIndex] = useState(-1);
  const currentIndex = steps.findIndex((s) => s.key === status);
  const historyMap = useMemo(() => new Map(statusHistory.map(h => [h.new_status, h.created_at])), [statusHistory]);

  // Animate progress incrementally
  useEffect(() => {
    if (currentIndex < 0) return;
    const timer = setTimeout(() => setAnimatedIndex(currentIndex), 300);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const progressPercent = animatedIndex >= 0 ? (animatedIndex / (steps.length - 1)) * 100 : 0;

  if (status === 'cancelled') {
    const cancelledAt = statusHistory.find(h => h.new_status === 'cancelled');
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 py-4 px-5 rounded-xl bg-destructive/10 border border-destructive/20"
      >
        <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
          <X className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <span className="text-sm font-semibold text-destructive">Pedido Cancelado</span>
          {cancelledAt && (
            <p className="text-xs text-destructive/70">
              {format(new Date(cancelledAt.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="py-2">
      {/* ─── Desktop: Horizontal ─── */}
      <div className="hidden sm:block">
        {/* Progress bar background */}
        <div className="relative mx-6 mb-2">
          <div className="absolute top-[18px] left-0 right-0 h-1 bg-muted rounded-full" />
          <motion.div
            className="absolute top-[18px] left-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </div>

        {/* Steps */}
        <div className="flex items-start justify-between relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= animatedIndex;
            const isCurrent = index === currentIndex;
            const timestamp = historyMap.get(step.key);

            return (
              <motion.div
                key={step.key}
                className="flex flex-col items-center flex-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                {/* Circle */}
                <motion.div
                  className={cn(
                    'relative w-9 h-9 rounded-full flex items-center justify-center z-10 border-2 transition-colors',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-card border-muted text-muted-foreground'
                  )}
                  animate={isCurrent ? {
                    boxShadow: [
                      '0 0 0 0px hsl(var(--primary) / 0.3)',
                      '0 0 0 8px hsl(var(--primary) / 0)',
                    ],
                  } : {}}
                  transition={isCurrent ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  } : {}}
                >
                  <Icon className="h-4 w-4" />
                  {isCompleted && index < currentIndex && (
                    <motion.div
                      className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 bg-green-500 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.15, type: 'spring' }}
                    >
                      <Check className="h-2.5 w-2.5 text-white" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Label */}
                <span className={cn(
                  'text-xs font-medium mt-2 text-center',
                  isCurrent ? 'text-primary font-semibold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>

                {/* Timestamp */}
                {timestamp && (
                  <motion.span
                    className="text-[10px] text-muted-foreground mt-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {format(new Date(timestamp), "d MMM, HH:mm", { locale: es })}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Mobile: Vertical ─── */}
      <div className="sm:hidden">
        <div className="relative pl-5">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-muted rounded-full" />
          <motion.div
            className="absolute left-[15px] top-0 w-0.5 bg-primary rounded-full origin-top"
            initial={{ height: '0%' }}
            animate={{ height: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />

          {/* Steps */}
          <div className="space-y-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= animatedIndex;
              const isCurrent = index === currentIndex;
              const timestamp = historyMap.get(step.key);

              return (
                <motion.div
                  key={step.key}
                  className="relative flex items-start gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  {/* Circle */}
                  <motion.div
                    className={cn(
                      'relative w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 shrink-0 -ml-[15px]',
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-card border-muted text-muted-foreground'
                    )}
                    animate={isCurrent ? {
                      boxShadow: [
                        '0 0 0 0px hsl(var(--primary) / 0.3)',
                        '0 0 0 6px hsl(var(--primary) / 0)',
                      ],
                    } : {}}
                    transition={isCurrent ? {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeOut',
                    } : {}}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 -mt-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-medium',
                        isCurrent ? 'text-primary font-semibold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <motion.span
                          className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.5 }}
                        >
                          Actual
                        </motion.span>
                      )}
                    </div>
                    <p className={cn(
                      'text-xs mt-0.5',
                      isCurrent ? 'text-muted-foreground' : isCompleted ? 'text-muted-foreground/80' : 'text-muted-foreground/50'
                    )}>
                      {step.description}
                    </p>
                    {timestamp && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {format(new Date(timestamp), "d 'de' MMMM, HH:mm", { locale: es })}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current status description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 text-center hidden sm:block"
        >
          <p className="text-sm font-medium text-primary">
            {steps[currentIndex]?.description || 'Estado desconocido'}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
