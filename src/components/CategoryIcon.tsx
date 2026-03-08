import { icons, LucideProps } from 'lucide-react';
import { Package } from 'lucide-react';

/**
 * Resolves a Lucide icon by name (supports kebab-case e.g. "shopping-cart" and PascalCase e.g. "ShoppingCart").
 * Returns a Lucide icon component or the fallback (Package).
 */
export function resolveIcon(iconName: string | null | undefined) {
  if (!iconName) return null;

  // Convert kebab-case to PascalCase: "shopping-cart" -> "ShoppingCart"
  const pascalCase = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

  return (icons as Record<string, any>)[pascalCase] || (icons as Record<string, any>)[iconName] || null;
}

interface CategoryIconProps extends LucideProps {
  iconName: string | null | undefined;
}

export function CategoryIcon({ iconName, ...props }: CategoryIconProps) {
  const Icon = resolveIcon(iconName);
  if (Icon) return <Icon {...props} />;
  return <Package {...props} />;
}
