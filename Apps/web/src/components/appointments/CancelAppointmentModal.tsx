"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  appointmentDetails?: {
    patientName: string;
    date: string;
    time: string;
  };
}

const CANCEL_REASONS = [
  "Pasien berhalangan hadir",
  "Pasien sudah sembuh",
  "Jadwal berubah",
  "Permintaan pasien",
  "Kesalahan input data",
  "Lainnya",
];

export default function CancelAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  appointmentDetails,
}: CancelAppointmentModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    const reason =
      selectedReason === "Lainnya" && customReason.trim()
        ? customReason.trim()
        : selectedReason || "No reason provided";

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      // Reset form
      setSelectedReason("");
      setCustomReason("");
      onClose();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Batalkan Janji Temu</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {appointmentDetails && (
            <div className="bg-muted p-3 rounded-md text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Pasien: </span>
                <span className="font-medium">{appointmentDetails.patientName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tanggal: </span>
                <span className="font-medium">{appointmentDetails.date}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Waktu: </span>
                <span className="font-medium">{appointmentDetails.time}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Pembatalan *</Label>
            <div className="space-y-2">
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === "Lainnya" && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Alasan Lainnya</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Masukkan alasan pembatalan..."
                rows={3}
              />
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            <p className="font-medium">⚠️ Perhatian</p>
            <p className="text-xs mt-1">
              Janji temu yang dibatalkan tidak dapat dikembalikan. Pastikan informasi sudah benar.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!selectedReason || isSubmitting}
            isLoading={isSubmitting}
          >
            Batalkan Janji Temu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
