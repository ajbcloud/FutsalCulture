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
      container: 'min-h-8',
      text: 'text-lg',
      logo: 'max-h-8'
    },
    default: {
      container: 'min-h-10',
      text: 'text-xl',
      logo: 'max-h-10'
    },
    large: {
      container: 'min-h-16',
      text: 'text-3xl',
      logo: 'max-h-16'
    }
  };

  const sizes = sizeClasses[variant];

  // Calculate responsive font size based on business name length
  const getResponsiveFontSize = (name: string, baseSize: string) => {
    const length = name.length;
    
    if (length <= 8) {
      return baseSize; // Use base size for short names
    } else if (length <= 15) {
      return baseSize === 'text-3xl' ? 'text-2xl' : 
             baseSize === 'text-xl' ? 'text-lg' : 'text-base';
    } else if (length <= 25) {
      return baseSize === 'text-3xl' ? 'text-xl' : 
             baseSize === 'text-xl' ? 'text-base' : 'text-sm';
    } else {
      return baseSize === 'text-3xl' ? 'text-lg' : 
             baseSize === 'text-xl' ? 'text-sm' : 'text-xs';
    }
  };

  const responsiveFontSize = getResponsiveFontSize(businessName, sizes.text);

  return (
    <div className={`flex items-center justify-center ${sizes.container} ${className} w-full max-w-full`}>
      {businessLogo ? (
        <img 
          src={businessLogo} 
          alt={businessName}
          className={`${sizes.logo} w-auto object-contain ${logoClassName}`}
        />
      ) : (
        <span className={`${responsiveFontSize} font-bold ${textClassName} break-words text-center leading-tight max-w-full px-2 hyphens-auto`}
              style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
          {businessName}
        </span>
      )}
    </div>
  );
}