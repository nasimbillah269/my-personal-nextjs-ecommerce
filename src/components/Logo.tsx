import Image from "next/image";

type Props = { className?: string };

export function LogoMark({ className }: Props) {
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
      <circle cx="32" cy="9" r="3.2" fill="#f5a623" />
      <g fill="#2e9b3e">
        <ellipse cx="32" cy="24" rx="4.2" ry="11" />
        <ellipse cx="32" cy="27" rx="3.6" ry="10" transform="rotate(-32 32 36)" />
        <ellipse cx="32" cy="27" rx="3.6" ry="10" transform="rotate(32 32 36)" />
      </g>
      <g fill="#6cc04a">
        <ellipse cx="32" cy="30" rx="3" ry="9" transform="rotate(-62 32 38)" />
        <ellipse cx="32" cy="30" rx="3" ry="9" transform="rotate(62 32 38)" />
      </g>
      <path d="M6 40c8-6 18-8 26-8s18 2 26 8c-8-3-17-4-26-4S14 37 6 40Z" fill="#13a2a8" />
      <path d="M12 45c6-4 13-5 20-5s14 1 20 5c-6-2-13-3-20-3s-14 1-20 3Z" fill="#0d838a" />
    </svg>
  );
}

/**
 * Store logo. Pass `src` (Admin → Settings → Branding) to show the uploaded logo;
 * otherwise the built-in mark + name is drawn.
 */
export function Logo({
  className = "",
  src,
  alt = "Ultimate Organic Life",
  imgClassName = "h-10 sm:h-12 lg:h-14",
}: Props & { src?: string | null; alt?: string; imgClassName?: string }) {
  if (src) {
    return (
      <span className={`flex items-center ${className}`}>
        <Image src={src} alt={alt} width={240} height={80} className={`w-auto max-w-[180px] object-contain sm:max-w-[220px] ${imgClassName}`} priority />
      </span>
    );
  }
  return (
    <span className={`flex flex-col items-center leading-none ${className}`}>
      <LogoMark className="h-10 w-14 sm:h-12 sm:w-16 lg:h-14 lg:w-20" />
      <span className="mt-0.5 font-serif text-[10px] font-bold whitespace-nowrap text-leaf sm:text-xs">
        {alt}
      </span>
    </span>
  );
}
