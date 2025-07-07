'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { MemberCard } from '@/components/member-card';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function MemberCardPage() {
  const params = useParams();
  const { toast } = useToast();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const downloadTriggered = useRef(false);

  useEffect(() => {
    if (params.barcode) {
      const decodedBarcode = decodeURIComponent(params.barcode as string);
      const membersData = localStorage.getItem('sukabumi-members');
      if (membersData) {
        const members: Member[] = JSON.parse(membersData);
        const foundMember = members.find(m => m.barcode === decodedBarcode);
        if (foundMember) {
          setMember(foundMember);
        } else {
          setError('Member tidak ditemukan.');
        }
      } else {
        setError('Data member tidak ditemukan. Silakan coba lagi dari perangkat utama.');
      }
    } else {
      setError('Barcode tidak valid.');
    }
    setLoading(false);
  }, [params.barcode]);

  useEffect(() => {
    if (member && cardRef.current && !downloadTriggered.current) {
      downloadTriggered.current = true; // Prevent multiple downloads
      
      // Give the component a moment to render fully before capturing
      const timer = setTimeout(() => {
        toPng(cardRef.current!, { cacheBust: true, pixelRatio: 2, filter: fontFilter })
        .then((dataUrl: string) => {
            const link = document.createElement('a');
            link.download = `kartu-member-${member.childName.toLowerCase().replace(/\s/g, '-')}.png`;
            link.href = dataUrl;
            link.click();
            toast({
              title: 'Unduhan Dimulai',
              description: 'Kartu member sedang diunduh.',
            });
          })
          .catch((err: unknown) => {
            console.error('Gagal membuat gambar kartu:', err);
            toast({
              title: 'Gagal Mengunduh Kartu',
              description: 'Terjadi kesalahan saat membuat gambar kartu.',
              variant: 'destructive',
            });
          });
      }, 500); // 500ms delay

      return () => clearTimeout(timer);
    }
  }, [member, toast]);

  const renderContent = () => {
    if (loading) {
      return <p>Memuat kartu member...</p>;
    }
    if (error) {
      return (
         <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      );
    }
    if (member) {
      return (
        <div>
          <p className="mb-4 text-center text-muted-foreground">Mempersiapkan unduhan...</p>
          <MemberCard member={member} cardRef={cardRef} />
        </div>
      );
    }
    return null;
  }
  
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      {renderContent()}
    </div>
  );
}
