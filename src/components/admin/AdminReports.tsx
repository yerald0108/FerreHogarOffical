import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Calendar, DollarSign, Package, ShoppingBag } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAdminOrders } from '@/hooks/useOrders';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo } from 'react';

export function AdminReports() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: orders, isLoading: ordersLoading } = useAdminOrders();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate period comparisons
  const periodStats = useMemo(() => {
    if (!orders) return null;

    const today = new Date();
    const last7Days = { start: subDays(today, 7), end: today };
    const previous7Days = { start: subDays(today, 14), end: subDays(today, 7) };

    const last7DaysOrders = orders.filter(o => 
      isWithinInterval(new Date(o.created_at), { start: startOfDay(last7Days.start), end: endOfDay(last7Days.end) })
    );
    const previous7DaysOrders = orders.filter(o => 
      isWithinInterval(new Date(o.created_at), { start: startOfDay(previous7Days.start), end: endOfDay(previous7Days.end) })
    );

    const last7DaysSales = last7DaysOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const previous7DaysSales = previous7DaysOrders.reduce((sum, o) => sum + o.total_amount, 0);

    const salesChange = previous7DaysSales > 0 
      ? ((last7DaysSales - previous7DaysSales) / previous7DaysSales) * 100 
      : last7DaysSales > 0 ? 100 : 0;

    const ordersChange = previous7DaysOrders.length > 0
      ? ((last7DaysOrders.length - previous7DaysOrders.length) / previous7DaysOrders.length) * 100
      : last7DaysOrders.length > 0 ? 100 : 0;

    const avgOrderValue = last7DaysOrders.length > 0 
      ? last7DaysSales / last7DaysOrders.length 
      : 0;
    const prevAvgOrderValue = previous7DaysOrders.length > 0
      ? previous7DaysSales / previous7DaysOrders.length
      : 0;
    const avgOrderChange = prevAvgOrderValue > 0
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100
      : avgOrderValue > 0 ? 100 : 0;

    return {
      last7DaysSales,
      last7DaysOrders: last7DaysOrders.length,
      salesChange,
      ordersChange,
      avgOrderValue,
      avgOrderChange,
    };
  }, [orders]);

  // Calculate daily revenue for chart
  const revenueData = useMemo(() => {
    if (!orders) return [];

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, 'yyyy-MM-dd');
    });

    return last30Days.map(date => {
      const dayOrders = orders.filter(o => o.created_at.split('T')[0] === date);
      return {
        date: format(new Date(date), 'd MMM', { locale: es }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0),
        orders: dayOrders.length,
      };
    });
  }, [orders]);

  const isLoading = statsLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || !periodStats) return null;

  return (
    <div className="space-y-6">
      {/* Period Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas (7 días)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(periodStats.last7DaysSales)}</div>
            <div className={`flex items-center gap-1 text-xs ${periodStats.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {periodStats.salesChange >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(periodStats.salesChange).toFixed(1)}% vs semana anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos (7 días)</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periodStats.last7DaysOrders}</div>
            <div className={`flex items-center gap-1 text-xs ${periodStats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {periodStats.ordersChange >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(periodStats.ordersChange).toFixed(1)}% vs semana anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(periodStats.avgOrderValue)}</div>
            <div className={`flex items-center gap-1 text-xs ${periodStats.avgOrderChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {periodStats.avgOrderChange >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(periodStats.avgOrderChange).toFixed(1)}% vs semana anterior
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ingresos (últimos 30 días)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [formatPrice(value), 'Ingresos']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Pedidos por Día (últimos 30 días)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Pedidos']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total de Ventas</span>
              <span className="font-bold text-primary">{formatPrice(stats.totalSales)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total de Pedidos</span>
              <span className="font-bold">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Ticket Promedio General</span>
              <span className="font-bold">
                {formatPrice(stats.totalOrders > 0 ? stats.totalSales / stats.totalOrders : 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Productos en Catálogo</span>
              <span className="font-bold">{stats.totalProducts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado de Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.ordersByStatus.map(({ status, count }) => {
              const labels: Record<string, string> = {
                pending: 'Pendientes',
                confirmed: 'Confirmados',
                preparing: 'En Preparación',
                shipped: 'Enviados',
                delivered: 'Entregados',
                cancelled: 'Cancelados',
              };
              const colors: Record<string, string> = {
                pending: 'bg-yellow-500',
                confirmed: 'bg-blue-500',
                preparing: 'bg-purple-500',
                shipped: 'bg-cyan-500',
                delivered: 'bg-green-500',
                cancelled: 'bg-red-500',
              };
              const percentage = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
              
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{labels[status] || status}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[status] || 'bg-primary'} rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {stats.ordersByStatus.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">No hay datos de pedidos</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
