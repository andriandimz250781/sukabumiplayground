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
import { LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { addActivityLog } from "@/lib/logger";
import { useRouter } from 'next/navigation';

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

interface ActiveCustomer {
  childName: string;
  checkInTime: string;
  phone: string;
  checkInTimestamp: number;
  dailySequence: string;
  barcode?: string;
  isMember: boolean;
  discount: number;
}

interface Settings {
    ticketPrice: string;
    memberDiscount: string;
    openingHours: string;
}

export default function CheckInPage() {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [barcode, setBarcode] = useState('');
  const [childName, setChildName] = useState('');
  const [dailySequence, setDailySequence] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [memberDiscount, setMemberDiscount] = useState(0);
  const [settings, setSettings] = useState<Settings>({ ticketPrice: '25000', memberDiscount: '10', openingHours: '09:00 - 21:00'});
  const router = useRouter();
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

  const updateDailySequence = () => {
    const today = new Date().toISOString().split('T')[0];
    const sequenceDataRaw = localStorage.getItem('sukabumi-daily-sequence');
    let sequenceData;

    if (sequenceDataRaw) {
      try {
        sequenceData = JSON.parse(sequenceDataRaw);
        if (sequenceData.date !== today) {
          sequenceData = { date: today, nextNumber: 1 };
        }
      } catch (error) {
        sequenceData = { date: today, nextNumber: 1 };
      }
    } else {
      sequenceData = { date: today, nextNumber: 1 };
    }
    
    const formattedSequence = String(sequenceData.nextNumber).padStart(5, '0');
    setDailySequence(formattedSequence);
    
    localStorage.setItem('sukabumi-daily-sequence', JSON.stringify(sequenceData));
  };

  useEffect(() => {
    if (!isAuthorized) return;
    updateDailySequence();
    const storedSettingsRaw = localStorage.getItem('sukabumi-settings');
    if (storedSettingsRaw) {
        setSettings(JSON.parse(storedSettingsRaw));
    }
  }, [isAuthorized]);

  const clearMemberSpecificInfo = () => {
    // Keep child name if entered manually
    if (!phone && !barcode) {
        setChildName('');
    }
    setIsMember(false);
    setMemberDiscount(0);
  };
  
  const handleMemberLookup = (key: 'phone' | 'barcode', value: string) => {
    const membersData = localStorage.getItem('sukabumi-members');

    // Reset if value is cleared
    if (!value || !membersData) {
      if (key === 'phone') setBarcode('');
      if (key === 'barcode') setPhone('');
      clearMemberSpecificInfo();
      return;
    }

    const members: Member[] = JSON.parse(membersData);
    const member = members.find(m => m[key] === value);

    if (member) {
      setChildName(member.childName);
      setPhone(member.phone);
      setBarcode(member.barcode);
      setIsMember(true);
      setMemberDiscount(Number(settings.memberDiscount) || 0);
    } else {
      if (key === 'phone') setBarcode('');
      // Don't clear phone if barcode doesn't match, user might have typed it
      clearMemberSpecificInfo();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhone(newPhone);
    handleMemberLookup('phone', newPhone);
  };
  
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBarcode = e.target.value;
    setBarcode(newBarcode);
    handleMemberLookup('barcode', newBarcode);
  };


  const resetForm = () => {
    setPhone('');
    setBarcode('');
    setChildName('');
    setIsMember(false);
    setMemberDiscount(0);
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!childName) {
        toast({
            title: "Input Dibutuhkan",
            description: "Nama Anak wajib diisi. Cari member via No. HP atau Barcode untuk mengisinya otomatis.",
            variant: "destructive",
        });
        return;
    }
    
    const activeCustomersData = localStorage.getItem('sukabumi-active-customers') || '[]';
    const activeCustomers: ActiveCustomer[] = JSON.parse(activeCustomersData);

    if (isMember && barcode && activeCustomers.some((c: any) => c.barcode === barcode)) {
        toast({
            title: "Sudah Check-in",
            description: `Member ${childName} sudah berada di area bermain.`,
            variant: "destructive"
        });
        return;
    }
    
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const newActiveCustomer: ActiveCustomer = {
        childName: childName,
        checkInTime: checkInTime,
        phone: phone,
        checkInTimestamp: now.getTime(),
        dailySequence: dailySequence,
        barcode: barcode,
        isMember: isMember,
        discount: isMember ? memberDiscount : 0,
    };
    
    activeCustomers.unshift(newActiveCustomer);
    localStorage.setItem('sukabumi-active-customers', JSON.stringify(activeCustomers));

    addActivityLog(`Check-in: ${childName} (Tiket: ${dailySequence}, ${isMember ? 'Member' : 'Tamu'}).`);
    window.dispatchEvent(new Event('storage'));

    const today = new Date().toISOString().split('T')[0];
    const sequenceDataRaw = localStorage.getItem('sukabumi-daily-sequence');
    let sequenceData = JSON.parse(sequenceDataRaw || '{}');
    if (sequenceData.date !== today) {
        sequenceData = { date: today, nextNumber: 1 };
    }
    sequenceData.nextNumber += 1;
    localStorage.setItem('sukabumi-daily-sequence', JSON.stringify(sequenceData));

    toast({
      title: "Check-in Berhasil",
      description: `${childName} (Tiket: ${dailySequence}) telah check-in. Data transaksi aktif kini tersedia di Kasir.`,
    });
    
    resetForm();
    updateDailySequence();
  };
  
  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Memeriksa otorisasi...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start py-6">
      <Card className="w-full max-w-md">
        <form onSubmit={handleCheckIn}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Check-In Arena Bermain</CardTitle>
            <CardDescription>
              Cari member via No. Handphone atau check-in sebagai tamu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">No. Handphone Member</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Isi untuk mencari member terdaftar"
                value={phone}
                onChange={handlePhoneChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">No. Barcode Kartu</Label>
              <Input
                id="barcode"
                name="barcode"
                type="text"
                placeholder="Scan atau ketik manual"
                value={barcode}
                onChange={handleBarcodeChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childName">Nama Anak</Label>
              <Input
                id="childName"
                name="childName"
                type="text"
                placeholder="Wajib diisi untuk tamu / non-member"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                readOnly={isMember}
                className={isMember ? 'bg-muted' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailySequence">No. Urut Harian</Label>
              <Input
                id="dailySequence"
                name="dailySequence"
                type="text"
                placeholder="00001"
                value={dailySequence}
                readOnly
                className="bg-muted font-bold"
              />
            </div>
            {isMember && (
                <div className="space-y-2">
                    <Label htmlFor="memberDiscount">Diskon Member (%)</Label>
                    <Input
                        id="memberDiscount"
                        name="memberDiscount"
                        type="text"
                        value={memberDiscount}
                        readOnly
                        className="bg-muted font-bold"
                    />
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-4 w-4" /> Check-In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
