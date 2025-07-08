
'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/logo";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addActivityLog } from "@/lib/logger";
import { Eye, EyeOff } from "lucide-react";

interface AttendanceEntry {
  employeeId: string;
  name: string;
  date: string;
  time: string;
  timeOut?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State for the attendance dialog
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [attendancePhone, setAttendancePhone] = useState('');
  const [attendanceUser, setAttendanceUser] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'out' | 'in' | 'done' | 'not_found'>('not_found');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const enteredPassword = (form.elements.namedItem('password') as HTMLInputElement).value;

    const users = JSON.parse(localStorage.getItem('sukabumi-users') || '[]');
    const user = users.find((u: any) => u.phone === phone);

    if (user && user.password === enteredPassword) {
      sessionStorage.setItem('sukabumi-active-user', JSON.stringify(user));
      addActivityLog(`Login berhasil: ${user.fullname}`, user.fullname);
      router.push('/dashboard');
    } else {
      toast({
        title: "Login Gagal",
        description: "No. Handphone atau Password salah.",
        variant: "destructive",
      });
    }
  };

  const handlePhoneBlur = () => {
    const users = JSON.parse(localStorage.getItem('sukabumi-users') || '[]');
    const user = users.find((u: any) => u.phone === phone);
    if (user) {
      if (user.role === 'admin') {
        setEmployeeId('IT ADMINISTRATOR');
      } else {
        setEmployeeId(user.employeeId);
      }
      setEmployeeName(user.fullname);
    } else {
      setEmployeeId('');
      setEmployeeName('');
    }
  };

  const checkAttendanceStatus = (user: any) => {
    if (!user) {
      setAttendanceStatus('not_found');
      return;
    }
    const attendanceData: AttendanceEntry[] = JSON.parse(localStorage.getItem('sukabumi-attendance') || '[]');
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayEntry = attendanceData.find(
      (entry) => entry.name === user.fullname && entry.date === date
    );

    if (todayEntry) {
      setAttendanceStatus(todayEntry.timeOut ? 'done' : 'in');
    } else {
      setAttendanceStatus('out');
    }
  };

  const handleAttendancePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setAttendancePhone(newPhone);

    const users = JSON.parse(localStorage.getItem('sukabumi-users') || '[]');
    const user = users.find((u: any) => u.phone === newPhone);

    if (user) {
      setAttendanceUser(user);
      checkAttendanceStatus(user);
    } else {
      setAttendanceUser(null);
      setAttendanceStatus('not_found');
    }
  };

  const handleAttendanceAction = (action: 'in' | 'out') => {
    if (!attendanceUser) return;

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g,':');
    const attendanceData: AttendanceEntry[] = JSON.parse(localStorage.getItem('sukabumi-attendance') || '[]');

    if (action === 'in') {
      const newAttendance: AttendanceEntry = { employeeId: attendanceUser.employeeId, name: attendanceUser.fullname, date, time };
      attendanceData.unshift(newAttendance);
      addActivityLog(`Absen masuk (login page): ${attendanceUser.fullname}`, attendanceUser.fullname);
      toast({
        title: "Absen Masuk Berhasil",
        description: `${attendanceUser.fullname} berhasil absen masuk pada pukul ${time}.`,
      });
    } else { // out
      const todayEntryIndex = attendanceData.findIndex(
        (entry) => entry.name === attendanceUser.fullname && entry.date === date
      );
      if (todayEntryIndex > -1) {
        attendanceData[todayEntryIndex].timeOut = time;
        addActivityLog(`Absen keluar (login page): ${attendanceUser.fullname}`, attendanceUser.fullname);
        toast({
          title: "Absen Keluar Berhasil",
          description: `${attendanceUser.fullname} berhasil absen keluar pada pukul ${time}.`,
        });
      }
    }
    localStorage.setItem('sukabumi-attendance', JSON.stringify(attendanceData));
    
    // Close and reset dialog
    setIsAttendanceDialogOpen(false);
  };
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsAttendanceDialogOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setAttendancePhone('');
      setAttendanceUser(null);
      setAttendanceStatus('not_found');
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Selamat Datang Kembali</CardTitle>
          <CardDescription>
            Masukkan No. Handphone, ID Karyawan, Nama Karyawan dan password Anda untuk masuk
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin} autoComplete="off">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">No. Handphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="081234567890"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={handlePhoneBlur}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">ID Karyawan</Label>
              <Input
                id="employeeId"
                type="text"
                placeholder="Terisi otomatis"
                required
                value={employeeId}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeName">Nama Karyawan</Label>
              <Input
                id="employeeName"
                type="text"
                placeholder="Terisi otomatis"
                required
                value={employeeName}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    autoComplete="new-password" 
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit">Masuk</Button>
            
            <Dialog open={isAttendanceDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Absen</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Absensi Cepat</DialogTitle>
                  <DialogDescription>
                    Masukkan No. Handphone Anda untuk melakukan absen masuk atau keluar.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="attendance-phone">No. Handphone</Label>
                    <Input
                      id="attendance-phone"
                      type="tel"
                      placeholder="081234567890"
                      value={attendancePhone}
                      onChange={handleAttendancePhoneChange}
                      autoComplete="off"
                    />
                  </div>
                  {attendanceUser && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="attendance-name">Nama Karyawan</Label>
                        <Input
                          id="attendance-name"
                          value={attendanceUser.fullname}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attendance-id">ID Karyawan</Label>
                        <Input
                          id="attendance-id"
                          value={attendanceUser.employeeId}
                          readOnly
                           className="bg-muted"
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter className="grid grid-cols-2 gap-2 pt-4">
                  <Button 
                    onClick={() => handleAttendanceAction('in')} 
                    disabled={attendanceStatus !== 'out'}
                  >
                    Absen Masuk
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleAttendanceAction('out')} 
                    disabled={attendanceStatus !== 'in'}
                  >
                    Absen Keluar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="text-center text-sm">
              Belum punya akun?{" "}
              <Link href="/signup" className="underline text-primary">
                Daftar
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
