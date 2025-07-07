'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Selamat Datang</CardTitle>
          <CardDescription>
            Aplikasi Asisten untuk Sukabumi Playground
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            Silakan masuk untuk mengakses dasbor atau daftar jika Anda adalah karyawan baru.
          </p>
          <div className="flex flex-col gap-4">
            <Button asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/signup">Daftar Akun Baru</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
