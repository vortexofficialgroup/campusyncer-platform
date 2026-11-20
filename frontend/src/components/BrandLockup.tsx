import type { MouseEventHandler } from "react";

interface BrandWordmarkProps {
  className?: string;
}

interface BrandLockupProps {
  href: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function BrandWordmark({ className = "" }: BrandWordmarkProps) {
  return (
    <span className={`campusyncer-wordmark ${className}`} role="img" aria-label="CampuSyncer">
      <img className="campusyncer-logo-on-dark" src="/assets/campusyncer-wordmark-dark.png" alt="" />
      <img className="campusyncer-logo-on-light" src="/assets/campusyncer-wordmark.png" alt="" />
    </span>
  );
}

export default function BrandLockup({ href, className = "", onClick }: BrandLockupProps) {
  return (
    <a className={`brand ${className}`} href={href} aria-label="CampuSyncer home" onClick={onClick}>
      <BrandWordmark />
      <span className="brand-copy">
        <small>
          by Vortex Group
        </small>
      </span>
    </a>
  );
}
