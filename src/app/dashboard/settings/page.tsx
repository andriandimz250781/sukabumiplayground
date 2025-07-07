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
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2 } from "lucide-react";
import { addActivityLog } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('25000');
  const [memberDiscount, setMemberDiscount] = useState('10');
  const [openingHours, setOpeningHours] = useState('09:00 - 21:00');

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
    const storedSettings = localStorage.getItem('sukabumi-settings');
    if (storedSettings) {
      const { ticketPrice, memberDiscount, openingHours } = JSON.parse(storedSettings);
      setTicketPrice(ticketPrice || '25000');
      setMemberDiscount(memberDiscount || '10');
      setOpeningHours(openingHours || '09:00 - 21:00');
    }
  }, [isAuthorized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = {
      ticketPrice,
      memberDiscount,
      openingHours
    };
    localStorage.setItem('sukabumi-settings', JSON.stringify(settings));
    addActivityLog('Pengaturan umum diperbarui.');
    toast({
      title: "Pengaturan Disimpan",
      description: "Perubahan yang Anda buat telah berhasil disimpan.",
    });
  };

  const handleResetData = () => {
    const keysToReset = [
      'sukabumi-users',
      'sukabumi-members',
      'sukabumi-attendance',
      'sukabumi-active-customers',
      'sukabumi-customer-orders',
      'sukabumi-transactions',
      'sukabumi-activity-logs',
      'sukabumi-daily-sequence',
      'sukabumi-inventory',
      'sukabumi-assets',
      'sukabumi-settings',
    ];
    
    // Clear all localStorage keys
    keysToReset.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage to log out the user
    sessionStorage.removeItem('sukabumi-active-user');
    
    toast({
      title: "Data Berhasil Direset",
      description: "Semua data aplikasi telah dihapus. Anda akan diarahkan ke halaman login.",
    });

    // Redirect to login page after a short delay
    setTimeout(() => {
        router.push('/login');
    }, 1500);
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
      <div>
        <h1 className="text-2xl font-bold font-headline">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola pengaturan umum untuk operasional playground.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Pengaturan Umum</CardTitle>
            <CardDescription>
              Atur harga, jam buka, dan diskon di sini.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticketPrice">Harga Tiket (per jam)</Label>
              <Input id="ticketPrice" type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingHours">Jam Buka</Label>
              <Input id="openingHours" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberDiscount">Diskon Member (%)</Label>
              <Input id="memberDiscount" type="number" value={memberDiscount} onChange={(e) => setMemberDiscount(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Reset</CardTitle>
            <CardDescription>
              Tindakan di bawah ini bersifat permanen dan tidak dapat diurungkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Reset Semua Data Aplikasi
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda akan menghapus semua data aplikasi, termasuk ID Karyawan dan ID Member, yang akan direset kembali ke nomor urut 1. Tindakan ini tidak dapat mengembalikan data yang tersimpan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData}>
                    Ya, Hapus Semua Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
      </Card>
    </div>
  );
}
