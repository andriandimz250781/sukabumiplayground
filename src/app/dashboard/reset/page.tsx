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
import { Trash2 } from "lucide-react";
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

type ResetOption = {
  title: string;
  description: string;
  keys: string[];
  toastTitle: string;
};

export default function ResetPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const userJson = sessionStorage.getItem('sukabumi-active-user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRole = user.role?.toLowerCase();
      const allowedRoles = ['admin'];
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
    
    keysToReset.forEach(key => localStorage.removeItem(key));
    
    sessionStorage.removeItem('sukabumi-active-user');
    
    toast({
      title: "Data Berhasil Direset",
      description: "Semua data aplikasi telah dihapus. Anda akan diarahkan ke halaman login.",
    });

    setTimeout(() => {
        router.push('/login');
    }, 1500);
  };
  
  const resetOptions: ResetOption[] = [
    {
      title: "Reset Data Karyawan",
      description: "Menghapus semua data pengguna, termasuk login dan password. Tidak menghapus data absensi terkait.",
      keys: ['sukabumi-users'],
      toastTitle: "Data Karyawan Direset"
    },
    {
      title: "Reset Rekap Absen",
      description: "Menghapus semua riwayat absensi karyawan. Data karyawan tidak akan terhapus.",
      keys: ['sukabumi-attendance'],
      toastTitle: "Rekap Absen Direset"
    },
    {
      title: "Reset Data Member",
      description: "Menghapus semua data member yang terdaftar.",
      keys: ['sukabumi-members'],
      toastTitle: "Data Member Direset"
    },
    {
      title: "Reset Data Shopping",
      description: "Menghapus semua data pesanan makanan/minuman/barang yang sedang berjalan (sebelum checkout).",
      keys: ['sukabumi-customer-orders'],
      toastTitle: "Data Shopping Direset"
    },
    {
      title: "Reset Transaksi Kasir",
      description: "Menghapus semua riwayat transaksi, data pelanggan aktif, dan nomor urut harian.",
      keys: ['sukabumi-transactions', 'sukabumi-active-customers', 'sukabumi-daily-sequence'],
      toastTitle: "Transaksi Kasir Direset"
    },
    {
      title: "Reset Inventory & Aset",
      description: "Menghapus semua data stok inventaris dan daftar aset.",
      keys: ['sukabumi-inventory', 'sukabumi-assets'],
      toastTitle: "Inventory & Aset Direset"
    },
    {
      title: "Reset Pengaturan",
      description: "Mengembalikan semua pengaturan umum ke nilai default pabrik.",
      keys: ['sukabumi-settings'],
      toastTitle: "Pengaturan Direset"
    },
  ];

  const handleSpecificReset = (option: ResetOption) => {
    option.keys.forEach(key => localStorage.removeItem(key));
    toast({
      title: option.toastTitle,
      description: `Data untuk ${option.title} telah berhasil dihapus.`,
    });
    window.dispatchEvent(new Event('storage'));
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
        <h1 className="text-2xl font-bold font-headline">Reset Data</h1>
        <p className="text-muted-foreground">
          Hapus semua data aplikasi secara permanen.
        </p>
      </div>
      
      <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Reset Semua Data Aplikasi</CardTitle>
            <CardDescription>
              Tindakan di bawah ini bersifat permanen dan tidak dapat diurungkan. Menghapus semua data akan me-reset ID Karyawan dan Member kembali ke nomor urut 1, dan akan mengarahkan Anda ke halaman login.
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

      <Card>
        <CardHeader>
          <CardTitle>Reset Data Spesifik</CardTitle>
          <CardDescription>
            Pilih data spesifik yang ingin Anda reset. Tindakan ini tidak akan me-logout Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resetOptions.map((option) => (
            <div key={option.title} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">{option.title}</h4>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Reset</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda akan menghapus {option.title.toLowerCase()} secara permanen. Data ini tidak dapat dipulihkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSpecificReset(option)}>
                      Ya, Reset Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
