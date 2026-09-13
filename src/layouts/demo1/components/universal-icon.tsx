import React from 'react';
import * as RemixIcons from '@remixicon/react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { KeenIcon } from '@/components/keenicons';

interface UniversalIconProps {
  icon?: string | React.ComponentType<any> | React.ReactNode;
  className?: string;
}

export function UniversalIcon({
  icon,
  className = 'size-4.5',
}: UniversalIconProps) {
  if (!icon) return null;

  // 1. If passed directly as a React component or element
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && React.isValidElement(icon))
  ) {
    const IconComp = icon as React.ComponentType<any>;
    return <IconComp className={className} />;
  }

  if (typeof icon === 'string') {
    // 2. Parse prefix: "provider:param1:param2"
    if (icon.includes(':')) {
      const parts = icon.split(':');
      const provider = parts[0].toLowerCase();

      // A. Metronic KeenIcon -> "keen:duotone:profile-user" or "keen:user"
      if (provider === 'keen') {
        const style = parts.length === 3 ? (parts[1] as any) : 'outline';
        const name = parts.length === 3 ? parts[2] : parts[1];
        return <KeenIcon icon={name} style={style} className={className} />;
      }

      // B. Remix Icon -> "remix:RiMoneyDollarCircleLine"
      if (provider === 'remix' || provider === 'ri') {
        const name = parts[1];
        const RemixComp = (RemixIcons as Record<string, any>)[name];
        if (RemixComp) return <RemixComp className={className} />;
      }

      // C. SVG image file -> "svg:/media/icons/logo.svg"
      if (provider === 'svg' || icon.endsWith('.svg')) {
        const url = parts.slice(1).join(':');
        return (
          <img src={url} alt="" className={cn(className, 'object-contain')} />
        );
      }

      // D. FontAwesome -> "fa:fa-solid fa-user"
      if (provider === 'fa' || provider === 'fontawesome') {
        const iconClasses = parts.slice(1).join(':');
        return <i className={cn(iconClasses, className)} />;
      }

      // E. Lucide Icon -> "lucide:LayoutGrid"
      if (provider === 'lucide') {
        const name = parts[1];
        const LucideComp = (LucideIcons as Record<string, any>)[name];
        if (LucideComp) return <LucideComp className={className} />;
      }
    }

    // 3. Fallback direct match in Lucide
    const DefaultLucide = (LucideIcons as Record<string, any>)[icon];
    if (DefaultLucide) {
      return <DefaultLucide className={className} />;
    }
  }

  return <LucideIcons.Circle className={className} />;
}
