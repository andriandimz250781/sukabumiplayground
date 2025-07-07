'use client';

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
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { format } from 'date-fns';
import { ActivityLog } from "@/lib/logger";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    const userJson = sessionStorage.getItem('sukabumi-active-user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRole = user.role?.toLowerCase();
      const allowedRoles = ['owner', 'manager', 'supervisor', 'kasir', 'admin'];
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

    const loadLogs = () => {
      const storedLogs = localStorage.getItem('sukabumi-activity-logs');
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      } else {
        setLogs([]);
      }
    };

    loadLogs();
    
    window.addEventListener('storage', loadLogs);
    
    return () => {
      window.removeEventListener('storage', loadLogs);
    };
  }, [isAuthorized]);
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "dd-MM-yyyy HH:mm:ss");
    } catch (e) {
      console.error("Invalid timestamp format:", timestamp, e);
      return "Waktu tidak valid";
    }
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
        <h1 className="text-2xl font-bold font-headline">Log Aktivitas</h1>
        <p className="text-muted-foreground">Riwayat semua aktivitas yang terjadi di sistem.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas</CardTitle>
          <CardDescription>Menampilkan {logs.length} aktivitas terbaru.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Aktivitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant="outline">{formatTimestamp(log.timestamp)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>{log.activity}</TableCell>
                </TableRow>
              ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Belum ada aktivitas yang tercatat.
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
