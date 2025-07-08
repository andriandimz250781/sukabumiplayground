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
import { Pencil, Save } from "lucide-react";
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

        // If the new password field is filled, user is trying to change their password
        if (newPassword) {
            // Check if the current password is correct
            if (user.password !== currentPassword) {
                toast({
                    title: "Gagal Menyimpan",
                    description: "Password saat ini yang Anda masukkan salah.",
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
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                                <Input 
                                    id="currentPassword" 
                                    name="currentPassword" 
                                    type="password"
                                    placeholder="Isi untuk ubah password" 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="newPassword">Password Baru (opsional)</Label>
                                <Input 
                                    id="newPassword" 
                                    name="newPassword" 
                                    type="password"
                                    placeholder="Isi password baru" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengubah.</p>
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
