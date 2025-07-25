
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, Eye, EyeOff } from "lucide-react";
import { addActivityLog } from "@/lib/logger";

interface User {
  fullname: string;
  employeeId: string;
  role: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  currentAddress: string;
  registrationDate?: string;
  registrationTime?: string;
  password?: string;
}

export default function ProfilePage() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [initials, setInitials] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<User | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    
    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);


    useEffect(() => {
        const userJson = sessionStorage.getItem('sukabumi-active-user');
        if (userJson) {
            const userData = JSON.parse(userJson);
            setUser(userData);
            setFormData(userData);
            if (userData.fullname) {
                 const nameInitials = userData.fullname
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
                setInitials(nameInitials);
            }
        }
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (formData) {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSave = () => {
        if (!formData || !user) return;

        let passwordToSave = user.password;

        if (newPassword) {
            if (user.password !== currentPassword) {
                toast({
                    title: "Gagal Menyimpan",
                    description: "Password saat ini yang Anda masukkan salah.",
                    variant: "destructive",
                });
                return;
            }
            if (newPassword !== confirmNewPassword) {
                 toast({
                    title: "Gagal Menyimpan",
                    description: "Password baru dan konfirmasi password tidak cocok.",
                    variant: "destructive",
                });
                return;
            }
            passwordToSave = newPassword;
        }

        const usersData = localStorage.getItem('sukabumi-users');
        if (usersData) {
            let users: User[] = JSON.parse(usersData);
            const userIndex = users.findIndex(u => u.employeeId === formData.employeeId);
            if (userIndex !== -1) {
                const userToSave = { ...formData, password: passwordToSave };

                users[userIndex] = userToSave;
                localStorage.setItem('sukabumi-users', JSON.stringify(users));
                sessionStorage.setItem('sukabumi-active-user', JSON.stringify(userToSave));

                setUser(userToSave);
                setFormData(userToSave);

                addActivityLog(`Profil diperbarui oleh ${formData.fullname}`);
                toast({
                    title: "Profil Diperbarui",
                    description: "Informasi profil Anda telah berhasil disimpan.",
                });
                setIsEditing(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmNewPassword(false);

            } else {
                 toast({
                    title: "Gagal Menyimpan",
                    description: "Pengguna tidak ditemukan di database.",
                    variant: "destructive",
                });
            }
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(user);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);
    }

    if (!user || !formData) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Loading profile...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Profil Pengguna</h1>
                <p className="text-muted-foreground">Lihat dan kelola informasi profil Anda.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src="https://placehold.co/80x80.png" alt="Avatar" data-ai-hint="avatar person" />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            {isEditing ? (
                                <Input
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleInputChange}
                                    className="text-2xl font-bold"
                                />
                            ) : (
                                <CardTitle className="text-2xl">{user.fullname}</CardTitle>
                            )}
                             <CardDescription>
                                {user.role === 'admin' ? 'IT Administrator' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                        <Label>ID Karyawan</Label>
                        <p className="p-2 h-10 border rounded-md bg-muted flex items-center">{user.role === 'admin' ? 'IT ADMINISTRATOR' : user.employeeId}</p>
                    </div>
                     <div className="space-y-1">
                        <Label>Tanggal Registrasi</Label>
                        <p className="p-2 h-10 border rounded-md bg-muted flex items-center">{user.registrationDate} {user.registrationTime}</p>
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="phone">No. Handphone</Label>
                        {isEditing ? (
                            <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                        ) : (
                            <p className="p-2 h-10 border rounded-md bg-muted flex items-center">{user.phone}</p>
                        )}
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                         {isEditing ? (
                            <Input id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} placeholder="DD-MM-YYYY" />
                        ) : (
                            <p className="p-2 h-10 border rounded-md bg-muted flex items-center">{user.dateOfBirth}</p>
                        )}
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <Label htmlFor="address">Alamat KTP</Label>
                         {isEditing ? (
                            <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} />
                        ) : (
                            <p className="p-2 min-h-[80px] border rounded-md bg-muted flex items-center">{user.address}</p>
                        )}
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <Label htmlFor="currentAddress">Alamat Saat Ini</Label>
                         {isEditing ? (
                            <Textarea id="currentAddress" name="currentAddress" value={formData.currentAddress} onChange={handleInputChange} />
                        ) : (
                            <p className="p-2 min-h-[80px] border rounded-md bg-muted flex items-center">{user.currentAddress}</p>
                        )}
                    </div>
                     {isEditing && (
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                           <div className="space-y-1 md:col-span-2">
                                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                                <div className="relative">
                                    <Input 
                                        id="currentPassword" 
                                        name="currentPassword" 
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="Isi untuk mengubah password" 
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute inset-y-0 right-0 h-full px-3"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        tabIndex={-1}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="newPassword">Password Baru (opsional)</Label>
                                <div className="relative">
                                    <Input 
                                        id="newPassword" 
                                        name="newPassword" 
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Isi password baru" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute inset-y-0 right-0 h-full px-3"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        tabIndex={-1}
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengubah.</p>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="confirmNewPassword">Ulangi Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmNewPassword"
                                        name="confirmNewPassword"
                                        type={showConfirmNewPassword ? "text" : "password"}
                                        placeholder="Ulangi password baru"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        disabled={!newPassword}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute inset-y-0 right-0 h-full px-3"
                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                        tabIndex={-1}
                                        disabled={!newPassword}
                                    >
                                        {showConfirmNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-end">
                    {isEditing ? (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancel}>Batal</Button>
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4"/> Simpan Perubahan
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4"/> Edit Profil
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
