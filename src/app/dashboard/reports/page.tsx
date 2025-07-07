'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState, useRef } from "react";
import { format, isToday, isThisWeek, isThisMonth, isThisYear } from "date-fns";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Eye, Printer, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toPng } from 'html-to-image';
import { useRouter } from "next/navigation";


// Define interfaces for transaction data
interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}
interface Transaction {
  id: string;
  date: string;
  customerName: string;
  cashierName: string;
  totalAmount: number;
  playCost: number;
  orderCost: number;
  paymentMethod: string;
  bankName?: string;
  duration: string;
  cashReceived?: number;
  changeGiven?: number;
  isMember: boolean;
  discountAmount?: number;
  orders?: OrderItem[];
}

const fontFilter = (node: HTMLElement) => {
  return !(node.tagName === 'LINK' && (node as HTMLLinkElement).href.includes('fonts.googleapis.com'));
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
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

  const loadTransactions = () => {
    const data = localStorage.getItem('sukabumi-transactions');
    if (data) {
      const parsedData = JSON.parse(data);
      setTransactions(parsedData);
    } else {
      setTransactions([]);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    loadTransactions();
    window.addEventListener('storage', loadTransactions);
    return () => {
      window.removeEventListener('storage', loadTransactions);
    };
  }, [isAuthorized]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    const results = transactions
      .filter(item => {
        const transactionDate = new Date(item.date);
        switch (filter) {
          case 'today':
            return isToday(transactionDate);
          case 'week':
            return isThisWeek(transactionDate, { weekStartsOn: 1 }); // Start week on Monday
          case 'month':
            return isThisMonth(transactionDate);
          case 'year':
            return isThisYear(transactionDate);
          case 'all':
          default:
            return true;
        }
      })
      .filter(item => {
        if (!searchTerm) return true;
        const searchableString = [
          item.id,
          item.customerName,
          item.cashierName,
          item.paymentMethod,
          item.bankName,
          format(new Date(item.date), 'dd-MM-yyyy HH:mm')
        ].join(' ').toLowerCase();
        return searchableString.includes(lowercasedSearchTerm);
      });

    setFilteredTransactions(results);
  }, [searchTerm, transactions, filter]);
  
  const handleResetTransactions = () => {
    localStorage.removeItem('sukabumi-transactions');
    setTransactions([]);
    toast({
      title: "Riwayat Transaksi Dihapus",
      description: "Semua data riwayat transaksi telah dihapus.",
    });
  };

  const formatCurrency = (amount?: number) => `Rp ${(amount || 0).toLocaleString('id-ID')}`;
  
  // Handlers for dialog actions
  const handleOpenPreview = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setIsPreviewOpen(true);
  };
  
  const handleDownloadReceipt = async () => {
    if (!receiptRef.current || !selectedTransaction) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white', filter: fontFilter });
      const link = document.createElement('a');
      link.download = `struk-transaksi-${selectedTransaction.id}.png`;
      link.href = dataUrl;
      link.click();
      toast({
        title: "Struk Disiapkan",
        description: "Struk transaksi sedang diunduh.",
      });
    } catch (err) {
      console.error('Gagal membuat struk:', err);
      toast({
        title: "Gagal Mengunduh",
        description: "Terjadi kesalahan saat membuat gambar struk.",
        variant: "destructive",
      });
    }
  };

  const handleShareReceipt = async () => {
    if (!receiptRef.current || !selectedTransaction) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white', filter: fontFilter });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `struk-transaksi-${selectedTransaction.id}.png`, { type: blob.type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Struk Transaksi ${selectedTransaction.id}`,
        });
      } else {
        handleDownloadReceipt(); // Fallback to download
        toast({
            title: "Fitur Share Tidak Didukung",
            description: "Unduhan struk dimulai sebagai gantinya.",
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Gagal membagikan struk:', err);
        toast({
            title: "Gagal Membagikan",
            description: "Terjadi kesalahan saat mencoba membagikan struk.",
            variant: "destructive",
        });
      }
    }
  };
  
  const handlePrintReceipt = () => {
    const node = receiptRef.current;
    if (!node) return;

    const printContainer = document.createElement('div');
    printContainer.id = 'print-mount';
    
    const contentToPrint = node.cloneNode(true) as HTMLElement;
    
    printContainer.appendChild(contentToPrint);
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);

    toast({
      title: "Copy Struk berhasil di Print",
    });
    setIsPreviewOpen(false);
  };


  const getPaymentMethodBadge = (method: string) => {
    switch(method) {
        case 'Cash': return <Badge variant="secondary" className="bg-green-100 text-green-800">{method}</Badge>;
        case 'Debit': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{method}</Badge>;
        case 'Kartu': return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Kartu Kredit</Badge>;
        case 'QRIS': return <Badge variant="secondary" className="bg-purple-100 text-purple-800">{method}</Badge>;
        default: return <Badge variant="outline">{method}</Badge>;
    }
  }

  const getFilterDescription = () => {
      switch(filter) {
          case 'today': return `Menampilkan ${filteredTransactions.length} transaksi untuk hari ini.`;
          case 'week': return `Menampilkan ${filteredTransactions.length} transaksi untuk minggu ini.`;
          case 'month': return `Menampilkan ${filteredTransactions.length} transaksi untuk bulan ini.`;
          case 'year': return `Menampilkan ${filteredTransactions.length} transaksi untuk tahun ini.`;
          default: return `Total ${transactions.length} transaksi tercatat.`;
      }
  }
  
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
              <h1 className="text-2xl font-bold font-headline">Laporan Transaksi</h1>
              <p className="text-muted-foreground">Lihat riwayat semua transaksi.</p>
          </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset Transaksi
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus semua riwayat transaksi secara permanen. Data ini tidak dapat dipulihkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetTransactions}>
                    Ya, Hapus Riwayat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Transaksi</CardTitle>
            <CardDescription>
              {getFilterDescription()}
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-4 items-center">
              <div className="relative flex-grow w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Cari berdasarkan No. Struk, Customer, Kasir..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex gap-1 flex-wrap justify-center sm:justify-end shrink-0">
                  <Button size="sm" variant={filter === 'today' ? 'default' : 'outline'} onClick={() => setFilter('today')}>Hari Ini</Button>
                  <Button size="sm" variant={filter === 'week' ? 'default' : 'outline'} onClick={() => setFilter('week')}>Minggu Ini</Button>
                  <Button size="sm" variant={filter === 'month' ? 'default' : 'outline'} onClick={() => setFilter('month')}>Bulan Ini</Button>
                  <Button size="sm" variant={filter === 'year' ? 'default' : 'outline'} onClick={() => setFilter('year')}>Tahun Ini</Button>
                  <Button size="sm" variant={filter === 'all' ? 'secondary' : 'outline'} onClick={() => setFilter('all')}>Semua</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Struk</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Kasir</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Biaya Main</TableHead>
                    <TableHead>Diskon</TableHead>
                    <TableHead>Biaya Pesanan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pembayaran</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Lihat Struk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.id}</TableCell>
                        <TableCell>{format(new Date(tx.date), 'dd-MM-yyyy HH:mm')}</TableCell>
                        <TableCell>{tx.customerName}</TableCell>
                        <TableCell>{tx.cashierName}</TableCell>
                        <TableCell>{tx.duration}</TableCell>
                        <TableCell>{formatCurrency(tx.playCost)}</TableCell>
                        <TableCell>{tx.discountAmount ? formatCurrency(tx.discountAmount) : '-'}</TableCell>
                        <TableCell>{formatCurrency(tx.orderCost)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(tx.totalAmount)}</TableCell>
                        <TableCell>{getPaymentMethodBadge(tx.paymentMethod)}</TableCell>
                        <TableCell className="text-xs">
                            {tx.paymentMethod === 'Cash' && `Tunai: ${formatCurrency(tx.cashReceived)}, Kembali: ${formatCurrency(tx.changeGiven)}`}
                            {(tx.paymentMethod === 'Debit' || tx.paymentMethod === 'Kartu' || tx.paymentMethod === 'QRIS') && tx.bankName}
                        </TableCell>
                        <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleOpenPreview(tx)}>
                                <Eye className="mr-2 h-4 w-4"/> Lihat
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} className="h-24 text-center">
                        Tidak ada riwayat transaksi yang cocok dengan filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-xs p-0 flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 pb-0 shrink-0">
                <DialogTitle>Struk Transaksi</DialogTitle>
                <DialogDescription>
                    Pratinjau struk untuk transaksi #{selectedTransaction?.id}.
                </DialogDescription>
            </DialogHeader>
            <div className="p-6 pt-2 overflow-y-auto flex-grow">
              <div ref={receiptRef} className="p-4 bg-white text-black shadow-lg w-full font-mono text-xs">
                  <div className="text-center mb-2">
                    <h3 className="text-sm font-bold font-headline">Sukabumi Playground</h3>
                    <p>Jl. Raya Cemerlang No. 123, Sukabumi</p>
                  </div>
                  <Separator className="my-2 border-dashed border-black" />
                  {selectedTransaction && (
                    <>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        <span className="font-medium">No. Struk:</span>
                        <span>{selectedTransaction.id}</span>
                        
                        <span className="font-medium">Tanggal:</span>
                        <span>{format(new Date(selectedTransaction.date), 'dd-MM-yyyy')}</span>

                        <span className="font-medium">Waktu:</span>
                        <span>{format(new Date(selectedTransaction.date), 'HH:mm')}</span>
                        
                        <span className="font-medium">Durasi:</span>
                        <span>{selectedTransaction.duration}</span>

                        <span className="font-medium">Customer:</span>
                        <span>{selectedTransaction.customerName}</span>
                        
                        <span className="font-medium">Kasir:</span>
                        <span>{selectedTransaction.cashierName}</span>
                      </div>
                      <Separator className="my-2 border-dashed border-black" />
                      <div className="space-y-0.5">
                        <div className="flex justify-between">
                          <span>Waktu Bermain ({selectedTransaction.duration})</span>
                          <span>{formatCurrency(selectedTransaction.playCost)}</span>
                        </div>
                        {selectedTransaction.discountAmount && selectedTransaction.discountAmount > 0 && (
                          <div className="flex justify-between">
                              <span>Diskon Member</span>
                              <span>-{formatCurrency(selectedTransaction.discountAmount)}</span>
                          </div>
                        )}
                        {selectedTransaction.orders && selectedTransaction.orders.length > 0 && (
                          <>
                            {selectedTransaction.orders.map((item) => (
                                <div key={item.id} className="flex justify-between">
                                  <span>{item.name} x{item.qty}</span>
                                  <span>{formatCurrency(item.price * item.qty)}</span>
                                </div>
                            ))}
                          </>
                        )}
                      </div>
                      <Separator className="my-2 border-dashed border-black" />
                      <div className="space-y-0.5 font-medium">
                          <div className="flex justify-between font-bold text-sm">
                              <span>TOTAL</span>
                              <span>{formatCurrency(selectedTransaction.totalAmount)}</span>
                          </div>
                          {selectedTransaction.paymentMethod === 'Cash' && (
                          <>
                              <div className="flex justify-between text-xs pt-1">
                                  <span>Tunai</span>
                                  <span>{formatCurrency(selectedTransaction.cashReceived)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                  <span>Kembali</span>
                                  <span>{formatCurrency(selectedTransaction.changeGiven)}</span>
                              </div>
                          </>
                          )}
                          {(selectedTransaction.paymentMethod === 'Debit' || selectedTransaction.paymentMethod === 'Kartu' || selectedTransaction.paymentMethod === 'QRIS') && (
                              <div className="flex justify-between text-xs pt-1">
                                  <span>{selectedTransaction.paymentMethod === 'Kartu' ? 'Kartu Kredit' : selectedTransaction.paymentMethod}</span>
                                  <span>{selectedTransaction.bankName}</span>
                              </div>
                          )}
                      </div>
                      <div className="text-center mt-4">
                        <p>Terima kasih atas kunjungan Anda!</p>
                      </div>
                    </>
                  )}
              </div>
            </div>
            <DialogFooter className="p-6 pt-0 flex-col sm:flex-row sm:justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={handleDownloadReceipt}>
                  <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button variant="outline" onClick={handleShareReceipt}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button variant="default" onClick={handlePrintReceipt}>
                  <Printer className="mr-2 h-4 w-4" /> Cetak
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
