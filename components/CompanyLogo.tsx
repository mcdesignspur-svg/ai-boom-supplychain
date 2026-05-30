"use client";
import { useState } from "react";
import { COMPANY_DOMAINS } from "@/lib/supply-chain-data";

interface CompanyLogoProps {
  companyId: string;
  name: string;
  /** Pixel size of the square. */
  size?: number;
}

/**
 * Company logo via DuckDuckGo's free icon endpoint (no auth, reliable, good
 * international coverage). Falls back to a monogram (first letter) when there's
 * no domain or the icon fails to load, so anything uncovered degrades cleanly.
 * (Clearbit's logo endpoint was retired, hence DuckDuckGo.)
 */
export default function CompanyLogo({ companyId, name, size = 40 }: CompanyLogoProps) {
  const domain = COMPANY_DOMAINS[companyId];
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size } as const;

  if (!domain || failed) {
    return (
      <div className="company-logo fallback" style={style} aria-hidden>
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="company-logo" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
        alt={`Logo de ${name}`}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
