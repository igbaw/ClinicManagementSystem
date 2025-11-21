"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  slots: string[];
  disabledSlots?: Set<string>;
  placeholder?: string;
  className?: string;
}

export function TimeSelect({
  value,
  onChange,
  slots,
  disabledSlots,
  placeholder = "Pilih waktu",
  className,
}: TimeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full pl-10", className)}>
        <span className="absolute left-3 top-2.5 inline-flex items-center justify-center text-muted-foreground">
          <Clock className="h-4 w-4" />
        </span>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {slots.map((slot) => (
          <SelectItem
            key={slot}
            value={slot}
            disabled={disabledSlots?.has(slot)}
          >
            {slot} {disabledSlots?.has(slot) ? "(Terisi)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
