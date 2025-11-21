"use client";

import { useEffect, useState } from "react";

export interface LocalizedTimeProps {
  isoString?: string | null;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

const DEFAULT_LOCALE = "id-ID";
const DEFAULT_FALLBACK = "-";

function formatTime(
  isoString: string | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  fallback: string
) {
  if (!isoString) return fallback;
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return fallback;
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error("Failed to format time", error);
    return fallback;
  }
}

export function LocalizedTime({
  isoString,
  locale = DEFAULT_LOCALE,
  options = DEFAULT_OPTIONS,
  fallback = DEFAULT_FALLBACK,
}: LocalizedTimeProps) {
  const [formatted, setFormatted] = useState(() =>
    formatTime(isoString, locale, options, fallback)
  );

  useEffect(() => {
    setFormatted(formatTime(isoString, locale, options, fallback));
  }, [isoString, locale, options, fallback]);

  return <span>{formatted}</span>;
}
