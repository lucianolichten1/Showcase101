import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Opens a module's create UI when the URL contains `?create=<createKey>`.
 * Clears the param after triggering so refresh does not re-open the form.
 */
export function useOpenCreateFromQuery(createKey: string, open: () => void): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (searchParams.get("create") !== createKey) return;
    openRef.current();
    const next = new URLSearchParams(searchParams);
    next.delete("create");
    setSearchParams(next, { replace: true });
  }, [searchParams, createKey, setSearchParams]);
}
