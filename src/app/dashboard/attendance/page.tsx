'use client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameMonth } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


interface AttendanceEntry {
  employeeId: string;
  name: string;
  date: string;
  time: string;
  timeOut?: string;
}

interface DurationResult {
  formatted: string;
  totalHours: number;
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [currentMonth, setCurrentMonth] = useState<Date | undefined>();
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Set initial date on the client to avoid hydration mismatch
    const now = new Date();
    setSelectedDate(now);
    setCurrentMonth(now);
  }, []);

  useEffect(() => {
    const userJson = sessionStorage.getItem('sukabumi-active-user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRole = user.role?.toLowerCase();
      const allowedRoles = ['owner', 'manager', 'supervisor'];
      if (allowedRoles.includes(userRole)) {
        setIsAuthorized(true);
      } else {
        toast({ title: "Akses Ditolak", description: "Anda tidak memiliki izin untuk mengakses halaman ini.", variant: "destructive" });
        router.replace('/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [router, toast]);

  useEffect(() => {
    if (!isAuthorized) return;
    const data = localStorage.getItem('sukabumi-attendance');
    if (data) {
      setAttendanceData(JSON.parse(data));
    }
    
    const handleStorageChange = () => {
      const updatedData = localStorage.getItem('sukabumi-attendance');
      if (updatedData) {
        setAttendanceData(JSON.parse(updatedData));
      } else {
        setAttendanceData([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthorized]);

  const handleResetAttendance = () => {
    localStorage.removeItem('sukabumi-attendance');
    setAttendanceData([]);
    toast({
      title: "Riwayat Berhasil Direset",
      description: "Semua data riwayat absensi telah dihapus.",
    });
  };
  
  const holidays: Record<string, { name: string; date: Date }> = {
    // 2025 Holidays
    '2025-01-01': { name: 'Tahun Baru Masehi', date: new Date('2025-01-01T00:00:00Z') },
    '2025-01-27': { name: 'Isra Mikraj Nabi Muhammad SAW', date: new Date('2025-01-27T00:00:00Z') },
    '2025-01-29': { name: 'Tahun Baru Imlek 2576 Kongzili', date: new Date('2025-01-29T00:00:00Z') },
    '2025-03-29': { name: 'Hari Suci Nyepi Tahun Baru Saka 1947', date: new Date('2025-03-29T00:00:00Z') },
    '2025-03-31': { name: 'Hari Raya Idul Fitri 1446 H', date: new Date('2025-03-31T00:00:00Z') },
    '2025-04-01': { name: 'Hari Raya Idul Fitri 1446 H', date: new Date('2025-04-01T00:00:00Z') },
    '2025-04-18': { name: 'Wafat Isa Al Masih', date: new Date('2025-04-18T00:00:00Z') },
    '2025-05-01': { name: 'Hari Buruh Internasional', date: new Date('2025-05-01T00:00:00Z') },
    '2025-05-12': { name: 'Hari Raya Waisak 2569 BE', date: new Date('2025-05-12T00:00:00Z') },
    '2025-05-29': { name: 'Kenaikan Isa Al Masih', date: new Date('2025-05-29T00:00:00Z') },
    '2025-06-01': { name: 'Hari Lahir Pancasila', date: new Date('2025-06-01T00:00:00Z') },
    '2025-06-07': { name: 'Hari Raya Idul Adha 1446 H', date: new Date('2025-06-07T00:00:00Z') },
    '2025-06-27': { name: 'Tahun Baru Islam 1447 H', date: new Date('2025-06-27T00:00:00Z') },
    '2025-08-17': { name: 'Hari Kemerdekaan RI', date: new Date('2025-08-17T00:00:00Z') },
    '2025-09-05': { name: 'Maulid Nabi Muhammad SAW', date: new Date('2025-09-05T00:00:00Z') },
    '2025-12-25': { name: 'Hari Raya Natal', date: new Date('2025-12-25T00:00:00Z') },
    
    // Cuti Bersama 2025
    '2025-01-28': { name: 'Cuti Bersama Tahun Baru Imlek', date: new Date('2025-01-28T00:00:00Z') },
    '2025-03-28': { name: 'Cuti Bersama Hari Suci Nyepi', date: new Date('2025-03-28T00:00:00Z') },
    '2025-04-02': { name: 'Cuti Bersama Idul Fitri 1446 H', date: new Date('2025-04-02T00:00:00Z') },
    '2025-04-03': { name: 'Cuti Bersama Idul Fitri 1446 H', date: new Date('2025-04-03T00:00:00Z') },
    '2025-05-13': { name: 'Cuti Bersama Hari Raya Waisak', date: new Date('2025-05-13T00:00:00Z') },
    '2025-05-30': { name: 'Cuti Bersama Kenaikan Isa Al Masih', date: new Date('2025-05-30T00:00:00Z') },
    '2025-06-06': { name: 'Cuti Bersama Idul Adha 1446 H', date: new Date('2025-06-06T00:00:00Z') },
    '2025-06-09': { name: 'Cuti Bersama Idul Adha 1446 H', date: new Date('2025-06-09T00:00:00Z') },
    '2025-12-26': { name: 'Cuti Bersama Hari Raya Natal', date: new Date('2025-12-26T00:00:00Z') },
  };
  const holidayDates = Object.values(holidays).map(h => h.date);
  const holidaysForMonth = currentMonth ? Object.values(holidays).filter((h) => isSameMonth(h.date, currentMonth!)) : [];


  const calculateDuration = (startTime: string, endTime?: string): DurationResult => {
    if (!endTime || !startTime) {
      return { formatted: '-', totalHours: 0 };
    }

    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);

    if (startParts.length !== 3 || endParts.length !== 3 || startParts.some(isNaN) || endParts.some(isNaN)) {
        return { formatted: '-', totalHours: 0 };
    }

    const startDate = new Date(0);
    startDate.setUTCHours(startParts[0], startParts[1], startParts[2]);
    
    const endDate = new Date(0);
    endDate.setUTCHours(endParts[0], endParts[1], endParts[2]);

    let diff = endDate.getTime() - startDate.getTime();
    if (diff < 0) {
        return { formatted: '-', totalHours: 0 };
    }

    const totalHours = diff / 3600000;
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor(((diff % 3600000) % 60000) / 1000);

    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    return { formatted, totalHours };
  };

  const filteredAttendance = attendanceData.filter(entry => {
    if (!selectedDate) return true;
    return entry.date === format(selectedDate, 'yyyy-MM-dd');
  });

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.split('-').length !== 3) {
      return dateString;
    }
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };
  
  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Memeriksa otorisasi...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Data Absensi</h1>
          <p className="text-muted-foreground">Lihat riwayat absensi semua karyawan.</p>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: id }) : <span>Pilih Tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  locale={id}
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  weekStartsOn={0} // Start week on Sunday
                  initialFocus
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  modifiers={{
                    sunday: { dayOfWeek: [0] },
                    holiday: holidayDates,
                  }}
                  modifiersClassNames={{
                    sunday: "text-red-500",
                    holiday: "text-red-500",
                  }}
                  formatters={{
                    formatWeekdayName: (day, options) => {
                      const weekday = format(day, 'EEEE', { locale: options?.locale });
                      return <span className={cn(day.getDay() === 0 && 'text-red-500')}>{weekday.toLowerCase()}</span>;
                    },
                  }}
                  footer={
                    holidaysForMonth.length > 0 ? (
                      <div className="text-xs p-3 pt-2 space-y-1">
                        <h4 className="font-semibold">Hari Libur:</h4>
                        <ul className="space-y-1">
                          {holidaysForMonth.map((holiday) => (
                            <li key={holiday.date.toISOString()} className="text-muted-foreground">
                              <span className="text-red-500 font-semibold">{format(holiday.date, 'd', { locale: id })}</span>: {holiday.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  }
                />
              </PopoverContent>
            </Popover>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset Riwayat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus semua riwayat absensi secara permanen. Data ini tidak dapat dipulihkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAttendance}>
                    Ya, Hapus Riwayat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Absensi</CardTitle>
          <CardDescription>
            {selectedDate
              ? `Menampilkan data absensi untuk ${format(selectedDate, 'eeee, d MMMM yyyy', { locale: id })}`
              : 'Menampilkan semua data absensi'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Karyawan</TableHead>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Keluar</TableHead>
                <TableHead>Total Jam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((entry, index) => {
                  const durationInfo = calculateDuration(entry.time, entry.timeOut);
                  const durationColor = durationInfo.totalHours > 0 
                    ? durationInfo.totalHours < 8 
                        ? 'text-red-600' 
                        : 'text-green-600' 
                    : '';
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{entry.employeeId}</TableCell>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.time}</TableCell>
                      <TableCell>{entry.timeOut || '-'}</TableCell>
                      <TableCell className={`font-medium ${durationColor}`}>{durationInfo.formatted}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Tidak ada riwayat absensi untuk tanggal yang dipilih.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
