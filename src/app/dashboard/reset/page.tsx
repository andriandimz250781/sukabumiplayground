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
    </div>
  );
}
