import React from 'react';
import { useBusiness } from '@/contexts/BusinessContext';

interface BusinessBrandingProps {
  className?: string;
  textClassName?: string;
  logoClassName?: string;
  variant?: 'default' | 'small' | 'large';
}

export function BusinessBranding({ 
  className = '', 
  textClassName = '',
  logoClassName = '',
  variant = 'default' 
}: BusinessBrandingProps) {
  const { businessName, businessLogo } = useBusiness();

  // Define size classes based on variant
  const sizeClasses = {
    small: {
      container: 'h-8',
      text: 'text-lg',
      logo: 'max-h-8'
    },
    default: {
      container: 'h-10',
      text: 'text-xl',
      logo: 'max-h-10'
    },
    large: {
      container: 'h-16',
      text: 'text-3xl',
      logo: 'max-h-16'
    }
  };

  const sizes = sizeClasses[variant];

  

  return (
    <span className={`${sizes.text} font-bold ${textClassName} ${className}`}>
      {businessName}
    </span>
  );
}