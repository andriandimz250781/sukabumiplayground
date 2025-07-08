'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

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
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [initials, setInitials] = useState('');

    useEffect(() => {
        const userJson = sessionStorage.getItem('sukabumi-active-user');
        if (userJson) {
            const userData = JSON.parse(userJson);
            setUser(userData);
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

    if (!user) {
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
                            <CardTitle className="text-2xl">{user.fullname}</CardTitle>
                            <CardDescription>
                                {user.role === 'admin' ? 'IT Administrator' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">ID Karyawan</p>
                        <p>{user.role === 'admin' ? 'IT ADMINISTRATOR' : user.employeeId}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">No. Handphone</p>
                        <p>{user.phone}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Tanggal Lahir</p>
                        <p>{user.dateOfBirth}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Tanggal Registrasi</p>
                        <p>{user.registrationDate} {user.registrationTime}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Alamat KTP</p>
                        <p>{user.address}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Alamat Saat Ini</p>
                        <p>{user.currentAddress}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
