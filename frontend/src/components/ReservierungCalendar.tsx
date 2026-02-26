import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Reservierung, ReservierungMitName, Parkplatz } from '../backend';
import { ReservierungsStatus } from '../backend';
import { useIsCallerAdmin } from '../hooks/useQueries';

interface ReservierungCalendarProps {
  meineReservierungen: Reservierung[];
  hostReservierungen: ReservierungMitName[];
  parkplaetze: Parkplatz[];
  onReservationClick: (reservation: Reservierung | ReservierungMitName) => void;
  onDayClick?: (date: Date) => void;
}

export default function ReservierungCalendar({
  meineReservierungen,
  hostReservierungen,
  parkplaetze,
  onReservationClick,
  onDayClick,
}: ReservierungCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: isAdmin } = useIsCallerAdmin();

  const allReservations = useMemo(() => {
    return [...meineReservierungen, ...hostReservierungen];
  }, [meineReservierungen, hostReservierungen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const getReservationsForDay = (day: number) => {
    const dayStart = new Date(year, month, day, 0, 0, 0);
    const dayEnd = new Date(year, month, day, 23, 59, 59);
    const dayStartNano = BigInt(dayStart.getTime() * 1_000_000);
    const dayEndNano = BigInt(dayEnd.getTime() * 1_000_000);

    return allReservations.filter(r => {
      return r.startZeit <= dayEndNano && r.endZeit >= dayStartNano;
    });
  };

  const getParkplatzInfo = (id: bigint) => {
    return parkplaetze.find(p => p.id === id);
  };

  const getStatusColor = (status: ReservierungsStatus) => {
    switch (status) {
      case ReservierungsStatus.reserviert:
        return 'bg-green-500 hover:bg-green-600';
      case ReservierungsStatus.eingecheckt:
        return 'bg-blue-500 hover:bg-blue-600';
      case ReservierungsStatus.ausgecheckt:
        return 'bg-gray-400 hover:bg-gray-500';
      case ReservierungsStatus.storniert:
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusText = (status: ReservierungsStatus) => {
    switch (status) {
      case ReservierungsStatus.reserviert:
        return 'Reserviert';
      case ReservierungsStatus.eingecheckt:
        return 'Eingecheckt';
      case ReservierungsStatus.ausgecheckt:
        return 'Ausgecheckt';
      case ReservierungsStatus.storniert:
        return 'Storniert';
      default:
        return status;
    }
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    if (onDayClick) {
      const clickedDate = new Date(year, month, day);
      onDayClick(clickedDate);
    }
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  const days: React.ReactElement[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square min-h-[80px] sm:min-h-[100px] md:min-h-[120px]" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const reservations = getReservationsForDay(day);
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

    days.push(
      <div
        key={day}
        onClick={() => handleDayClick(day)}
        className={`aspect-square min-h-[80px] sm:min-h-[100px] md:min-h-[120px] border rounded-lg p-1 sm:p-2 hover:bg-accent/50 transition-colors cursor-pointer ${
          isToday ? 'border-primary border-2 bg-primary/5' : 'border-border'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-primary font-bold' : ''}`}>
            {day}
          </div>
          <div className="flex-1 space-y-0.5 sm:space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {reservations.slice(0, 4).map((reservation, idx) => {
              const parkplatz = getParkplatzInfo(reservation.parkplatzId);
              const isMine = meineReservierungen.some(r => r.id === reservation.id);
              
              const reserverName = 'name' in reservation ? reservation.name : 'Unbekannt';
              
              const tooltipParts = [
                `${formatTime(reservation.startZeit)} - ${formatTime(reservation.endZeit)}`,
                parkplatz?.adresse || `Parkplatz #${reservation.parkplatzId.toString()}`,
              ];

              if (isAdmin) {
                tooltipParts.push(`Reserviert von: ${reserverName}`);
              } else if (!isMine) {
                tooltipParts.push(`Gast: ${reserverName}`);
              }

              tooltipParts.push(getStatusText(reservation.status));

              const tooltipText = tooltipParts.join('\n');

              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReservationClick(reservation);
                  }}
                  className={`w-full text-left text-[10px] sm:text-xs px-1 py-0.5 rounded truncate ${getStatusColor(reservation.status)} text-white transition-colors shadow-sm`}
                  title={tooltipText}
                >
                  <span className="inline-block mr-0.5">{isMine ? '🚗' : '📍'}</span>
                  <span className="hidden sm:inline">{parkplatz?.adresse.split(',')[0] || `#${reservation.parkplatzId.toString()}`}</span>
                  <span className="sm:hidden">{formatTime(reservation.startZeit)}</span>
                </button>
              );
            })}
            {reservations.length > 4 && (
              <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                +{reservations.length - 4} mehr
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl sm:text-2xl">
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth} aria-label="Vorheriger Monat">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Nächster Monat">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Legende</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500 shrink-0"></div>
              <span className="text-xs sm:text-sm">Reserviert</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500 shrink-0"></div>
              <span className="text-xs sm:text-sm">Eingecheckt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400 shrink-0"></div>
              <span className="text-xs sm:text-sm">Ausgecheckt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500 shrink-0"></div>
              <span className="text-xs sm:text-sm">Storniert</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚗</span>
              <span className="text-xs sm:text-sm">Meine Reservierung</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span className="text-xs sm:text-sm">Host Reservierung</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
