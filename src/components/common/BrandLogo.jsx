import panelLogo from '../../assets/panel-logo.png';

export function BrandLogo({ className = 'h-16 w-16' }) {
  return (
    <img
      src={panelLogo}
      alt="Tripuraa Sangrahah"
      className={`rounded-2xl object-cover shadow-[0_8px_24px_rgba(191,91,33,0.28)] ${className}`}
    />
  );
}
