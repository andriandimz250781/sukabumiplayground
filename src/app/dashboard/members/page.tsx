'use client';

import { Button } from "@/components/ui/button";
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
import { Pencil, PlusCircle, Search, Trash2, CreditCard, Share2, Download } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MemberCard } from "@/components/member-card";
import { toPng } from 'html-to-image';
import { addActivityLog } from '@/lib/logger';
import { useRouter } from "next/navigation";


interface Member {
  registrationDate: string;
  expiryDate: string;
  branch: string;
  childName: string;
  birthPlace: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  barcode: string;
}

const fontFilter = (node: HTMLElement) => {
  return !(node.tagName === 'LINK' && (node as HTMLLinkElement).href.includes('fonts.googleapis.com'));
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // State for date inputs in edit dialog
  const [editDay, setEditDay] = useState('');
  const [editMonth, setEditMonth] = useState('');
  const [editYear, setEditYear] = useState('');
  const editMonthInputRef = useRef<HTMLInputElement>(null);
  const editYearInputRef = useRef<HTMLInputElement>(null);

  // Card generation state
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userJson = sessionStorage.getItem('sukabumi-active-user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRole = user.role?.toLowerCase();
      const allowedRoles = ['owner', 'manager', 'supervisor', 'kasir'];
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
    const loadMembers = () => {
      const data = localStorage.getItem('sukabumi-members');
      if (data) {
        setMembers(JSON.parse(data));
      } else {
        setMembers([]);
      }
    };
    
    loadMembers();

    window.addEventListener('storage', loadMembers);

    return () => {
      window.removeEventListener('storage', loadMembers);
    };
  }, [isAuthorized]);

  const handleEditClick = (member: Member) => {
    setEditingMember({ ...member });
    if (member.dateOfBirth) {
      const [day, month, year] = member.dateOfBirth.split('-');
      setEditDay(day || '');
      setEditMonth(month || '');
      setEditYear(year || '');
    } else {
      setEditDay('');
      setEditMonth('');
      setEditYear('');
    }
    setIsEditDialogOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingMember) return;
    const { name, value } = e.target;
    setEditingMember({ ...editingMember, [name]: value });
  };

  const handleBranchChange = (value: string) => {
    if (!editingMember) return;
    setEditingMember({ ...editingMember, branch: value });
  };

  const handleGenderChange = (value: string) => {
    if (!editingMember) return;
    setEditingMember({ ...editingMember, gender: value });
  };

  const handleEditSave = () => {
    if (!editingMember) return;
    
    const dob = `${editDay}-${editMonth}-${editYear}`;
    if (editDay.length !== 2 || editMonth.length !== 2 || editYear.length !== 4) {
      toast({
        title: "Format Tanggal Salah",
        description: "Pastikan tanggal lahir diisi dengan format DD-MM-YYYY.",
        variant: "destructive"
      });
      return;
    }

    const memberToSave = { ...editingMember, dateOfBirth: dob };

    const updatedMembers = members.map(mem =>
      mem.barcode === memberToSave.barcode ? memberToSave : mem
    );
    setMembers(updatedMembers);
    localStorage.setItem('sukabumi-members', JSON.stringify(updatedMembers));
    
    addActivityLog(`Data member '${memberToSave.childName}' diperbarui.`);
    toast({
      title: "Data Berhasil Diperbarui",
      description: `Data untuk ${memberToSave.childName} telah disimpan.`,
    });

    setIsEditDialogOpen(false);
    setEditingMember(null);
  };
  
  const handleDeleteMember = (barcodeToDelete: string) => {
    if (!barcodeToDelete) return;

    const memberToDelete = members.find(mem => mem.barcode === barcodeToDelete);
    const updatedMembers = members.filter(
      (mem) => mem.barcode !== barcodeToDelete
    );
    setMembers(updatedMembers);
    localStorage.setItem('sukabumi-members', JSON.stringify(updatedMembers));

    if (memberToDelete) {
      addActivityLog(`Member '${memberToDelete.childName}' dihapus.`);
    }
    toast({
      title: 'Member Dihapus',
      description: `Data member telah berhasil dihapus.`,
      variant: 'destructive',
    });

    setIsEditDialogOpen(false);
    setEditingMember(null);
  };
  
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,2}$/.test(value)) {
        setEditDay(value);
        if (value.length === 2 && editMonthInputRef.current) {
            editMonthInputRef.current.focus();
        }
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,2}$/.test(value)) {
        setEditMonth(value);
        if (value.length === 2 && editYearInputRef.current) {
            editYearInputRef.current.focus();
        }
    }
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d{0,4}$/.test(value)) {
          setEditYear(value);
      }
  }


  const filteredMembers = members.filter(member => {
    const term = searchTerm.toLowerCase();
    return (
      (member.registrationDate || '').toLowerCase().includes(term) ||
      (member.expiryDate || '').toLowerCase().includes(term) ||
      (member.branch || '').toLowerCase().includes(term) ||
      (member.childName || '').toLowerCase().includes(term) ||
      (member.birthPlace || '').toLowerCase().includes(term) ||
      (member.gender || '').toLowerCase().includes(term) ||
      (member.dateOfBirth || '').toLowerCase().includes(term) ||
      (member.phone || '').toLowerCase().includes(term) ||
      (member.address || '').toLowerCase().includes(term) ||
      (member.barcode || '').toLowerCase().includes(term)
    );
  });

  const handleCreateCardClick = () => {
    if (!editingMember) {
        toast({
            title: "Data Tidak Lengkap",
            description: "Tidak ada data member yang dipilih untuk membuat kartu.",
            variant: "destructive"
        });
        return;
    }
    setIsCardDialogOpen(true);
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current || !editingMember) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, filter: fontFilter });
      const link = document.createElement('a');
      link.download = `kartu-member-${editingMember.childName.toLowerCase().replace(/\s/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      toast({
        title: "Unduhan Dimulai",
        description: "Kartu member sedang diunduh.",
      });
    } catch (err) {
      console.error('Gagal mengunduh kartu:', err);
      toast({
        title: "Gagal Mengunduh",
        description: "Terjadi kesalahan saat membuat gambar kartu.",
        variant: "destructive",
      });
    }
  };

  const handleShareCard = async () => {
    if (!cardRef.current || !editingMember) return;

    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, filter: fontFilter });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `kartu-member-${editingMember.childName.toLowerCase().replace(/\s/g, '-')}.png`, { type: blob.type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
        });
      } else {
        const link = document.createElement('a');
        link.download = `kartu-member-${editingMember.childName.toLowerCase().replace(/\s/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
        toast({
            title: "Fitur Share Tidak Didukung",
            description: "Unduhan kartu member dimulai sebagai gantinya.",
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Gagal membagikan kartu:', err);
        toast({
            title: "Gagal Membagikan",
            description: "Terjadi kesalahan saat mencoba membagikan kartu.",
            variant: "destructive",
        });
      }
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
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline">Data Member</h1>
            <p className="text-muted-foreground">Lihat dan kelola semua data member.</p>
          </div>
          <Link href="/dashboard/members/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Member
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Member</CardTitle>
            <CardDescription>Total {members.length} member terdaftar.</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari member..." 
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
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead>Tanggal Berlaku</TableHead>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Nama Anak</TableHead>
                    <TableHead>Tempat Lahir</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead>No. HP Ortu</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <TableRow key={member.barcode}>
                        <TableCell>{member.registrationDate}</TableCell>
                        <TableCell>{member.expiryDate}</TableCell>
                        <TableCell>{member.branch}</TableCell>
                        <TableCell className="font-medium">{member.childName}</TableCell>
                        <TableCell>{member.birthPlace}</TableCell>
                        <TableCell>{member.gender}</TableCell>
                        <TableCell>{member.dateOfBirth}</TableCell>
                        <TableCell>{member.phone}</TableCell>
                        <TableCell>{member.address}</TableCell>
                        <TableCell>{member.barcode}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center">
                        Belum ada member yang terdaftar.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Data Member</DialogTitle>
            <DialogDescription>
              Ubah data di bawah ini. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <div className="grid gap-4 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-4">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="edit-registrationDate">Tanggal Pendaftaran</Label>
                <Input id="edit-registrationDate" name="registrationDate" value={editingMember.registrationDate} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="edit-expiryDate">Tanggal Masa Berlaku</Label>
                <Input id="edit-expiryDate" name="expiryDate" value={editingMember.expiryDate} onChange={handleEditFormChange}/>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-branch">Cabang Playground</Label>
                <Select value={editingMember.branch} onValueChange={handleBranchChange}>
                  <SelectTrigger id="edit-branch">
                    <SelectValue placeholder="Pilih cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sukabumi">Sukabumi</SelectItem>
                    <SelectItem value="Jakarta">Jakarta</SelectItem>
                    <SelectItem value="Bandung">Bandung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-childName">Nama Anak</Label>
                <Input id="edit-childName" name="childName" value={editingMember.childName} onChange={handleEditFormChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-birthPlace">Tempat Lahir</Label>
                <Input id="edit-birthPlace" name="birthPlace" value={editingMember.birthPlace} onChange={handleEditFormChange} />
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select value={editingMember.gender} onValueChange={handleGenderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-day">Tanggal Lahir</Label>
                <div className="flex gap-2">
                  <Input id="edit-day" name="day" type="text" placeholder="DD" maxLength={2} value={editDay} onChange={handleDayChange} className="text-center" />
                  <Input ref={editMonthInputRef} id="edit-month" name="month" type="text" placeholder="MM" maxLength={2} value={editMonth} onChange={handleMonthChange} className="text-center" />
                  <Input ref={editYearInputRef} id="edit-year" name="year" type="text" placeholder="YYYY" maxLength={4} value={editYear} onChange={handleYearChange} className="text-center" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">No. Handphone Ortu</Label>
                <Input id="edit-phone" name="phone" type="tel" value={editingMember.phone} onChange={handleEditFormChange} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-address">Alamat</Label>
                <Textarea id="edit-address" name="address" value={editingMember.address} onChange={handleEditFormChange} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-barcode">Barcode Kartu</Label>
                <Input id="edit-barcode" name="barcode" value={editingMember.barcode} readOnly className="bg-muted" />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full pt-4">
             <div className="flex flex-col sm:flex-row gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Hapus Member</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini akan menghapus data untuk {editingMember?.childName} secara permanen. Tindakan ini tidak dapat diurungkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteMember(editingMember!.barcode)}>Ya, Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" onClick={handleCreateCardClick}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Buat Kartu
                </Button>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-2 sm:mt-0">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
              <Button type="button" onClick={handleEditSave}>Simpan Perubahan</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Pratinjau Kartu Member</DialogTitle>
                <DialogDescription>
                    Bagikan atau unduh kartu member di bawah ini.
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
                <MemberCard member={editingMember} cardRef={cardRef} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={handleDownloadCard}>
                    <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                <Button onClick={handleShareCard}>
                    <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
