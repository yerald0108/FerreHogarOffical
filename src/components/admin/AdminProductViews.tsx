import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye } from 'lucide-react';

export function AdminProductViews() {
  const { data: viewStats = [] } = useQuery({
    queryKey: ['admin-product-views'],
    queryFn: async () => {
      // Get view counts per product (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('product_views')
        .select('product_id')
        .gte('viewed_at', thirtyDaysAgo.toISOString());
      if (error) throw error;

      // Count per product
      const countMap = new Map<string, number>();
      data.forEach(v => {
        countMap.set(v.product_id, (countMap.get(v.product_id) || 0) + 1);
      });

      // Get product names for top 10
      const topIds = Array.from(countMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      if (topIds.length === 0) return [];

      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', topIds);

      const nameMap = new Map((products || []).map(p => [p.id, p.name]));

      return topIds.map(id => ({
        name: (nameMap.get(id) || 'Desconocido').slice(0, 20),
        visitas: countMap.get(id) || 0,
      }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Productos Más Visitados (30 días)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {viewStats.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={viewStats} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="visitas" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No hay datos de visitas aún
          </div>
        )}
      </CardContent>
    </Card>
  );
}
