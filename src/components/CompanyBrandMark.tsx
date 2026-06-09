import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { useCompanyBranding } from "@/domains/company/CompanyBrandingContext";
import { cn } from "@/lib/utils";

interface CompanyBrandMarkProps {
  /** Max-height constraint for the logo image. */
  className?: string;
  /** Size of the fallback icon container when no logo is set. */
  fallbackClassName?: string;
  iconClassName?: string;
}

export function CompanyBrandMark({
  className,
  fallbackClassName = "h-8 w-8",
  iconClassName,
}: CompanyBrandMarkProps) {
  const { branding } = useCompanyBranding();
  const [logoBroken, setLogoBroken] = useState(false);
  const showLogo = branding.logoUrl && !logoBroken;

  if (showLogo) {
    return (
      <img
        src={branding.logoUrl!}
        alt=""
        className={cn("h-auto w-auto max-w-[9rem] object-contain", className)}
        onError={() => setLogoBroken(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg text-white bg-company-primary",
        fallbackClassName
      )}
    >
      <BarChart3 className={cn("h-4 w-4", iconClassName)} />
    </div>
  );
}
