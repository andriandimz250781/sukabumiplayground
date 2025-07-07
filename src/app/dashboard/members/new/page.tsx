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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Download, Share2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toPng } from 'html-to-image';
import { MemberCard } from '@/components/member-card';
import { addActivityLog } from '@/lib/logger';

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

export default function NewMemberPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [branch, setBranch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [childName, setChildName] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  // Card generation state
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [currentMemberData, setCurrentMemberData] = useState<Member | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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
    const today = new Date();
    const expiry = new Date(today);
    expiry.setFullYear(today.getFullYear() + 1);

    setRegistrationDate(format(today, 'dd-MM-yyyy'));
    setExpiryDate(format(expiry, 'dd-MM-yyyy'));
  }, [isAuthorized]);

  useEffect(() => {
    if (branch && day.length === 2 && month.length === 2 && year.length === 4) {
      const branchCodes: { [key: string]: string } = {
        Sukabumi: 'SKB',
        Jakarta: 'JKT',
        Bandung: 'BDG',
      };
      
      const code = branchCodes[branch] || 'N/A';
      const dob = `${day}${month}${year.slice(-2)}`;
      
      const members: Member[] = JSON.parse(localStorage.getItem('sukabumi-members') || '[]');
      const sequence = String(members.length + 1).padStart(4, '0');
      
      const regDate = format(new Date(), 'MM/yy');
      
      const generatedBarcode = `${code}-${dob}-${sequence}-${regDate}`;
      setBarcode(generatedBarcode);
    } else {
      setBarcode('');
    }
  }, [branch, day, month, year]);

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    const dateOfBirth = `${day}-${month}-${year}`;

    if (!branch) {
      toast({
        title: "Pendaftaran Gagal",
        description: "Silakan pilih cabang playground.",
        variant: "destructive",
      });
      return;
    }

    if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
        toast({
            title: "Format Tanggal Salah",
            description: "Pastikan tanggal diisi dengan format DD-MM-YYYY.",
            variant: "destructive"
        });
        return;
    }

    if (!gender) {
      toast({
        title: "Pendaftaran Gagal",
        description: "Silakan pilih jenis kelamin.",
        variant: "destructive",
      });
      return;
    }

    if (!barcode) {
      toast({
        title: "Pendaftaran Gagal",
        description: "Barcode tidak dapat dibuat. Pastikan semua data terisi dengan benar.",
        variant: "destructive",
      });
      return;
    }

    const newMember: Member = {
      registrationDate: registrationDate,
      expiryDate: expiryDate,
      branch: branch,
      childName: childName,
      birthPlace: (form.elements.namedItem('birthPlace') as HTMLInputElement).value,
      gender: gender,
      dateOfBirth: dateOfBirth,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      address: (form.elements.namedItem('address') as HTMLTextAreaElement).value,
      barcode: barcode,
    };

    const members: Member[] = JSON.parse(localStorage.getItem('sukabumi-members') || '[]');

    if (members.some(member => member.phone === newMember.phone)) {
      toast({
        title: "Pendaftaran Gagal",
        description: "No. Handphone sudah terdaftar untuk member lain.",
        variant: "destructive",
      });
      return;
    }

    members.unshift(newMember);
    localStorage.setItem('sukabumi-members', JSON.stringify(members));

    addActivityLog(`Member baru '${newMember.childName}' ditambahkan.`);
    toast({
      title: "Pendaftaran Berhasil",
      description: "Member baru telah berhasil ditambahkan.",
    });
    router.push("/dashboard/members");
  };

  const handleCreateCardClick = () => {
    if (!branch || !childName || !barcode || !gender) {
        toast({
            title: "Data Tidak Lengkap",
            description: "Harap isi cabang, nama anak, jenis kelamin, dan pastikan barcode telah terbuat untuk membuat kartu.",
            variant: "destructive"
        });
        return;
    }
    
    setCurrentMemberData({
        registrationDate,
        expiryDate,
        branch,
        childName,
        barcode,
        gender,
        // The rest are just for type compatibility, not used by the card itself
        birthPlace: '',
        dateOfBirth: '',
        phone: '',
        address: '',
    });
    setIsCardDialogOpen(true);
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current || !currentMemberData) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, filter: fontFilter });
      const link = document.createElement('a');
      link.download = `kartu-member-${currentMemberData.childName.toLowerCase().replace(/\s/g, '-')}.png`;
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
    if (!cardRef.current || !currentMemberData) return;

    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, filter: fontFilter });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `kartu-member-${currentMemberData.childName.toLowerCase().replace(/\s/g, '-')}.png`, { type: blob.type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
        });
      } else {
        const link = document.createElement('a');
        link.download = `kartu-member-${currentMemberData.childName.toLowerCase().replace(/\s/g, '-')}.png`;
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
      <div className="flex justify-center items-start py-6">
        <Card className="w-full max-w-2xl">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Pendaftaran Member Baru</CardTitle>
              <CardDescription>
                Isi data di bawah ini untuk mendaftarkan member baru.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="registrationDate">Tanggal Pendaftaran</Label>
                <Input id="registrationDate" name="registrationDate" value={registrationDate} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="expiryDate">Tanggal Masa Berlaku</Label>
                <Input id="expiryDate" name="expiryDate" value={expiryDate} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="branch">Cabang Playground</Label>
                <Select onValueChange={setBranch} value={branch}>
                  <SelectTrigger id="branch">
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
                <Label htmlFor="childName">Nama Anak</Label>
                <Input id="childName" name="childName" placeholder="Contoh: Budi" required value={childName} onChange={(e) => setChildName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthPlace">Tempat Lahir</Label>
                <Input id="birthPlace" name="birthPlace" placeholder="Contoh: Jakarta" required />
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select onValueChange={setGender} value={gender}>
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
                <Label htmlFor="phone">No.Handphone Ortu</Label>
                <Input id="phone" name="phone" type="tel" placeholder="081234567890" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea id="address" name="address" placeholder="Masukkan alamat lengkap" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="barcode">Barcode Kartu</Label>
                <div className="flex gap-2">
                  <Input 
                    id="barcode" 
                    name="barcode" 
                    placeholder="Terisi otomatis setelah data lengkap" 
                    required 
                    value={barcode}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button type="submit" className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" /> Daftar Member
              </Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleCreateCardClick}>
                <CreditCard className="mr-2 h-4 w-4" /> Buat Kartu
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Pratinjau Kartu Member</DialogTitle>
                <DialogDescription>
                    Bagikan atau unduh kartu member di bawah ini.
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
                <MemberCard member={currentMemberData} cardRef={cardRef} />
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
