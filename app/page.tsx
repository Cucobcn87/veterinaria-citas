'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  format, addDays, startOfToday, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths,
  isSameMonth, isSameDay, isBefore
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, CheckCircle, Dog, Stethoscope, Scissors, ChevronLeft, ChevronRight, Syringe, Cat } from 'lucide-react';

const SERVICES = [
  { id: 'consulta', name: 'Consulta General', duration: '30 min', icon: Stethoscope },
  { id: 'vacuna', name: 'Vacuna', duration: '30 min', icon: Syringe },
  { id: 'unas', name: 'Corte de Uñas', duration: '15 min', icon: Scissors },
  { id: 'cirugia', name: 'Cirugía', duration: '2h', icon: Dog },
];

export default function Home() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Sub-selection logic
  const [vaccineType, setVaccineType] = useState<string | null>(null); // "Perro Anual", "Gato", etc.

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfToday());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    ownerName: '',
    petName: '',
    mobile: '',
    reason: '' // New mandatory field for consulta
  });

  // Calculate days to display (grid)
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });

  // Handle Service Selection
  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setVaccineType(null); // Reset
    // If vaccine, stay on step 1 (conceptually) but show subtypes? Or move to "1.5"?
    // Let's us a "substep" or simple conditional rendering in step 1.
  };

  const confirmVaccine = (type: string) => {
    setVaccineType(type);
    setStep(2);
  };

  // Fetch Availability
  useEffect(() => {
    if (step === 2 && selectedService) {
      setLoadingAvailability(true);
      const start = daysInMonth[0];
      const end = daysInMonth[daysInMonth.length - 1];
      const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const startStr = format(start, 'yyyy-MM-dd');

      fetch(`/api/availability?startDate=${startStr}&days=${numberOfDays}&service=${selectedService}`)
        .then(res => res.json())
        .then(data => {
          if (data.availability) setAvailability(prev => ({ ...prev, ...data.availability }));
        })
        .finally(() => setLoadingAvailability(false));
    }
  }, [step, selectedService, currentMonth.toISOString()]);

  // Fetch Slots
  useEffect(() => {
    if (!selectedService || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlots([]);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await fetch(`/api/slots?date=${dateStr}&service=${selectedService}`);
        const data = await res.json();
        if (data.slots) setSlots(data.slots);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
          time: selectedSlot,
          service: selectedService,
          vaccineType: vaccineType // Pass this if exists
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        alert('Error al reservar.');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setBooking(false);
    }
  };

  if (success) {
    // (Keep existing success UI, just reset new fields)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Cita Confirmada!</h1>
          <p className="text-gray-600 mb-6">
            Hemos agendado tu cita para el <strong>{selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })}</strong> a las <strong>{selectedSlot}</strong>.
          </p>

        </div>
      </div>
    );
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image
                src="/logo.jpg"
                alt="Centro Veterinario Bastet"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Centro Veterinario Bastet</h1>
          <p className="text-gray-500">
            {step === 1 && 'Selecciona un servicio'}
            {step === 2 && 'Selecciona Fecha y Hora'}
            {step === 3 && 'Tus Datos'}
          </p>
        </div>

        {/* STEP 1: SERVICE SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            {!selectedService ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SERVICES.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      if (service.id === 'vacuna') {
                        setSelectedService('vacuna');
                        // Don't set step 2 yet, show options
                      } else {
                        setSelectedService(service.id);
                        setStep(2);
                      }
                    }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all text-center group flex flex-col items-center h-full"
                  >
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                      <service.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {service.duration}
                    </p>
                  </button>
                ))}
              </div>
            ) : selectedService === 'vacuna' ? (
              <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-sm text-gray-400 hover:text-gray-700 mb-4 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">¿Qué mascota es?</h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition group focus:ring-2 focus:ring-blue-500"
                    onClick={() => { /* Show dog options */ setVaccineType('pending-dog'); }}
                  >
                    <Dog className="w-8 h-8 mx-auto mb-2 text-gray-600 group-hover:text-blue-600" />
                    <div className="font-bold">Perro</div>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition group focus:ring-2 focus:ring-blue-500"
                    onClick={() => confirmVaccine('Gato')}
                  >
                    <Cat className="w-8 h-8 mx-auto mb-2 text-gray-600 group-hover:text-blue-600" />
                    <div className="font-bold">Gato</div>
                  </button>
                </div>

                {vaccineType === 'pending-dog' && (
                  <div className="animate-fade-in-up">
                    <h3 className="text-md font-bold text-gray-800 mb-3 text-center">¿Qué vacuna necesita?</h3>
                    <div className="space-y-3">
                      <button onClick={() => confirmVaccine('Perro - Anual')} className="w-full p-3 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-lg font-medium transition text-left px-5">
                        • Vacuna Anual
                      </button>
                      <button onClick={() => confirmVaccine('Perro - Leishmania')} className="w-full p-3 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-lg font-medium transition text-left px-5">
                        • Vacuna Leishmania
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* STEP 2: CALENDAR (Reuse mostly, just update back button logic) */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* ... Calendar column ... */}
            <div className="lg:col-span-3 space-y-4">
              <button onClick={() => { setStep(1); setSelectedDate(null); }} className="text-gray-500 hover:text-black text-sm mb-2 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Cambiar servicio
              </button>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                {/* Nav */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold capitalize text-gray-900">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={prevMonth} disabled={isSameMonth(currentMonth, startOfToday())} className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {/* Grid */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-400 py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {daysInMonth.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, startOfToday());
                    const isPast = isBefore(day, startOfToday());
                    const isUnavailable = !isPast && availability[dateStr] === false;
                    return (
                      <button
                        key={day.toString()}
                        onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                        disabled={isPast || isUnavailable}
                        className={`
                                            aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all
                                            ${!isCurrentMonth ? 'text-gray-300 bg-gray-50/50' : 'text-gray-700 bg-white hover:bg-gray-50'}
                                            ${isSelected ? '!bg-black !text-white shadow-lg z-10 scale-110' : ''}
                                            ${isToday && !isSelected ? 'ring-1 ring-blue-500 font-bold' : ''}
                                            ${isUnavailable && isCurrentMonth ? 'bg-red-50 text-red-300 cursor-not-allowed' : ''}
                                            ${isPast ? 'opacity-30 cursor-not-allowed' : ''}
                                        `}
                      >
                        <span>{format(day, 'd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            {/* ... Slots column (Reuse existing) ... */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {selectedDate
                    ? `Horarios para el ${format(selectedDate, 'd/MM', { locale: es })}`
                    : 'Selecciona un día'
                  }
                </h3>
                {/* ... slots logic ... */}
                {!selectedDate ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    👈 Elige una fecha disponible en el calendario
                  </div>
                ) : loadingSlots ? (
                  <div className="text-center py-12 text-blue-500 animate-pulse">Buscando...</div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => { setSelectedSlot(slot); setStep(3); }}
                        className={`py-3 rounded-lg text-sm font-medium border transition-all ${selectedSlot === slot
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    {availability[format(selectedDate, 'yyyy-MM-dd')] === false
                      ? <span className="text-red-500">Completo / No disponible</span>
                      : 'No hay citas libres.'
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: FORM */}
        {step === 3 && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <button onClick={() => setStep(2)} className="text-gray-500 hover:text-black mb-6 text-sm flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Volver a horarios
            </button>

            <h2 className="text-xl font-bold mb-6">Completa tus datos</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <div className="text-sm text-blue-800 font-medium">Resumen:</div>
                <div className="font-bold text-blue-900">
                  {SERVICES.find(s => s.id === selectedService)?.name}
                  {vaccineType && !vaccineType.includes('pending') && <span className="font-normal text-blue-700"> ({vaccineType})</span>}
                </div>
                <div className="text-blue-700 text-sm capitalize">
                  {selectedDate && format(selectedDate, "EOOOO d 'de' MMMM", { locale: es })} @ {selectedSlot}
                </div>
              </div>

              {/* Conditional Reason Field */}
              {selectedService === 'consulta' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo de la consulta <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Describa brevemente qué le pasa a su mascota..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellidos (Propietario)</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Mascota</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                  value={formData.petName}
                  onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                  placeholder="Ej: Firulais"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Móvil</label>
                <input
                  required
                  type="tel"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Ej: 600123456"
                />
              </div>

              <button
                type="submit"
                disabled={booking}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-xl"
              >
                {booking ? 'Confirmando...' : 'Confirmar Reserva'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
