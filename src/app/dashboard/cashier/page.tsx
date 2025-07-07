
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import { Eye, Download, Share2, Printer } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { toPng } from 'html-to-image';
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addActivityLog } from '@/lib/logger';
import { useRouter } from 'next/navigation';


interface ActiveCustomer {
  dailySequence: string;
  phone: string;
  childName: string;
  checkInTime: string;
  checkInTimestamp: number;
  barcode?: string;
  isMember: boolean;
  discount: number;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  price: number;
  stock: number;
  category: 'makanan' | 'minuman' | 'barang';
}

const fontFilter = (node: HTMLElement) => {
  return !(node.tagName === 'LINK' && (node as HTMLLinkElement).href.includes('fonts.googleapis.com'));
};

const calculateDuration = (checkInTimestamp: number, now: number): string => {
  if (!checkInTimestamp || !now) return '-';
  const diff = now - checkInTimestamp;

  const totalMinutes = Math.floor(diff / 60000);
  if (totalMinutes < 1) return '< 1 menit';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  return `${minutes} menit`;
};

export default function CashierPage() {
  const [activeCustomers, setActiveCustomers] = useState<ActiveCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ActiveCustomer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const transactionRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);


  // State for transaction calculation
  const [hourlyRate, setHourlyRate] = useState(25000);
  const [totalTransaction, setTotalTransaction] = useState(0);
  const [checkOutTime, setCheckOutTime] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [allOrders, setAllOrders] = useState<Record<string, OrderItem[]>>({});
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [change, setChange] = useState(0);
  const [cashierName, setCashierName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedQrisProvider, setSelectedQrisProvider] = useState('');
  const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false);

  // New state for detailed calculation
  const [playCost, setPlayCost] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderCost, setOrderCost] = useState(0);

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


  const loadData = () => {
    const data = localStorage.getItem('sukabumi-active-customers');
    if (data) {
      const customers = JSON.parse(data).sort((a: ActiveCustomer, b: ActiveCustomer) => b.checkInTimestamp - a.checkInTimestamp);
      setActiveCustomers(customers);
    } else {
      setActiveCustomers([]);
    }
    const detailedOrdersData = localStorage.getItem('sukabumi-customer-orders');
    const allOrdersData = detailedOrdersData ? JSON.parse(detailedOrdersData) : {};
    setAllOrders(allOrdersData);
    
    const settingsData = localStorage.getItem('sukabumi-settings');
    if (settingsData) {
        const settings = JSON.parse(settingsData);
        setHourlyRate(Number(settings.ticketPrice) || 25000);
    }
  };
    

  useEffect(() => {
    if (!isAuthorized) return;
    
    // Set initial time on client to avoid hydration mismatch
    setCurrentTime(new Date());
    loadData();

    const userJson = sessionStorage.getItem('sukabumi-active-user');
    if (userJson) {
      const user = JSON.parse(userJson);
      setCashierName(user.fullname || 'N/A');
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update duration every minute
    
    window.addEventListener('storage', loadData);
    return () => {
        window.removeEventListener('storage', loadData);
        clearInterval(timer);
    };
  }, [isAuthorized]);

  useEffect(() => {
    if (isDialogOpen && selectedCustomer) {
      const now = new Date();
      const checkInTimestamp = selectedCustomer.checkInTimestamp;
      const durationMs = now.getTime() - checkInTimestamp;
      
      const billableHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));

      const calculatedPlayCost = billableHours * hourlyRate;
      const calculatedDiscount = selectedCustomer.isMember ? calculatedPlayCost * (selectedCustomer.discount / 100) : 0;
      
      const customerOrdersData = allOrders[selectedCustomer.dailySequence];
      const customerOrders = Array.isArray(customerOrdersData) ? customerOrdersData : [];
      const calculatedOrderCost = customerOrders.reduce((sum, item) => sum + (item.price * item.qty), 0);
      
      const total = (calculatedPlayCost - calculatedDiscount) + calculatedOrderCost;

      setPlayCost(calculatedPlayCost);
      setDiscountAmount(calculatedDiscount);
      setOrderCost(calculatedOrderCost);
      setTotalTransaction(total);
      
      setCheckOutTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      setTotalDuration(calculateDuration(checkInTimestamp, now.getTime()));
      setSelectedCustomerOrders(customerOrders);
    }
  }, [isDialogOpen, selectedCustomer, hourlyRate, currentTime, allOrders]);

  useEffect(() => {
    if (paymentMethod !== 'Cash') {
      setCashAmount('');
    }
    if (paymentMethod !== 'Debit' && paymentMethod !== 'Kartu') {
      setSelectedBank('');
    }
    if (paymentMethod !== 'QRIS') {
      setSelectedQrisProvider('');
    }
  }, [paymentMethod]);

  useEffect(() => {
    const parsedCash = parseFloat(cashAmount);
    if (paymentMethod === 'Cash' && !isNaN(parsedCash) && parsedCash > 0) {
      setChange(Math.max(0, parsedCash - totalTransaction));
    } else {
      setChange(0);
    }
  }, [cashAmount, totalTransaction, paymentMethod]);


  const handleViewTransactionClick = (customer: ActiveCustomer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedCustomer(null);
      setPaymentMethod('');
      setCashAmount('');
      setChange(0);
      setSelectedBank('');
      setSelectedQrisProvider('');
    }
  }

  const handleDownloadTransactionAsImage = async () => {
    if (!transactionRef.current || !selectedCustomer) return;
    try {
      const dataUrl = await toPng(transactionRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white', filter: fontFilter });
      const link = document.createElement('a');
      link.download = `struk-transaksi-${selectedCustomer.dailySequence}.png`;
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

  const handleShareTransaction = async () => {
    if (!transactionRef.current || !selectedCustomer) return;
    try {
      const dataUrl = await toPng(transactionRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white', filter: fontFilter });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `struk-transaksi-${selectedCustomer.dailySequence}.png`, { type: blob.type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Struk Transaksi ${selectedCustomer.dailySequence}`,
        });
      } else {
        handleDownloadTransactionAsImage(); // Fallback to download
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

  const handleOpenPrintConfirm = () => {
    if (!paymentMethod) {
      toast({
        title: "Pembayaran Belum Dipilih",
        description: "Silakan pilih metode pembayaran untuk menyelesaikan transaksi.",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === 'Cash' && (isNaN(parseFloat(cashAmount)) || parseFloat(cashAmount) < totalTransaction)) {
      toast({
        title: "Jumlah Uang Kurang",
        description: "Jumlah uang tunai yang dimasukkan kurang dari total transaksi.",
        variant: "destructive",
      });
      return;
    }
    
    if ((paymentMethod === 'Debit' || paymentMethod === 'Kartu') && !selectedBank) {
      toast({
        title: "Bank Belum Dipilih",
        description: "Silakan pilih bank yang digunakan untuk transaksi.",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === 'QRIS' && !selectedQrisProvider) {
      toast({
        title: "Penyedia QRIS Belum Dipilih",
        description: "Silakan pilih penyedia layanan QRIS yang digunakan.",
        variant: "destructive"
      });
      return;
    }
    
    setIsPrintConfirmOpen(true);
  };

  const handleFinalizeAndPrint = () => {
    const node = transactionRef.current;
    if (!node || !selectedCustomer) {
      return;
    }

    // 1. Save Transaction to localStorage
    const transactions = JSON.parse(localStorage.getItem('sukabumi-transactions') || '[]');
    const newTransaction = {
      id: selectedCustomer.dailySequence,
      date: new Date().toISOString(),
      customerName: selectedCustomer.childName,
      totalAmount: totalTransaction,
      playCost: playCost,
      orderCost: orderCost,
      discountAmount: discountAmount,
      discountPercentage: selectedCustomer.discount,
      isMember: selectedCustomer.isMember,
      orders: selectedCustomerOrders,
      paymentMethod: paymentMethod,
      bankName: (paymentMethod === 'Debit' || paymentMethod === 'Kartu') ? selectedBank : (paymentMethod === 'QRIS' ? selectedQrisProvider : undefined),
      duration: totalDuration,
      cashierName: cashierName,
      cashReceived: paymentMethod === 'Cash' ? parseFloat(cashAmount) : undefined,
      changeGiven: paymentMethod === 'Cash' ? change : undefined,
    };
    transactions.unshift(newTransaction);
    localStorage.setItem('sukabumi-transactions', JSON.stringify(transactions));

    addActivityLog(`Transaksi #${newTransaction.id} (${newTransaction.customerName}) senilai Rp ${totalTransaction.toLocaleString('id-ID')} diselesaikan.`);

    // Deduct stock from inventory
    const inventoryData = localStorage.getItem('sukabumi-inventory');
    if (inventoryData && selectedCustomerOrders.length > 0) {
      let inventory: InventoryItem[] = JSON.parse(inventoryData);
      selectedCustomerOrders.forEach(orderItem => {
        const inventoryItemIndex = inventory.findIndex(invItem => invItem.id === orderItem.id);
        if (inventoryItemIndex > -1) {
          inventory[inventoryItemIndex].stock -= orderItem.qty;
        }
      });
      localStorage.setItem('sukabumi-inventory', JSON.stringify(inventory));
    }

    // 2. Checkout customer (remove from active list & orders)
    const currentActiveCustomers = JSON.parse(localStorage.getItem('sukabumi-active-customers') || '[]');
    const updatedCustomers = currentActiveCustomers.filter((c: ActiveCustomer) => c.dailySequence !== selectedCustomer.dailySequence);
    localStorage.setItem('sukabumi-active-customers', JSON.stringify(updatedCustomers));
    
    const ordersData = localStorage.getItem('sukabumi-customer-orders');
    if (ordersData) {
        const orders = JSON.parse(ordersData);
        if (orders[selectedCustomer.dailySequence]) {
            delete orders[selectedCustomer.dailySequence];
            localStorage.setItem('sukabumi-customer-orders', JSON.stringify(orders));
        }
    }

    // 3. Dispatch storage event to notify other pages
    window.dispatchEvent(new Event('storage'));
    
    toast({
        title: "Transaksi Berhasil",
        description: `Transaksi untuk ${selectedCustomer.childName} sebesar Rp ${totalTransaction.toLocaleString('id-ID')} telah selesai.`,
    });
    
    // 4. Print
    const printContainer = document.createElement('div');
    printContainer.id = 'print-mount';
    
    const contentToPrint = node.cloneNode(true) as HTMLElement;
    contentToPrint.style.maxHeight = 'none';
    
    printContainer.appendChild(contentToPrint);
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);

    // 5. Close dialogs and reset state
    setIsPrintConfirmOpen(false);
    handleDialogOpenChange(false);
  };
  
  let isFinalizeDisabled = !paymentMethod;
  if (paymentMethod === 'Cash') {
    isFinalizeDisabled = isNaN(parseFloat(cashAmount)) || parseFloat(cashAmount) < totalTransaction;
  } else if (paymentMethod === 'Debit' || paymentMethod === 'Kartu') {
    isFinalizeDisabled = !selectedBank;
  } else if (paymentMethod === 'QRIS') {
    isFinalizeDisabled = !selectedQrisProvider;
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
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline text-2xl">Transaksi Kasir</CardTitle>
                  <CardDescription>
                      Daftar customer yang sedang aktif. Klik baris untuk melihat detail transaksi.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>No. Struk</TableHead>
                              <TableHead>No. Handphone</TableHead>
                              <TableHead>Nama Pelanggan</TableHead>
                              <TableHead>Tarif Per-Jam</TableHead>
                              <TableHead>Jam Check In</TableHead>
                              <TableHead>Jam Check Out</TableHead>
                              <TableHead>Total Waktu</TableHead>
                              <TableHead>Tambahan Lainnya</TableHead>
                              <TableHead>Diskon Member</TableHead>
                              <TableHead>Total Transaksi</TableHead>
                              <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {activeCustomers.length > 0 && currentTime ? (
                              activeCustomers.map((customer) => {
                                const customerOrdersData = allOrders[customer.dailySequence];
                                const customerOrders = Array.isArray(customerOrdersData) ? customerOrdersData : [];
                                const orderAmount = customerOrders.reduce((sum, item) => sum + (item.price * item.qty), 0);
                                
                                const now = currentTime.getTime();
                                const checkInTimestamp = customer.checkInTimestamp;
                                const durationMs = now - checkInTimestamp;
                                const billableHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
                                const grossPlayCost = billableHours * hourlyRate;
                                const customerDiscount = customer.isMember ? grossPlayCost * (customer.discount / 100) : 0;
                                const liveTotalTransaction = (grossPlayCost - customerDiscount) + orderAmount;

                                return (
                                  <TableRow key={customer.dailySequence} onClick={() => handleViewTransactionClick(customer)} className="cursor-pointer">
                                      <TableCell>{new Date(customer.checkInTimestamp).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})}</TableCell>
                                      <TableCell className="font-medium">{customer.dailySequence}</TableCell>
                                      <TableCell>{customer.phone || ''}</TableCell>
                                      <TableCell>{customer.childName}</TableCell>
                                      <TableCell>Rp {hourlyRate.toLocaleString('id-ID')}</TableCell>
                                      <TableCell>{customer.checkInTime}</TableCell>
                                      <TableCell></TableCell>
                                      <TableCell>{calculateDuration(customer.checkInTimestamp, now)}</TableCell>
                                      <TableCell>
                                        {orderAmount > 0 ? `Rp ${orderAmount.toLocaleString('id-ID')}` : ''}
                                      </TableCell>
                                      <TableCell>
                                        {customerDiscount > 0 ? `Rp ${customerDiscount.toLocaleString('id-ID')}` : ''}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        Rp {liveTotalTransaction.toLocaleString('id-ID')}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewTransactionClick(customer); }}>
                                            <Eye className="mr-2 h-4 w-4"/>
                                            Print Preview
                                        </Button>
                                      </TableCell>
                                  </TableRow>
                                )
                              })
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={12} className="h-24 text-center">
                                      {activeCustomers.length > 0 ? 'Memuat data...' : 'Tidak ada transaksi aktif saat ini.'}
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="h-full w-full max-w-full flex flex-col p-0 sm:rounded-none">
          <DialogHeader className="p-6 border-b shrink-0">
            <DialogTitle>Print Preview</DialogTitle>
            <DialogDescription>
              Rincian untuk transaksi No. {selectedCustomer?.dailySequence}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto p-6 bg-muted/30">
            <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
              <div ref={transactionRef} className="p-4 bg-white text-black shadow-lg w-[302px] max-w-full shrink-0 self-start mx-auto font-mono text-xs">
                <div className="text-center mb-2">
                  <h3 className="text-sm font-bold font-headline">Sukabumi Playground</h3>
                  <p>Jl. Raya Cemerlang No. 123, Sukabumi</p>
                </div>
                <Separator className="my-2 border-dashed border-black" />
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  <span className="font-medium">No. Struk:</span>
                  <span>{selectedCustomer?.dailySequence}</span>
                  
                  <span className="font-medium">Tanggal:</span>
                  <span>{selectedCustomer ? new Date(selectedCustomer.checkInTimestamp).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</span>

                  <span className="font-medium">Waktu:</span>
                  <span>{selectedCustomer?.checkInTime} - {checkOutTime}</span>
                  
                  <span className="font-medium">Durasi:</span>
                  <span>{totalDuration}</span>

                  <span className="font-medium">Customer:</span>
                  <span>{selectedCustomer?.childName}</span>
                  
                  <span className="font-medium">Kasir:</span>
                  <span>{cashierName}</span>
                </div>
                <Separator className="my-2 border-dashed border-black" />
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>Waktu Bermain ({totalDuration})</span>
                    <span>Rp {playCost.toLocaleString('id-ID')}</span>
                  </div>
                  {discountAmount > 0 && selectedCustomer && (
                     <div className="flex justify-between">
                        <span>Diskon Member ({selectedCustomer.discount}%)</span>
                        <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {selectedCustomerOrders.length > 0 && (
                     <>
                      {selectedCustomerOrders.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.name} x{item.qty}</span>
                            <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                          </div>
                      ))}
                    </>
                  )}
                </div>
                <Separator className="my-2 border-dashed border-black" />
                <div className="space-y-0.5 font-medium">
                    <div className="flex justify-between font-bold text-sm">
                        <span>TOTAL</span>
                        <span>Rp {totalTransaction.toLocaleString('id-ID')}</span>
                    </div>
                    {paymentMethod === 'Cash' && parseFloat(cashAmount) >= totalTransaction && (
                    <>
                        <div className="flex justify-between text-xs pt-1">
                            <span>Tunai</span>
                            <span>Rp {parseFloat(cashAmount).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span>Kembali</span>
                            <span>Rp {change.toLocaleString('id-ID')}</span>
                        </div>
                    </>
                    )}
                    {(paymentMethod === 'Debit' || paymentMethod === 'Kartu') && selectedBank && (
                        <div className="flex justify-between text-xs pt-1">
                            <span>{paymentMethod === 'Kartu' ? 'Kartu Kredit' : paymentMethod}</span>
                            <span>{selectedBank}</span>
                        </div>
                    )}
                    {paymentMethod === 'QRIS' && selectedQrisProvider && (
                        <div className="flex justify-between text-xs pt-1">
                            <span>QRIS</span>
                            <span>{selectedQrisProvider}</span>
                        </div>
                    )}
                </div>
                <div className="text-center mt-4">
                  <p>Terima kasih atas kunjungan Anda!</p>
                </div>
              </div>

              <div className="flex-grow w-full lg:w-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Metode Pembayaran</CardTitle>
                    <CardDescription>Pilih metode pembayaran untuk melanjutkan.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                      <div>
                          <RadioGroupItem value="Cash" id="cash" className="peer sr-only" />
                          <Label htmlFor="cash" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Cash</Label>
                      </div>
                      <div>
                          <RadioGroupItem value="Debit" id="debit" className="peer sr-only" />
                          <Label htmlFor="debit" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Debit</Label>
                      </div>
                      <div>
                          <RadioGroupItem value="Kartu" id="card" className="peer sr-only" />
                          <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Kartu Kredit</Label>
                      </div>
                      <div>
                          <RadioGroupItem value="QRIS" id="qris" className="peer sr-only" />
                          <Label htmlFor="qris" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">QRIS</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {paymentMethod === 'Debit' && (
                  <Card className="mt-4">
                      <CardHeader>
                          <CardTitle>Pembayaran Debit</CardTitle>
                          <CardDescription>Pilih bank yang digunakan untuk transaksi.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label>Total Transaksi</Label>
                              <Input value={`Rp ${totalTransaction.toLocaleString('id-ID')}`} readOnly className="bg-muted font-bold" />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="bank-select">Jenis Bank Kartu Debit</Label>
                              <Select value={selectedBank} onValueChange={setSelectedBank}>
                                  <SelectTrigger id="bank-select">
                                      <SelectValue placeholder="Pilih bank..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="BCA">BCA</SelectItem>
                                      <SelectItem value="Mandiri">Bank Mandiri</SelectItem>
                                      <SelectItem value="BRI">BRI</SelectItem>
                                      <SelectItem value="BNI">BNI</SelectItem>
                                      <SelectItem value="CIMB Niaga">CIMB Niaga</SelectItem>
                                      <SelectItem value="Danamon">Danamon</SelectItem>
                                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </CardContent>
                  </Card>
                )}

                {paymentMethod === 'Kartu' && (
                  <Card className="mt-4">
                      <CardHeader>
                          <CardTitle>Pembayaran Kartu Kredit</CardTitle>
                          <CardDescription>Pilih bank yang digunakan untuk transaksi.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label>Total Transaksi</Label>
                              <Input value={`Rp ${totalTransaction.toLocaleString('id-ID')}`} readOnly className="bg-muted font-bold" />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="bank-select-credit">Jenis Bank Kartu Kredit</Label>
                              <Select value={selectedBank} onValueChange={setSelectedBank}>
                                  <SelectTrigger id="bank-select-credit">
                                      <SelectValue placeholder="Pilih bank..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="BCA">BCA</SelectItem>
                                      <SelectItem value="Mandiri">Bank Mandiri</SelectItem>
                                      <SelectItem value="BRI">BRI</SelectItem>
                                      <SelectItem value="BNI">BNI</SelectItem>
                                      <SelectItem value="CIMB Niaga">CIMB Niaga</SelectItem>
                                      <SelectItem value="Visa">Visa</SelectItem>
                                      <SelectItem value="Mastercard">Mastercard</SelectItem>
                                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </CardContent>
                  </Card>
                )}

                {paymentMethod === 'Cash' && (
                  <Card className="mt-4">
                      <CardHeader>
                          <CardTitle>Pembayaran Tunai</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label>Total Transaksi</Label>
                              <Input value={`Rp ${totalTransaction.toLocaleString('id-ID')}`} readOnly className="bg-muted font-bold" />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="cash-amount">Jumlah Uang</Label>
                              <Input
                                  id="cash-amount"
                                  type="number"
                                  placeholder="Masukkan jumlah uang tunai"
                                  value={cashAmount}
                                  onChange={(e) => setCashAmount(e.target.value)}
                                  min={0}
                              />
                          </div>
                          <div className="space-y-2">
                              <Label>Kembalian</Label>
                              <Input value={`Rp ${change.toLocaleString('id-ID')}`} readOnly className="bg-muted font-bold" />
                          </div>
                      </CardContent>
                  </Card>
                )}

                {paymentMethod === 'QRIS' && (
                  <Card className="mt-4">
                      <CardHeader>
                          <CardTitle>Pembayaran QRIS</CardTitle>
                          <CardDescription>Pilih penyedia layanan yang digunakan.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label>Total Transaksi</Label>
                              <Input value={`Rp ${totalTransaction.toLocaleString('id-ID')}`} readOnly className="bg-muted font-bold" />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="qris-provider-select">Jenis Pembayaran QRIS</Label>
                              <Select value={selectedQrisProvider} onValueChange={setSelectedQrisProvider}>
                                  <SelectTrigger id="qris-provider-select">
                                      <SelectValue placeholder="Pilih penyedia..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="Ovo">Ovo</SelectItem>
                                      <SelectItem value="ShopeePay">ShopeePay</SelectItem>
                                      <SelectItem value="Dana">Dana</SelectItem>
                                      <SelectItem value="Gopay">Gopay</SelectItem>
                                      <SelectItem value="LinkAja">LinkAja</SelectItem>
                                      <SelectItem value="QRIS BCA">QRIS BCA</SelectItem>
                                      <SelectItem value="QRIS Mandiri">QRIS Mandiri</SelectItem>
                                      <SelectItem value="QRIS Permata">QRIS Permata</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-4 border-t shrink-0 bg-background sm:justify-end gap-2">
            <Button variant="ghost" onClick={() => handleDialogOpenChange(false)} className="sm:mr-auto">
              Tutup
            </Button>
            <Button variant="outline" onClick={handleDownloadTransactionAsImage}>
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button variant="outline" onClick={handleShareTransaction}>
                <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button 
              variant="default" 
              onClick={handleOpenPrintConfirm}
              disabled={isFinalizeDisabled}
            >
                <Printer className="mr-2 h-4 w-4" /> Cetak & Selesaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isPrintConfirmOpen} onOpenChange={setIsPrintConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Pencetakan</AlertDialogTitle>
                <AlertDialogDescription>
                    Anda akan menyelesaikan transaksi ini dan membuka dialog pencetakan. Pastikan printer Anda sudah siap dan terhubung.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinalizeAndPrint}>
                    Lanjutkan & Cetak
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
