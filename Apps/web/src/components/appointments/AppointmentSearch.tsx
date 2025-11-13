"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import DatePicker from "@/components/calendar/DatePicker";
import { Search, X, Calendar, Filter } from "lucide-react";

export interface AppointmentSearchFilters {
  searchQuery: string;
  status: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  doctorId: string;
}

interface AppointmentSearchProps {
  onSearch: (filters: AppointmentSearchFilters) => void;
  doctors: Array<{ id: string; full_name: string }>;
}

export default function AppointmentSearch({ onSearch, doctors }: AppointmentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch({
      searchQuery,
      status,
      dateFrom,
      dateTo,
      doctorId,
    });
  };

  const handleClear = () => {
    setSearchQuery("");
    setStatus("");
    setDateFrom(null);
    setDateTo(null);
    setDoctorId("");
    onSearch({
      searchQuery: "",
      status: "",
      dateFrom: null,
      dateTo: null,
      doctorId: "",
    });
  };

  const handleQuickFilter = (filter: "today" | "tomorrow" | "week") => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case "today":
        setDateFrom(today);
        setDateTo(today);
        break;
      case "tomorrow":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDateFrom(tomorrow);
        setDateTo(tomorrow);
        break;
      case "week":
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        setDateFrom(today);
        setDateTo(weekEnd);
        break;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama pasien, No. RM, atau booking code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button variant="primary" onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Cari
          </Button>
          <Button variant="secondary" onClick={() => setShowAdvanced(!showAdvanced)}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          {(searchQuery || status || dateFrom || dateTo || doctorId) && (
            <Button variant="ghost" onClick={handleClear}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2">
          <span className="text-sm text-muted-foreground mr-2">Quick Filter:</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickFilter("today")}
          >
            <Calendar className="h-3 w-3 mr-1" />
            Hari Ini
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickFilter("tomorrow")}
          >
            <Calendar className="h-3 w-3 mr-1" />
            Besok
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickFilter("week")}
          >
            <Calendar className="h-3 w-3 mr-1" />
            7 Hari Kedepan
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="scheduled">Terjadwal</option>
                <option value="checked_in">Check-in</option>
                <option value="in_progress">Berlangsung</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor-filter">Dokter</Label>
              <select
                id="doctor-filter"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Semua Dokter</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">Dari Tanggal</Label>
              <DatePicker
                value={dateFrom || new Date()}
                onChange={(date) => setDateFrom(date)}
                placeholder="Pilih tanggal awal"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">Sampai Tanggal</Label>
              <DatePicker
                value={dateTo || new Date()}
                onChange={(date) => setDateTo(date)}
                placeholder="Pilih tanggal akhir"
                className="w-full"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
