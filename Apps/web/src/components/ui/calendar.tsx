"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    props.defaultMonth instanceof Date ? props.defaultMonth : new Date()
  );

  const currentMonth = displayMonth.getMonth();
  const currentYear = displayMonth.getFullYear();

  const handlePreviousMonth = () => {
    setDisplayMonth(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleMonthChange = (month: number) => {
    setDisplayMonth(new Date(currentYear, month, 1));
  };

  const handleYearChange = (year: number) => {
    setDisplayMonth(new Date(year, currentMonth, 1));
  };

  const years = React.useMemo(() => {
    const start = (props as any).fromYear || 1960;
    const end = (props as any).toYear || new Date().getFullYear() + 10;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [(props as any).fromYear, (props as any).toYear]);

  return (
    <div className={cn("p-3 bg-white rounded-md border border-gray-200 shadow-md", className)}>
      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between gap-2 mb-4 px-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePreviousMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2 items-center flex-1 justify-center">
          {/* Month Selector */}
          <select
            value={currentMonth}
            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
            className={cn(
              "px-2 py-1 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded hover:bg-gray-50",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={currentYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className={cn(
              "px-2 py-1 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded hover:bg-gray-50",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleNextMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar */}
      <DayPicker
        month={displayMonth}
        onMonthChange={setDisplayMonth}
        showOutsideDays={showOutsideDays}
        className="p-0"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          month_caption: "hidden",
          caption_label: "hidden",
          nav: "hidden",
          button_previous: "hidden",
          button_next: "hidden",
          month_grid: "w-full border-collapse",
          weekdays: "flex w-full mb-2",
          weekday: "text-gray-700 text-[0.8rem] font-semibold w-9 h-9 flex items-center justify-center",
          weeks: "flex flex-col",
          week: "flex w-full gap-1 mb-1",
          day: "h-9 w-9 p-0 relative",
          day_button: cn(
            "h-9 w-9 p-0 font-normal",
            "hover:bg-blue-100 text-gray-900 rounded-md inline-flex items-center justify-center cursor-pointer",
            "aria-selected:bg-blue-600 aria-selected:text-white aria-selected:hover:bg-blue-700 aria-selected:opacity-100"
          ),
          today: "bg-blue-100 text-blue-900 font-semibold",
          outside: "text-gray-400 opacity-50",
          disabled: "text-gray-300 opacity-50 cursor-not-allowed",
          range_middle:
            "aria-selected:bg-blue-100 aria-selected:text-blue-900",
          hidden: "invisible",
          ...classNames,
        }}
        {...(props as any)}
        defaultMonth={undefined}
      />
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
