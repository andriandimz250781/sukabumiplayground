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
import { Pencil, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addActivityLog } from '@/lib/logger';


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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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
      case "manager": return "secondary";
      case "supervisor": return "outline";
      case "kasir": return "destructive";
      case "staff": return "destructive";
      default: return "outline";
    }
  }

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee({ ...employee });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingEmployee) return;

    const updatedEmployees = employees.map(emp =>
      emp.employeeId === editingEmployee.employeeId ? editingEmployee : emp
    );
    setEmployees(updatedEmployees);
    localStorage.setItem('sukabumi-users', JSON.stringify(updatedEmployees));

    addActivityLog(`Data karyawan '${editingEmployee.fullname}' diperbarui.`);
    toast({
      title: "Data Berhasil Diperbarui",
      description: `Data untuk ${editingEmployee.fullname} telah disimpan.`,
    });

    setIsEditDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (employeeIdToDelete: string) => {
    if (!employeeIdToDelete) return;

    const employeeToDelete = employees.find(emp => emp.employeeId === employeeIdToDelete);
    const updatedEmployees = employees.filter(
      (emp) => emp.employeeId !== employeeIdToDelete
    );
    setEmployees(updatedEmployees);
    localStorage.setItem('sukabumi-users', JSON.stringify(updatedEmployees));

    if (employeeToDelete) {
      addActivityLog(`Karyawan '${employeeToDelete.fullname}' dihapus.`);
    }
    toast({
      title: 'Karyawan Dihapus',
      description: `Data untuk karyawan telah berhasil dihapus.`,
      variant: 'destructive',
    });

    setIsEditDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingEmployee) return;
    const { name, value } = e.target;
    setEditingEmployee({ ...editingEmployee, [name]: value });
  };
  
  const handleRoleChange = (value: string) => {
    if (!editingEmployee) return;
    setEditingEmployee({ ...editingEmployee, role: value });
  };

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
        <p className="text-muted-foreground">Lihat dan kelola akun karyawan.</p>
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
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.employeeId}>
                      <TableCell className="font-medium">{employee.fullname}</TableCell>
                      <TableCell>{employee.employeeId}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(employee.role)}>{employee.role}</Badge>
                      </TableCell>
                      <TableCell>{employee.dateOfBirth}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>{employee.address}</TableCell>
                      <TableCell>{employee.currentAddress}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(employee)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Tidak ada data karyawan. Silakan daftarkan karyawan baru.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Karyawan</DialogTitle>
            <DialogDescription>
              Ubah data di bawah ini. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="fullname">Nama Lengkap</Label>
                <Input id="fullname" name="fullname" value={editingEmployee.fullname} onChange={handleEditFormChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">ID Karyawan</Label>
                <Input id="employeeId" name="employeeId" value={editingEmployee.employeeId} readOnly className="bg-muted" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="role">Posisi</Label>
                <Select value={editingEmployee.role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Pilih posisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="kasir">Kasir</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                <Input id="dateOfBirth" name="dateOfBirth" value={editingEmployee.dateOfBirth} onChange={handleEditFormChange} placeholder="DD-MM-YYYY"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. Handphone</Label>
                <Input id="phone" name="phone" value={editingEmployee.phone} onChange={handleEditFormChange} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="address">Alamat KTP</Label>
                <Textarea id="address" name="address" value={editingEmployee.address} onChange={handleEditFormChange} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="currentAddress">Alamat Saat Ini</Label>
                <Textarea id="currentAddress" name="currentAddress" value={editingEmployee.currentAddress} onChange={handleEditFormChange} />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full pt-4">
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Hapus Karyawan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus data untuk {editingEmployee?.fullname} secara permanen. Tindakan ini tidak dapat diurungkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteEmployee(editingEmployee!.employeeId)}>
                    Ya, Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-2 sm:mt-0">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                <Button type="button" onClick={handleEditSave}>Simpan Perubahan</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
