import React from "react";

type Props = {
  name: string;              // e.g., "Sugar Sand Park – Field 2"
  address?: string;          // optional full address string
  lat?: number | string | null;
  lng?: number | string | null;
  className?: string;
  ariaLabel?: string;
};

function buildMapsUrl({ name, address, lat, lng }: { name: string; address?: string; lat?: number | string | null; lng?: number | string | null; }) {
  // Priority: lat/lng → address → name
  if (lat != null && lng != null && lat !== '' && lng !== '') {
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latNum},${lngNum}`)}`;
    }
  }
  const q = address && address.trim().length > 0 ? address : name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export default function LocationLink({ name, address, lat, lng, className = "", ariaLabel }: Props) {
  const href = buildMapsUrl({ name, address, lat, lng });
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline underline-offset-2 hover:opacity-90 ${className}`}
      aria-label={ariaLabel || `Open ${name} in Maps`}
      data-testid={`location-link-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {name}
    </a>
  );
}