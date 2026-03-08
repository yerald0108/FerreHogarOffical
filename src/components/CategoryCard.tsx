import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryIcon } from '@/components/CategoryIcon';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  productCount: number;
}

export function CategoryCard({ id, name, icon, productCount }: CategoryCardProps) {
  return (
    <Link to={`/productos?categoria=${id}`}>
      <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary">
        <CardContent className="p-3 md:p-6 text-center">
          <div className="flex justify-center mb-2 md:mb-3 transition-transform duration-300 group-hover:scale-110">
            <CategoryIcon iconName={icon} className="h-7 w-7 md:h-10 md:w-10 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-xs md:text-base leading-tight">
            {name}
          </h3>
          <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1">
            {productCount} productos
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
