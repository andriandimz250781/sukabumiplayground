'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


interface Employee {
  fullname: string;
  employeeId: string;
  role: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  currentAddress: string;
  registrationDate?: string;
  registrationTime?: string;
}

const roleDisplayMap: { [key: string]: string } = {
  owner: "Owner",
  admin: "IT Administrator",
  manager: "Manager",
  supervisor: "Supervisor",
  kasir: "Kasir",
  staff: "Staff"
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const userJson = sessionStorage.getItem('sukabumi-active-user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRole = user.role?.toLowerCase();
      const allowedRoles = ['owner', 'manager', 'supervisor', 'admin'];
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
    const loadEmployees = () => {
      const storedUsers = localStorage.getItem('sukabumi-users');
      if (storedUsers) {
        setEmployees(JSON.parse(storedUsers));
      } else {
        setEmployees([]);
      }
    };

    loadEmployees();

    window.addEventListener('storage', loadEmployees);
    return () => {
      window.removeEventListener('storage', loadEmployees);
    };
  }, [isAuthorized]);

  const getBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner": return "default";
      case "admin": return "default";
      case "manager": return "secondary";
      case "supervisor": return "outline";
      case "kasir": return "destructive";
      case "staff": return "destructive";
      default: return "outline";
    }
  }

  const filteredEmployees = employees.filter(employee =>
    (employee.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.dateOfBirth || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.currentAddress || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.registrationDate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.registrationTime || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
        <h1 className="text-2xl font-bold font-headline">Data Karyawan</h1>
        <p className="text-muted-foreground">Lihat data akun karyawan.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Daftar Karyawan</CardTitle>
              <CardDescription>Total {employees.length} karyawan terdaftar.</CardDescription>
            </div>
          </div>
           <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari berdasarkan nama, ID, posisi, dll..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>ID Karyawan</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Tanggal Lahir</TableHead>
                  <TableHead>No. Handphone</TableHead>
                  <TableHead>Alamat KTP</TableHead>
                  <TableHead>Alamat Saat Ini</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.employeeId}>
                      <TableCell className="font-medium">{employee.fullname}</TableCell>
                      <TableCell>{employee.employeeId}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(employee.role)}>{roleDisplayMap[employee.role.toLowerCase()] || employee.role}</Badge>
                      </TableCell>
                      <TableCell>{employee.dateOfBirth}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>{employee.address}</TableCell>
                      <TableCell>{employee.currentAddress}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Tidak ada data karyawan. Silakan daftarkan karyawan baru.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
