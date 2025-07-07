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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MinusCircle, PlusCircle, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Interfaces
interface CafeMenuItem {
  id: string;
  name: string;
  type: string;
  price: number;
  stock: number;
  category: 'makanan' | 'minuman' | 'barang';
}

interface ActiveCustomer {
  dailySequence: string;
  childName: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export default function ShoppingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Data state
  const [cafeMenu, setCafeMenu] = useState<CafeMenuItem[]>([]);
  const [activeCustomers, setActiveCustomers] = useState<ActiveCustomer[]>([]);
  const [allOrders, setAllOrders] = useState<Record<string, OrderItem[]>>({});

  // UI state
  const [selectedCustomerSequence, setSelectedCustomerSequence] = useState<string>('');
  
  // Form state
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Derived state
  const selectedCustomerOrder = useMemo(() => {
    return allOrders[selectedCustomerSequence] || [];
  }, [allOrders, selectedCustomerSequence]);

  const selectedCustomerName = useMemo(() => {
    return activeCustomers.find(c => c.dailySequence === selectedCustomerSequence)?.childName || 'Pilih Customer';
  }, [activeCustomers, selectedCustomerSequence]);

  const orderTotal = useMemo(() => {
    return selectedCustomerOrder.reduce((total, item) => total + (item.price * item.qty), 0);
  }, [selectedCustomerOrder]);

