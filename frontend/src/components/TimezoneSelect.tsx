import { useMemo } from "react";
import { getGroupedTimezones } from "../utils/timezone";

interface TimezoneSelectProps {
  id: string;
  value: string;
  onChange: (tz: string) => void;
  className?: string;
  "aria-describedby"?: string;
}

export function TimezoneSelect({
  id,
  value,
  onChange,
  className,
  "aria-describedby": ariaDescribedBy,
}: TimezoneSelectProps) {
  const groups = useMemo(() => getGroupedTimezones(), []);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      aria-describedby={ariaDescribedBy}
    >
      {[...groups.entries()].map(([region, entries]) => (
        <optgroup key={region} label={region}>
          {entries.map(({ iana, label }) => (
            <option key={iana} value={iana}>
              {label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
