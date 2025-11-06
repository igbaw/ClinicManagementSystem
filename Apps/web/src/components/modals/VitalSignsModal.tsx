"use client";

import { useState } from "react";

interface VitalSignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vitalSigns: VitalSigns) => void;
  patientName: string;
}

export interface VitalSigns {
  bloodPressure: string;
  pulse: string;
  temperature: string;
  weight: string;
  height: string;
}

export default function VitalSignsModal({
  isOpen,
  onClose,
  onSubmit,
  patientName,
}: VitalSignsModalProps) {
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({
      bloodPressure,
      pulse,
      temperature,
      weight,
      height,
    });
    // Reset form
    setBloodPressure("");
    setPulse("");
    setTemperature("");
    setWeight("");
    setHeight("");
  };

  const handleSkip = () => {
    onSubmit({
      bloodPressure: "",
      pulse: "",
      temperature: "",
      weight: "",
      height: "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Tanda Vital - {patientName}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Masukkan tanda vital pasien (opsional). Anda dapat melewati langkah ini jika tanda vital belum diukur.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tekanan Darah
                      </label>
                      <input
                        type="text"
                        value={bloodPressure}
                        onChange={(e) => setBloodPressure(e.target.value)}
                        placeholder="120/80"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nadi (x/mnt)
                      </label>
                      <input
                        type="number"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                        placeholder="80"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suhu (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="36.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        BB (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="70"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TB (cm)
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="170"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Check-in
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Lewati & Check-in
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
