import React, { useState } from 'react';

/**
 * CustomerAvatar — shows the customer's ImageKit profile photo in the admin panel.
 * Falls back to the name initial when there is no photo or the image fails to load.
 */
export function CustomerAvatar({
  name = '',
  avatarUrl = '',
  size = 'md',
  className = '',
}) {
  const [broken, setBroken] = useState(false);
  const initial = String(name || '?').trim().charAt(0).toUpperCase() || '?';
  const photo = !broken && avatarUrl && avatarUrl !== '-' ? avatarUrl : '';

  const sizes = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-14 h-14 text-base',
  };

  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-full bg-sand-100 ring-1 ring-gold-400 flex items-center justify-center font-bold text-charcoal-500 flex-shrink-0 overflow-hidden ${className}`}
      title={name || 'Customer'}
    >
      {photo ? (
        <img
          src={photo}
          alt={name || 'Customer'}
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

export default CustomerAvatar;
