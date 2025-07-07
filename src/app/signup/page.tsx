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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { addActivityLog } from "@/lib/logger";
import { format } from "date-fns";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [registrationTime, setRegistrationTime] = useState("");

  // New state for manual date input
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  // State for phone input and validation
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const today = new Date();
    setRegistrationDate(format(today, 'dd-MM-yyyy'));
    setRegistrationTime(format(today, 'HH:mm:ss'));
    
    const timerId = setInterval(() => {
        setRegistrationTime(format(new Date(), 'HH:mm:ss'));
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (role) {
      const users = JSON.parse(localStorage.getItem('sukabumi-users') || '[]');
      const rolePrefixMap: { [key: string]: string } = {
        owner: 'OWN',
        manager: 'MGR',
        supervisor: 'SPV',
        kasir: 'KSR',
        staff: 'STF',
        admin: 'ADM',
      };
      
      const prefix = rolePrefixMap[role];
      if (prefix) {
        const usersWithPrefix = users.filter((user: { employeeId?: string }) => user.employeeId?.startsWith(prefix));
        const lastIdNumber = usersWithPrefix.reduce((maxId: number, user: { employeeId?: string }) => {
            if (user.employeeId && user.employeeId.includes('-')) {
                const idParts = user.employeeId.split('-');
                if (idParts.length > 1) {
                    const idNumber = parseInt(idParts[1], 10);
                    if (!isNaN(idNumber)) {
                        return idNumber > maxId ? idNumber : maxId;
                    }
                }
            }
            return maxId;
        }, 0);

        const nextIdNumber = lastIdNumber + 1;
        const formattedId = `${prefix}-${String(nextIdNumber).padStart(3, '0')}`;
        setEmployeeId(formattedId);
      }
    } else {
      setEmployeeId('');
    }
  }, [role]);
  
  // Handlers for manual date input
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,2}$/.test(value)) {
        setDay(value);
        if (value.length === 2 && monthInputRef.current) {
            monthInputRef.current.focus();
        }
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,2}$/.test(value)) {
        setMonth(value);
        if (value.length === 2 && yearInputRef.current) {
            yearInputRef.current.focus();
        }
    }
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d{0,4}$/.test(value)) {
          setYear(value);
      }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhone(newPhone);

    const users = JSON.parse(localStorage.getItem('sukabumi-users') || '[]');
    if (newPhone && users.some((user: any) => user.phone === newPhone)) {
      setPhoneError("Nomor Handphone sudah terdaftar. Silahkan gunakan Nomor yang lain");
    } else {
      setPhoneError("");
    }
  };


  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneError) {
      toast({
        title: "Pendaftaran Gagal",
        description: phoneError,
        variant: "destructive",
      });
      return;
    }

    const form = e.currentTarget as HTMLFormElement;

    const fullname = (form.elements.namedItem('fullname') as HTMLInputElement).value;
    const address = (form.elements.namedItem('address') as HTMLTextAreaElement).value;
    const currentAddress = (form.elements.namedItem('currentAddress') as HTMLTextAreaElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
    
    // Construct and validate date from manual inputs
    const dob = `${day}-${month}-${year}`;
    if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
        toast({
            title: "Format Tanggal Salah",
            description: "Pastikan tanggal diisi dengan format DD-MM-YYYY.",
            variant: "destructive"
        });
        return;
    }

    if (!role) {
      toast({
        title: "Pendaftaran Gagal",
        description: "Silakan pilih posisi karyawan.",
        variant: "destructive",
      });
      return;
    }

    if (!employeeId) {
      toast({
          title: "Pendaftaran Gagal",
          description: "ID Karyawan tidak dapat dibuat secara otomatis.",
          variant: "destructive",
      });
      return;
    }

    if (password.length < 4) {
      toast({
        title: "Password Terlalu Pendek",
        description: "Password minimal harus 4 karakter.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Tidak Cocok",
        description: "Pastikan password dan konfirmasi password sama.",
        variant: "destructive",
      });
      return;
    }
    
    const users = JSON.parse(localStorage.getItem('sukabumi-users') || '[]');

    if (users.some((user: any) => user.phone === phone)) {
      toast({
        title: 'Pendaftaran Gagal',
        description: 'No. Handphone sudah terdaftar.',
        variant: 'destructive',
      });
      return;
    }
    
    if (users.some((user: any) => user.employeeId === employeeId)) {
      toast({
        title: 'Pendaftaran Gagal',
        description: 'ID Karyawan sudah terdaftar.',
        variant: 'destructive',
      });
      return;
    }
    
    users.push({ phone, fullname, dateOfBirth: dob, employeeId, password, role, address, currentAddress, registrationDate, registrationTime });
    localStorage.setItem('sukabumi-users', JSON.stringify(users));
    
    addActivityLog(`Karyawan baru '${fullname}' telah terdaftar.`, 'Sistem');
    toast({
      title: "Pendaftaran Berhasil!",
      description: "Silakan masuk untuk melanjutkan.",
    });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Buat Akun Karyawan</CardTitle>
          <CardDescription>
            Isi form di bawah untuk mendaftarkan karyawan baru
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup} autoComplete="off">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">No. Handphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="081234567890"
                required
                autoComplete="off"
                value={phone}
                onChange={handlePhoneChange}
              />
              {phoneError && <p className="text-sm font-medium text-destructive">{phoneError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullname">Nama Lengkap</Label>
              <Input id="fullname" name="fullname" placeholder="Nama Anda" required autoComplete="off" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="day">Tanggal Lahir</Label>
                <div className="flex gap-2">
                  <Input
                    id="day"
                    name="day"
                    type="text"
                    placeholder="DD"
                    required
                    maxLength={2}
                    value={day}
                    onChange={handleDayChange}
                    className="text-center"
                  />
                  <Input
                    ref={monthInputRef}
                    id="month"
                    name="month"
                    type="text"
                    placeholder="MM"
                    required
                    maxLength={2}
                    value={month}
                    onChange={handleMonthChange}
                    className="text-center"
                  />
                  <Input
                    ref={yearInputRef}
                    id="year"
                    name="year"
                    type="text"
                    placeholder="YYYY"
                    required
                    maxLength={4}
                    value={year}
                    onChange={handleYearChange}
                    className="text-center"
                  />
                </div>
              </div>
            <div className="space-y-2">
              <Label htmlFor="role">Posisi</Label>
              <Select required name="role" value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih posisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="kasir">Kasir</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="employeeId">ID Karyawan</Label>
              <Input
                id="employeeId"
                name="employeeId"
                placeholder="Pilih posisi untuk ID otomatis"
                required
                value={employeeId}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat KTP</Label>
              <Textarea id="address" name="address" placeholder="Masukkan alamat lengkap" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentAddress">Alamat Saat Ini</Label>
              <Textarea id="currentAddress" name="currentAddress" placeholder="Masukkan alamat saat ini" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="registrationDate">Tanggal Pendaftaran</Label>
                <Input
                    id="registrationDate"
                    name="registrationDate"
                    value={registrationDate}
                    readOnly
                    className="bg-muted"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="registrationTime">Waktu Pendaftaran</Label>
                <Input
                    id="registrationTime"
                    name="registrationTime"
                    value={registrationTime}
                    readOnly
                    className="bg-muted"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={4} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">Password minimal 4 karakter bebas</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Ulangi Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit">Daftar</Button>
            <div className="text-center text-sm">
              Sudah punya akun?{" "}
              <Link href="/login" className="underline text-primary">
                Masuk
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