  const totalPrice = useMemo(() => {
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
        return 0;
    }
    return unitPrice * numQuantity;
  }, [unitPrice, quantity]);
  
  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  // Authorization and data loading
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
    const menuData = localStorage.getItem('sukabumi-inventory');
    setCafeMenu(menuData ? JSON.parse(menuData) : []);
    
    const customersData = localStorage.getItem('sukabumi-active-customers');
    setActiveCustomers(customersData ? JSON.parse(customersData) : []);

    const ordersData = localStorage.getItem('sukabumi-customer-orders');
    setAllOrders(ordersData ? JSON.parse(ordersData) : {});
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
      window.addEventListener('storage', loadData);
      return () => window.removeEventListener('storage', loadData);
    }
  }, [isAuthorized]);

  // Handlers
  const handleItemSelect = (itemId: string) => {
    if (!itemId) {
      setSelectedItemId('');
      setUnitPrice(0);
      setQuantity('1');
      return;
    }
    setSelectedItemId(itemId);
    const selectedItem = cafeMenu.find(item => item.id === itemId);
    if (selectedItem) {
      setUnitPrice(selectedItem.price);
    } else {
      setUnitPrice(0);
    }
    setQuantity('1'); // Reset quantity on new item selection
  };
  
  const handleAddItemToOrder = () => {
    if (!selectedCustomerSequence) {
      toast({ title: "Pilih Customer", description: "Silakan pilih customer terlebih dahulu.", variant: "destructive" });
      return;
    }
    if (!selectedItemId) {
      toast({ title: "Pilih Item", description: "Silakan pilih item yang akan dipesan.", variant: "destructive" });
      return;
    }
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast({ title: "Jumlah Tidak Valid", description: "Jumlah pesanan harus lebih dari 0.", variant: "destructive" });
      return;
    }

    const menuItem = cafeMenu.find(item => item.id === selectedItemId);
    if (!menuItem) return;
    
    // Check stock
    const currentOrder = allOrders[selectedCustomerSequence] || [];
    const itemInCart = currentOrder.find(item => item.id === selectedItemId);
    const qtyInCart = itemInCart ? itemInCart.qty : 0;
    
    if (menuItem.stock < qtyInCart + numQuantity) {
      toast({
        title: "Stok Tidak Cukup",
        description: `Stok ${menuItem.name} tersisa ${menuItem.stock}. Anda sudah punya ${qtyInCart} di keranjang.`,
        variant: "destructive"
      });
      return;
    }

    setAllOrders(prevOrders => {
      const order = prevOrders[selectedCustomerSequence] ? [...prevOrders[selectedCustomerSequence]] : [];
      const existingItemIndex = order.findIndex(item => item.id === menuItem.id);

      if (existingItemIndex > -1) {
        order[existingItemIndex].qty += numQuantity;
      } else {
        order.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price, qty: numQuantity });
      }

      const newAllOrders = { ...prevOrders, [selectedCustomerSequence]: order };
      localStorage.setItem('sukabumi-customer-orders', JSON.stringify(newAllOrders));
      window.dispatchEvent(new Event('storage'));
      return newAllOrders;
    });

    toast({
      title: "Item Ditambahkan",
      description: `${numQuantity} x ${menuItem.name} ditambahkan ke pesanan ${selectedCustomerName}.`
    });

    // Reset form
    handleItemSelect('');
  };


  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    const menuItem = cafeMenu.find(item => item.id === itemId);
    if (!menuItem) return;

    if (newQty > menuItem.stock) {
        toast({
            title: "Stok Tidak Cukup",
            description: `Stok ${menuItem.name} hanya tersisa ${menuItem.stock}.`,
            variant: "destructive",
        });
        return;
    }

    setAllOrders(prevOrders => {
      const currentOrder = prevOrders[selectedCustomerSequence] ? [...prevOrders[selectedCustomerSequence]] : [];
      const itemIndex = currentOrder.findIndex(item => item.id === itemId);

      if (itemIndex > -1) {
        if (newQty <= 0) {
          // Remove item if quantity is 0 or less
          currentOrder.splice(itemIndex, 1);
        } else {
          currentOrder[itemIndex].qty = newQty;
        }
      }
      
      const newAllOrders = { ...prevOrders, [selectedCustomerSequence]: currentOrder };
      localStorage.setItem('sukabumi-customer-orders', JSON.stringify(newAllOrders));
      window.dispatchEvent(new Event('storage'));
      return newAllOrders;
    });
  };
  
  const handleClearOrder = () => {
    if (!selectedCustomerSequence) return;
    setAllOrders(prevOrders => {
        const newOrders = {...prevOrders};
        if (newOrders[selectedCustomerSequence]) {
          delete newOrders[selectedCustomerSequence];
          localStorage.setItem('sukabumi-customer-orders', JSON.stringify(newOrders));
          window.dispatchEvent(new Event('storage'));
          toast({ title: "Pesanan Dikosongkan", description: `Semua pesanan untuk ${selectedCustomerName} telah dihapus.`});
        }
        return newOrders;
    });
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Memeriksa otorisasi...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="p-6 pt-0 border-b">
        <h1 className="text-2xl font-bold font-headline">Shopping</h1>
        <p className="text-muted-foreground">Pesan makanan, minuman, dan barang untuk pelanggan yang sedang aktif.</p>
      </div>

      <div className="grid md:grid-cols-2 flex-grow overflow-hidden">
        {/* Left Column: New Order Form */}
        <div className="flex flex-col p-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Buat Pesanan Baru</CardTitle>
              <CardDescription>
                Pilih item dan jumlah untuk ditambahkan ke pesanan customer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-select">Jenis Pesanan</Label>
                <Select onValueChange={handleItemSelect} value={selectedItemId}>
                  <SelectTrigger id="item-select">
                    <SelectValue placeholder="Pilih item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cafeMenu.length > 0 ? (
                      cafeMenu.map(item => (
                        <SelectItem key={item.id} value={item.id} disabled={item.stock === 0}>
                          {item.name} (Stok: {item.stock})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Tidak ada item di menu</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah Pesanan</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  disabled={!selectedItemId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-price">Harga Satuan</Label>
                <Input
                  id="unit-price"
                  value={formatCurrency(unitPrice)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-price">Total Harga</Label>
                <Input
                  id="total-price"
                  value={formatCurrency(totalPrice)}
                  readOnly
                  className="bg-muted font-bold"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleAddItemToOrder} disabled={!selectedItemId || !selectedCustomerSequence}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah ke Pesanan
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Order */}
        <div className="flex flex-col p-4 border-l bg-muted/30 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Pesanan Customer</CardTitle>
              <CardDescription>Pilih customer untuk melihat atau menambah pesanan.</CardDescription>
              <Select value={selectedCustomerSequence} onValueChange={setSelectedCustomerSequence}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Pilih customer aktif..." />
                </SelectTrigger>
                <SelectContent>
                  {activeCustomers.length > 0 ? (
                    activeCustomers.map(customer => (
                      <SelectItem key={customer.dailySequence} value={customer.dailySequence}>
                        {customer.childName} (Tiket: {customer.dailySequence})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Tidak ada customer aktif</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {selectedCustomerSequence ? (
                selectedCustomerOrder.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead className="text-center">Jumlah</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCustomerOrder.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>Rp {item.price.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-center">
                             <div className="flex items-center justify-center gap-2">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.qty - 1)}>
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                               <span>{item.qty}</span>
                               <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.qty + 1)}>
                                  <PlusCircle className="h-4 w-4" />
                               </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">Rp {(item.price * item.qty).toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    <ShoppingCart className="mx-auto h-12 w-12" />
                    <p className="mt-2">Belum ada pesanan untuk {selectedCustomerName}.</p>
                  </div>
                )
              ) : (
                 <div className="text-center text-muted-foreground py-10">
                    <p>Pilih customer untuk mulai.</p>
                 </div>
              )}
            </CardContent>
            {selectedCustomerSequence && (
              <CardFooter className="flex flex-col items-stretch gap-2 pt-4 border-t">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>Rp {orderTotal.toLocaleString('id-ID')}</span>
                  </div>
                  {selectedCustomerOrder.length > 0 && (
                    <Button variant="destructive" onClick={handleClearOrder}>
                      <Trash2 className="mr-2 h-4 w-4" /> Kosongkan Pesanan
                    </Button>
                  )}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
