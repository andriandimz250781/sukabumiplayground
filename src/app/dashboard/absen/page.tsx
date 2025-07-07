
'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { LogIn, LogOut, Users } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { addActivityLog } from "@/lib/logger";


interface User {
  phone: string;
  fullname: string;
  employeeId: string;
  password?: string;
}

interface AttendanceEntry {
  employeeId: string;
  name: string;
  date: string;
  time: string;
  timeOut?: string;
}

export default function AbsenPage() {
  const { toast } = useToast();
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'out' | 'in' | 'done' | 'loading'>('loading');
  const [lastClockInTime, setLastClockInTime] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // State for the clock-in dialog for OTHER users
  const [isOtherUserDialogOpen, setIsOtherUserDialogOpen] = useState(false);
  const [dialogPhone, setDialogPhone] = useState('');
  const [dialogUser, setDialogUser] = useState<User | null>(null);
  const [dialogUserStatus, setDialogUserStatus] = useState<'out' | 'in' | 'done' | 'not_found'>('not_found');

  // State for password confirmation dialog
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [actionToConfirm, setActionToConfirm] = useState<'in' | 'out' | null>(null);
  const [userToConfirm, setUserToConfirm] = useState<User | null>(null);


  useEffect(() => {
    // Run only on client to get current time and avoid hydration errors
    setCurrentTime(new Date());
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const userJson = sessionStorage.getItem('sukabumi-active-user');
    if (userJson) {
      const user = JSON.parse(userJson);
      setActiveUser(user);
      checkAttendanceStatusForLoggedInUser(user);
    } else {
        setAttendanceStatus('loading');
    }
  }, [refreshKey]);

  // Checks status for the LOGGED IN user to update the main page UI
  const checkAttendanceStatusForLoggedInUser = (user: User) => {
    if (!user) {
      setAttendanceStatus('loading');
      return;
    }
    const attendanceData: AttendanceEntry[] = JSON.parse(localStorage.getItem('sukabumi-attendance') || '[]');
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const todayEntry = attendanceData.find(
      (entry) => entry.employeeId === user.employeeId && entry.date === date
    );

    if (todayEntry) {
      setLastClockInTime(todayEntry.time);
      setAttendanceStatus(todayEntry.timeOut ? 'done' : 'in');
    } else {
      setAttendanceStatus('out');
    }
  };
  
  // Checks status for ANY user (used in the dialog) to determine if they can clock in
  const checkAttendanceStatusForDialog = (user: User | null) => {
    if (!user) {
      setDialogUserStatus('not_found');
      return;
    }
    const attendanceData: AttendanceEntry[] = JSON.parse(localStorage.getItem('sukabumi-attendance') || '[]');
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const todayEntry = attendanceData.find(
      (entry) => entry.employeeId === user.employeeId && entry.date === date
    );

    if (todayEntry) {
      setDialogUserStatus(todayEntry.timeOut ? 'done' : 'in');
    } else {
      setDialogUserStatus('out');
    }
  }

  // New handler for phone input in dialog
  const handleDialogPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setDialogPhone(newPhone);

    const users: User[] = JSON.parse(localStorage.getItem('sukabumi-users') || '[]');
    const user = users.find((u) => u.phone === newPhone);

    setDialogUser(user || null);
    checkAttendanceStatusForDialog(user || null);
  };
  
  const performClockIn = (user: User) => {
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g,':');
    const attendanceData: AttendanceEntry[] = JSON.parse(localStorage.getItem('sukabumi-attendance') || '[]');

    const newAttendance: AttendanceEntry = { employeeId: user.employeeId, name: user.fullname, date, time };
    attendanceData.unshift(newAttendance);
    addActivityLog(`Absen masuk: ${user.fullname}`);
    toast({
      title: "Absen Masuk Berhasil",
      description: `${user.fullname} berhasil absen masuk pada pukul ${time}.`,
    });
    
    localStorage.setItem('sukabumi-attendance', JSON.stringify(attendanceData));
    setRefreshKey(prev => prev + 1);
  };

  const performClockOut = (user: User) => {
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g,':');
    const attendanceData: AttendanceEntry[] = JSON.parse(localStorage.getItem('sukabumi-attendance') || '[]');

    const todayEntryIndex = attendanceData.findIndex(
      (entry) => entry.employeeId === user.employeeId && entry.date === date
    );

    if (todayEntryIndex > -1 && !attendanceData[todayEntryIndex].timeOut) {
      attendanceData[todayEntryIndex].timeOut = time;
      addActivityLog(`Absen keluar: ${user.fullname}`);
      toast({
        title: "Absen Keluar Berhasil",
        description: `${user.fullname} berhasil absen keluar pada pukul ${time}.`,
      });
    } else {
        toast({
            title: "Aksi Gagal",
            description: `${user.fullname} tidak dapat absen keluar.`,
            variant: "destructive"
        });
        return;
    }
    
    localStorage.setItem('sukabumi-attendance', JSON.stringify(attendanceData));
    setRefreshKey(prev => prev + 1);
  };

  const openPasswordDialog = (action: 'in' | 'out', user: User) => {
    setUserToConfirm(user);
    setActionToConfirm(action);
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordConfirm = () => {
    if (!userToConfirm || !actionToConfirm) return;

    const users: User[] = JSON.parse(localStorage.getItem('sukabumi-users') || '[]');
    const userFromStorage = users.find(u => u.employeeId === userToConfirm.employeeId);

    if (userFromStorage?.password !== password) {
      toast({
        title: "Aksi Gagal",
        description: "Password yang Anda masukkan salah.",
        variant: "destructive"
      });
      return;
    }
    
    if (actionToConfirm === 'in') {
      performClockIn(userToConfirm);
    } else {
      performClockOut(userToConfirm);
    }
    
    // Close all dialogs and reset state
    setIsPasswordDialogOpen(false);
    setIsOtherUserDialogOpen(false);
    setPassword('');
    setActionToConfirm(null);
    setUserToConfirm(null);
    setDialogPhone('');
    setDialogUser(null);
    setDialogUserStatus('not_found');
  };
  
  const handleOtherUserDialogOpenChange = (open: boolean) => {
    setIsOtherUserDialogOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setDialogPhone('');
      setDialogUser(null);
      setDialogUserStatus('not_found');
    }
  };


  const getDescription = () => {
     switch (attendanceStatus) {
        case 'loading':
            return "Memeriksa status absensi Anda..."
        case 'out':
            return "Anda belum melakukan absen masuk hari ini. Silakan tekan tombol di bawah untuk absen masuk."
        case 'in':
            return `Anda telah absen masuk pada pukul ${lastClockInTime}. Tekan tombol di bawah untuk absen keluar.`
        case 'done':
            return "Terima kasih, Anda telah menyelesaikan absensi untuk hari ini."
        default:
            return "Tidak dapat memuat informasi pengguna. Silakan coba login kembali."
    }
  }

  const isLoading = attendanceStatus === 'loading';

  return (
    <>
    <div className="flex justify-center items-start py-6">
        <Card className="w-full max-w-lg">
             <CardHeader className="text-center">
                <div>
                    <p className="text-5xl font-bold font-mono tracking-wider">
                        {currentTime ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g,':') : '00:00:00'}
                    </p>
                    <p className="text-lg text-muted-foreground mt-1">
                        {currentTime ? format(currentTime, 'dd-MM-yyyy') : 'Memuat tanggal...'}
                    </p>
                </div>
                <Separator/>
                <div className="pt-2">
                    <CardTitle className="font-headline text-2xl">Halo, {activeUser?.fullname || "Karyawan"}!</CardTitle>
                    <CardDescription>{getDescription()}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center gap-4">
                    <div className="flex w-full flex-col sm:flex-row gap-4">
                        <Button 
                            size="lg" 
                            className="w-full"
                            onClick={() => activeUser && openPasswordDialog('in', activeUser)}
                            disabled={isLoading || attendanceStatus !== 'out'}
                        >
                            <LogIn className="mr-2 h-4 w-4"/> Absen Masuk
                        </Button>
                        <Button 
                            size="lg" 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => activeUser && openPasswordDialog('out', activeUser)}
                            disabled={isLoading || attendanceStatus !== 'in'}
                        >
                            <LogOut className="mr-2 h-4 w-4"/> Absen Keluar
                        </Button>
                    </div>
                    <Separator/>
                    <Dialog open={isOtherUserDialogOpen} onOpenChange={handleOtherUserDialogOpenChange}>
                        <DialogTrigger asChild>
                           <Button variant="outline" className="w-full sm:w-auto">
                              <Users className="mr-2 h-4 w-4"/> Absen Karyawan Lain
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Absensi Karyawan Lain</DialogTitle>
                            <DialogDescription>
                              Masukkan No. Handphone untuk mencatat absen. Status karyawan akan menentukan aksi yang tersedia.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                             <div className="space-y-2">
                              <Label htmlFor="dialog-phone">No. Handphone</Label>
                              <Input
                                id="dialog-phone"
                                type="tel"
                                placeholder="081234567890"
                                value={dialogPhone}
                                onChange={handleDialogPhoneChange}
                                autoComplete="off"
                              />
                            </div>
                            {dialogUser && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="dialog-name">Nama Karyawan</Label>
                                  <Input id="dialog-name" value={dialogUser.fullname} readOnly className="bg-muted"/>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="dialog-id">ID Karyawan</Label>
                                  <Input id="dialog-id" value={dialogUser.employeeId} readOnly className="bg-muted" />
                                </div>
                              </>
                            )}
                          </div>
                          <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
                             <Button 
                              className="w-full"
                              onClick={() => dialogUser && openPasswordDialog('in', dialogUser)}
                              disabled={dialogUserStatus !== 'out'}
                            >
                              Konfirmasi Absen Masuk
                            </Button>
                            <Button
                              variant="destructive"
                              className="w-full"
                              onClick={() => dialogUser && openPasswordDialog('out', dialogUser)}
                              disabled={dialogUserStatus !== 'in'}
                            >
                              Konfirmasi Absen Keluar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                </div>
            </CardContent>
        </Card>
    </div>

    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Konfirmasi Aksi</DialogTitle>
          <DialogDescription>
            Masukkan password untuk {userToConfirm?.fullname} untuk melanjutkan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordConfirm(); }}
            autoComplete="current-password"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Batal</Button>
          <Button onClick={handlePasswordConfirm}>Konfirmasi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
