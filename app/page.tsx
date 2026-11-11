'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  format, startOfToday, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths,
  isSameMonth, isSameDay, isBefore
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle, Dog, Stethoscope, Scissors, ChevronLeft, ChevronRight, Syringe, Cat, Car } from 'lucide-react';

const SERVICES = [
  { id: 'consulta', name: 'Consulta General', duration: '30 min', icon: Stethoscope },
  { id: 'vacuna', name: 'Vacuna', duration: '30 min', icon: Syringe },
  { id: 'unas', name: 'Corte de Uñas', duration: '15 min', icon: Scissors },
  { id: 'domicilio', name: 'A Domicilio', duration: '30 min', icon: Car },
  { id: 'cirugia', name: 'Cirugía', duration: '2h', icon: Dog },
];

export default function Home() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [vaccineType, setVaccineType] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfToday());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    ownerName: '',
    petName: '',
    mobile: '',
    reason: '',
    address: ''
  });

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });

  const resetToServices = () => {
    setStep(1);
    setSelectedService(null);
    setVaccineType(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setAvailability({});
  };

  const confirmVaccine = (type: string) => {
    setVaccineType(type);
    setStep(2);
  };

  useEffect(() => {
    if (step === 2 && selectedService) {
      const start = daysInMonth[0];
      const end = daysInMonth[daysInMonth.length - 1];
      const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const startStr = format(start, 'yyyy-MM-dd');

      fetch(`/api/availability?startDate=${startStr}&days=${numberOfDays}&service=${selectedService}`)
        .then(res => res.json())
        .then(data => {
          if (data.availability) setAvailability(prev => ({ ...prev, ...data.availability }));
        })
        .catch(() => {});
    }
  }, [step, selectedService, currentMonth.toISOString()]);

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
          vaccineType: vaccineType
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        alert('Error al reservar. Por favor, inténtalo de nuevo o contáctanos por WhatsApp.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setBooking(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-[#1B88C1] text-center max-w-md w-full">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B88C1] mb-2">¡Cita Confirmada!</h1>
          <p className="text-gray-600 mb-6">
            Hemos agendado tu cita para el{' '}
            <strong>{selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })}</strong> a las{' '}
            <strong>{selectedSlot}</strong>.
          </p>
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setFormData({ ownerName: '', petName: '', mobile: '', reason: '', address: '' });
              resetToServices();
            }}
            className="w-full bg-[#1B88C1] hover:bg-[#F8C345] hover:text-gray-900 text-white py-3 px-6 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Reservar otra cita
          </button>
        </div>
      </div>
    );
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header with Bastet Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#F8C345] shadow-md bg-white">
              <Image
                src="/logo.jpg"
                alt="Bastet Centro Veterinario"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B88C1] mb-2 tracking-tight">
            Bastet Centro Veterinario
          </h1>
          <div className="inline-flex items-center gap-2 bg-[#fef7e0] border border-[#F8C345]/60 text-gray-800 text-sm font-medium px-4 py-1.5 rounded-full">
            {step === 1 && 'Paso 1 de 3 · Selecciona un servicio'}
            {step === 2 && 'Paso 2 de 3 · Selecciona fecha y hora'}
            {step === 3 && 'Paso 3 de 3 · Completa tus datos'}
          </div>
        </div>

        {/* STEP 1: SERVICE SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            {!selectedService ? (
              <div className="flex flex-wrap justify-center gap-4">
                {SERVICES.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      if (service.id === 'vacuna') {
                        setSelectedService('vacuna');
                      } else {
                        setSelectedService(service.id);
                        setStep(2);
                      }
                    }}
                    className="w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.7rem)] bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-[#1B88C1] transition-all text-center group flex flex-col items-center cursor-pointer"
                  >
                    <div className="bg-[#e8f4fa] w-14 h-14 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#F8C345] transition-colors">
                      <service.icon className="w-7 h-7 text-[#1B88C1] group-hover:text-gray-900 transition-colors" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{service.name}</h3>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#1B88C1]" /> {service.duration}
                    </p>
                  </button>
                ))}
              </div>
            ) : selectedService === 'vacuna' ? (
              <div className="max-w-md mx-auto bg-white p-7 rounded-2xl shadow-sm border border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedService(null);
                    setVaccineType(null);
                  }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#1B88C1] hover:underline mb-4 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Volver a servicios
                </button>

                <h2 className="text-xl font-bold text-[#1B88C1] mb-5 text-center">¿Qué mascota es?</h2>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <button
                    type="button"
                    className={`p-4 border rounded-xl transition group cursor-pointer ${
                      vaccineType === 'pending-dog'
                        ? 'bg-[#e8f4fa] border-[#1B88C1] ring-2 ring-[#1B88C1]/30'
                        : 'border-gray-200 hover:bg-[#e8f4fa]/60 hover:border-[#1B88C1]'
                    }`}
                    onClick={() => setVaccineType('pending-dog')}
                  >
                    <Dog className="w-8 h-8 mx-auto mb-2 text-[#1B88C1]" />
                    <div className="font-bold text-gray-900">Perro</div>
                  </button>
                  <button
                    type="button"
                    className="p-4 border border-gray-200 rounded-xl hover:bg-[#e8f4fa]/60 hover:border-[#1B88C1] transition group cursor-pointer"
                    onClick={() => confirmVaccine('Gato')}
                  >
                    <Cat className="w-8 h-8 mx-auto mb-2 text-[#1B88C1]" />
                    <div className="font-bold text-gray-900">Gato</div>
                  </button>
                </div>

                {vaccineType === 'pending-dog' && (
                  <div className="pt-2 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 text-center">¿Qué vacuna necesita?</h3>
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => confirmVaccine('Perro - Anual')}
                        className="w-full p-3 bg-gray-50 hover:bg-[#1B88C1] hover:text-white rounded-xl font-medium transition text-left px-5 cursor-pointer"
                      >
                        • Vacuna Anual
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmVaccine('Perro - Leishmania')}
                        className="w-full p-3 bg-gray-50 hover:bg-[#1B88C1] hover:text-white rounded-xl font-medium transition text-left px-5 cursor-pointer"
                      >
                        • Vacuna Leishmania
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* STEP 2: CALENDAR */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetToServices}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B88C1] bg-[#e8f4fa] hover:bg-[#1B88C1] hover:text-white px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Cambiar servicio
                </button>
                <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-lg border border-gray-200">
                  {SERVICES.find(s => s.id === selectedService)?.name}
                  {vaccineType && !vaccineType.includes('pending') ? ` (${vaccineType})` : ''}
                </span>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg sm:text-xl font-bold capitalize text-[#1B88C1]">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                  </h2>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={prevMonth}
                      disabled={isSameMonth(currentMonth, startOfToday())}
                      className="p-2 hover:bg-[#e8f4fa] text-[#1B88C1] rounded-full disabled:opacity-30 cursor-pointer"
                      aria-label="Mes anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="p-2 hover:bg-[#e8f4fa] text-[#1B88C1] rounded-full cursor-pointer"
                      aria-label="Mes siguiente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-400 py-1.5">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
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
                        type="button"
                        onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                        disabled={isPast || isUnavailable}
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all cursor-pointer
                          ${!isCurrentMonth ? 'text-gray-300 bg-gray-50/50' : 'text-gray-700 bg-white hover:bg-[#e8f4fa]'}
                          ${isSelected ? '!bg-[#1B88C1] !text-white font-bold shadow-md z-10 scale-105' : ''}
                          ${isToday && !isSelected ? 'ring-2 ring-[#F8C345] font-bold' : ''}
                          ${isUnavailable && isCurrentMonth ? 'bg-red-50 text-red-300 cursor-not-allowed hover:bg-red-50' : ''}
                          ${isPast ? 'opacity-30 cursor-not-allowed' : ''}
                        `}
                      >
                        <span>{format(day, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 h-full">
                <h3 className="font-bold text-[#1B88C1] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#F8C345]" />
                  {selectedDate
                    ? `Horarios para el ${format(selectedDate, 'd/MM', { locale: es })}`
                    : 'Selecciona un día'
                  }
                </h3>

                {!selectedDate ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Elige una fecha disponible en el calendario para ver las horas libres.
                  </div>
                ) : loadingSlots ? (
                  <div className="text-center py-10 text-[#1B88C1] font-medium animate-pulse">Buscando horarios...</div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => { setSelectedSlot(slot); setStep(3); }}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                          selectedSlot === slot
                            ? 'bg-[#1B88C1] text-white border-[#1B88C1] shadow-sm'
                            : 'border-gray-200 text-gray-700 hover:border-[#1B88C1] hover:bg-[#e8f4fa] hover:text-[#1B88C1]'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    {availability[format(selectedDate, 'yyyy-MM-dd')] === false
                      ? <span className="text-red-500 font-medium">Completo / No disponible</span>
                      : 'No hay citas libres este día.'
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: FORM */}
        {step === 3 && (
          <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#1B88C1] hover:underline mb-5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Volver a horarios
            </button>

            <h2 className="text-xl font-bold text-[#1B88C1] mb-5">Completa tus datos</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-[#f0f8fc] p-4 rounded-xl mb-5 border border-[#1B88C1]/25">
                <div className="text-xs uppercase tracking-wide text-[#1B88C1] font-semibold mb-1">Resumen de tu cita</div>
                <div className="font-bold text-gray-900">
                  {SERVICES.find(s => s.id === selectedService)?.name}
                  {vaccineType && !vaccineType.includes('pending') && (
                    <span className="font-normal text-gray-700"> ({vaccineType})</span>
                  )}
                </div>
                <div className="text-[#1B88C1] font-medium text-sm capitalize mt-0.5">
                  {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} · {selectedSlot}
                </div>
              </div>

              {selectedService === 'domicilio' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección (Calle, Número, Piso) y Municipio <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1B88C1] focus:border-[#1B88C1] outline-none transition"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Av. Lluís Companys 27, Parets"
                  />
                </div>
              )}

              {(selectedService === 'consulta' || selectedService === 'domicilio') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo de la visita <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1B88C1] focus:border-[#1B88C1] outline-none transition"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Describe brevemente qué le pasa a tu mascota..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellidos (Propietario)</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1B88C1] focus:border-[#1B88C1] outline-none transition"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="Ej: María García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Mascota</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1B88C1] focus:border-[#1B88C1] outline-none transition"
                  value={formData.petName}
                  onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                  placeholder="Ej: Luna"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Móvil</label>
                <input
                  required
                  type="tel"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1B88C1] focus:border-[#1B88C1] outline-none transition"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Ej: 600123456"
                />
              </div>

              <button
                type="submit"
                disabled={booking}
                className="w-full bg-[#1B88C1] hover:bg-[#F8C345] hover:text-gray-900 text-white py-3.5 rounded-xl font-bold text-base uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md cursor-pointer"
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
