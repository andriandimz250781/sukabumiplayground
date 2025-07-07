
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
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActiveCustomer {
  childName: string;
  checkInTime: string;
  phone: string;
  checkInTimestamp: number;
  dailySequence: string;
  barcode?: string;
}

const calculateDuration = (checkInTimestamp: number, now: number): string => {
  if (!checkInTimestamp || !now) return '-';
  const diff = now - checkInTimestamp;

  const totalMinutes = Math.floor(diff / 60000);
  if (totalMinutes < 1) return '< 1 menit';
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  return `${minutes} menit`;
};

export default function ActiveCustomersPage() {
  const [activeCustomers, setActiveCustomers] = useState<ActiveCustomer[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const { toast } = useToast();

  const loadActiveCustomers = () => {
    const data = localStorage.getItem('sukabumi-active-customers');
    if (data) {
      setActiveCustomers(JSON.parse(data));
    } else {
      setActiveCustomers([]);
    }
  };

  useEffect(() => {
    // Set initial time on client to avoid hydration mismatch
    setCurrentTime(new Date().getTime());
    loadActiveCustomers();

    const timer = setInterval(() => {
      setCurrentTime(new Date().getTime()); // Update duration every minute
    }, 60000); 

    const handleStorageChange = () => {
      loadActiveCustomers();
    }
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleCheckout = (customerToCheckOut: ActiveCustomer) => {
    const updatedCustomers = activeCustomers.filter(customer => customer.phone !== customerToCheckOut.phone);
    localStorage.setItem('sukabumi-active-customers', JSON.stringify(updatedCustomers));
    setActiveCustomers(updatedCustomers);
    
    // Clean up order data
    const ordersData = localStorage.getItem('sukabumi-customer-orders');
    if (ordersData) {
        const orders = JSON.parse(ordersData);
        if (orders[customerToCheckOut.dailySequence]) {
            delete orders[customerToCheckOut.dailySequence];
            localStorage.setItem('sukabumi-customer-orders', JSON.stringify(orders));
        }
    }
    
    // Dispatch storage event to notify other components like the cashier page
    window.dispatchEvent(new Event('storage'));

    toast({
      title: "Check-out Berhasil",
      description: `${customerToCheckOut?.childName || 'Member'} telah check-out.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Data Customer Aktif</h1>
        <p className="text-muted-foreground">
          Daftar pelanggan yang sedang berada di area bermain.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Customer Aktif</CardTitle>
          <CardDescription>
            Total {activeCustomers.length} anak sedang bermain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Anak</TableHead>
                <TableHead>Waktu Check-in</TableHead>
                <TableHead>Durasi Bermain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeCustomers.length > 0 ? (
                activeCustomers.map((customer) => (
                  <TableRow key={customer.phone}>
                    <TableCell className="font-medium">{customer.childName}</TableCell>
                    <TableCell>{customer.checkInTime}</TableCell>
                    <TableCell>
                      {currentTime !== null ? calculateDuration(customer.checkInTimestamp, currentTime) : 'Menghitung...'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-200 text-green-800">Aktif</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" onClick={() => handleCheckout(customer)}>
                         <LogOut className="mr-2 h-4 w-4"/>
                         Check-out
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Tidak ada customer aktif saat ini.
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
