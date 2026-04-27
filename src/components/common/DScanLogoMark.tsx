export interface IDScanLogoMarkProps {
  className?: string;
}

export const DScanLogoMark = ({ className }: IDScanLogoMarkProps) => (
  <svg className={className} viewBox="0 0 96 96" role="img" aria-label="DScan">
    <g className="dscan-logo-orbits">
      <ellipse cx="48" cy="48" rx="36" ry="13" />
      <ellipse cx="48" cy="48" rx="36" ry="13" transform="rotate(60 48 48)" />
      <ellipse cx="48" cy="48" rx="36" ry="13" transform="rotate(-60 48 48)" />
    </g>
    <circle className="dscan-logo-core" cx="48" cy="48" r="2.1" />
  </svg>
);
