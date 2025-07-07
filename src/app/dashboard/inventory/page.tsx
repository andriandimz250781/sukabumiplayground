'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addActivityLog } from "@/lib/logger";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

// Define the interface for an inventory item
interface InventoryItem {
  id: string;
  name: string;
  type: string;
  price: number;
  stock: number;
  category: 'makanan' | 'minuman' | 'barang';
}

interface AssetItem {
  id: string;
  name: string;
  type: string;
  purchaseDate: string;
  quantity: number;
  value: number;
  condition: string;
  location: string;
}


export default function InventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // General inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);

  // State for Add Food Dialog
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [foodType, setFoodType] = useState('');
  const [otherFoodType, setOtherFoodType] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodStock, setFoodStock] = useState('');
  
  // State for Edit Food Dialog
  const [isEditFoodDialogOpen, setIsEditFoodDialogOpen] = useState(false);
  const [editingFoodItem, setEditingFoodItem] = useState<InventoryItem | null>(null);

  // State for Add Drink Dialog
  const [isAddDrinkDialogOpen, setIsAddDrinkDialogOpen] = useState(false);
  const [drinkName, setDrinkName] = useState('');
  const [drinkType, setDrinkType] = useState('');
  const [otherDrinkType, setOtherDrinkType] = useState('');
  const [drinkPrice, setDrinkPrice] = useState('');
  const [drinkStock, setDrinkStock] = useState('');

  // State for Edit Drink Dialog
  const [isEditDrinkDialogOpen, setIsEditDrinkDialogOpen] = useState(false);
  const [editingDrinkItem, setEditingDrinkItem] = useState<InventoryItem | null>(null);

  // State for Add Item Dialog
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('');
  const [otherItemType, setOtherItemType] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemStock, setItemStock] = useState('');

  // State for Edit Item Dialog
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // State for Add Asset Dialog
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('');
  const [otherAssetType, setOtherAssetType] = useState('');
  const [assetPurchaseDate, setAssetPurchaseDate] = useState<Date>();
  const [assetQuantity, setAssetQuantity] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetCondition, setAssetCondition] = useState('');
  const [assetLocation, setAssetLocation] = useState('');

  // State for Edit Asset Dialog
  const [isEditAssetDialogOpen, setIsEditAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);

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
    const inventoryData = localStorage.getItem('sukabumi-inventory');
    setInventory(inventoryData ? JSON.parse(inventoryData) : []);
    
    const assetsData = localStorage.getItem('sukabumi-assets');
    setAssets(assetsData ? JSON.parse(assetsData) : []);
  };

  useEffect(() => {
    if (isAuthorized) {
        loadData();
        window.addEventListener('storage', loadData);
        return () => {
            window.removeEventListener('storage', loadData);
        };
    }
  }, [isAuthorized]);

  const handleAddFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodType || !foodPrice || !foodStock) {
        toast({ title: "Input Tidak Lengkap", description: "Mohon isi semua field yang dibutuhkan.", variant: "destructive" });
        return;
    }
    if (foodType === 'lainnya' && !otherFoodType) {
        toast({ title: "Input Tidak Lengkap", description: "Mohon isi jenis makanan lainnya.", variant: "destructive" });
        return;
    }
    const finalFoodType = foodType === 'lainnya' ? otherFoodType : foodType;
    const newFoodItem: InventoryItem = {
        id: `food-${new Date().toISOString()}`, name: foodName, type: finalFoodType,
        price: Number(foodPrice), stock: Number(foodStock), category: 'makanan',
    };
    const currentInventory = [...inventory];
    currentInventory.unshift(newFoodItem);
    localStorage.setItem('sukabumi-inventory', JSON.stringify(currentInventory));
    setInventory(currentInventory);
    addActivityLog(`Menambahkan item makanan baru: ${foodName} (Stok: ${foodStock})`);
    toast({ title: "Makanan Ditambahkan", description: `${foodName} telah berhasil ditambahkan ke inventaris.` });
    setFoodName(''); setFoodType(''); setOtherFoodType(''); setFoodPrice(''); setFoodStock('');
    setIsAddFoodDialogOpen(false);
  };
  
  const handleAddDrinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drinkName || !drinkType || !drinkPrice || !drinkStock) {
        toast({ title: "Input Tidak Lengkap", description: "Mohon isi semua field yang dibutuhkan.", variant: "destructive" });
        return;
    }
    if (drinkType === 'lainnya' && !otherDrinkType) {
        toast({ title: "Input Tidak Lengkap", description: "Mohon isi jenis minuman lainnya.", variant: "destructive" });
        return;
    }
    const finalDrinkType = drinkType === 'lainnya' ? otherDrinkType : drinkType;
    const newDrinkItem: InventoryItem = {
        id: `drink-${new Date().toISOString()}`, name: drinkName, type: finalDrinkType,
        price: Number(drinkPrice), stock: Number(drinkStock), category: 'minuman',
    };
    const currentInventory = [...inventory];
    currentInventory.unshift(newDrinkItem);
    localStorage.setItem('sukabumi-inventory', JSON.stringify(currentInventory));
    setInventory(currentInventory);
    addActivityLog(`Menambahkan item minuman baru: ${drinkName} (Stok: ${drinkStock})`);
    toast({ title: "Minuman Ditambahkan", description: `${drinkName} telah berhasil ditambahkan ke inventaris.` });
    setDrinkName(''); setDrinkType(''); setOtherDrinkType(''); setDrinkPrice(''); setDrinkStock('');
    setIsAddDrinkDialogOpen(false);
  };
  
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemType || !itemPrice || !itemStock) {
        toast({ title: "Input Tidak Lengkap", description: "Mohon isi semua field yang dibutuhkan.", variant: "destructive" });
        return;
    }
    if (itemType === 'lainnya' && !otherItemType) {
        toast({ title: "Input Tidak Lengkap", description: "Mohon isi jenis barang lainnya.", variant: "destructive" });
        return;
    }
    const finalItemType = itemType === 'lainnya' ? otherItemType : itemType;
    const newItem: InventoryItem = {
        id: `item-${new Date().toISOString()}`, name: itemName, type: finalItemType,
        price: Number(itemPrice), stock: Number(itemStock), category: 'barang',
    };
    const currentInventory = [...inventory];
    currentInventory.unshift(newItem);
    localStorage.setItem('sukabumi-inventory', JSON.stringify(currentInventory));
    setInventory(currentInventory);
    addActivityLog(`Menambahkan barang baru: ${itemName} (Stok: ${itemStock})`);
    toast({ title: "Barang Ditambahkan", description: `${itemName} telah berhasil ditambahkan ke inventaris.` });
    setItemName(''); setItemType(''); setOtherItemType(''); setItemPrice(''); setItemStock('');
    setIsAddItemDialogOpen(false);
  };
  
  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetType || !assetPurchaseDate || !assetQuantity || !assetValue || !assetCondition || !assetLocation) {
        toast({ title: "Input Tidak Lengkap", description: "Mohon isi semua field yang dibutuhkan.", variant: "destructive" });
        return;
    }
    if (assetType === 'lainnya' && !otherAssetType) {
        toast({ title: "Input Tidak Lengkap", description: "Mohon isi jenis aset lainnya.", variant: "destructive" });
        return;
    }
    const finalAssetType = assetType === 'lainnya' ? otherAssetType : assetType;
    const newAsset: AssetItem = {
        id: `asset-${new Date().toISOString()}`, name: assetName, type: finalAssetType,
        purchaseDate: format(assetPurchaseDate, 'dd-MM-yyyy'),
        quantity: Number(assetQuantity), value: Number(assetValue), condition: assetCondition, location: assetLocation,
    };
    const currentAssets = [...assets];
    currentAssets.unshift(newAsset);
    localStorage.setItem('sukabumi-assets', JSON.stringify(currentAssets));
    setAssets(currentAssets);
    addActivityLog(`Menambahkan aset baru: ${assetName}`);
    toast({ title: "Aset Ditambahkan", description: `${assetName} telah berhasil ditambahkan.` });
    setAssetName(''); setAssetType(''); setOtherAssetType(''); setAssetPurchaseDate(undefined);
    setAssetQuantity(''); setAssetValue(''); setAssetCondition(''); setAssetLocation('');
    setIsAddAssetDialogOpen(false);
  };

  const calculatedAddTotalPrice = (Number(foodPrice) || 0) * (Number(foodStock) || 0);
  const calculatedAddDrinkTotalPrice = (Number(drinkPrice) || 0) * (Number(drinkStock) || 0);
  const calculatedAddItemTotalPrice = (Number(itemPrice) || 0) * (Number(itemStock) || 0);
  
  const foodItems = useMemo(() => inventory.filter(item => item.category === 'makanan'), [inventory]);
  const drinkItems = useMemo(() => inventory.filter(item => item.category === 'minuman'), [inventory]);
  const generalItems = useMemo(() => inventory.filter(item => item.category === 'barang'), [inventory]);
  
  // --- Edit Logic for Inventory---
  const openEditDialog = (item: InventoryItem) => {
    if (item.category === 'makanan') {
        setEditingFoodItem({...item});
        setIsEditFoodDialogOpen(true);
    } else if (item.category === 'minuman') {
        setEditingDrinkItem({...item});
        setIsEditDrinkDialogOpen(true);
    } else {
        setEditingItem({...item});
        setIsEditItemDialogOpen(true);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'makanan' | 'minuman' | 'barang') => {
    const { name, value } = e.target;
    const isNumeric = ['price', 'stock'].includes(name);
    const newValue = isNumeric ? Number(value) : value;

    if (category === 'makanan' && editingFoodItem) {
        setEditingFoodItem({ ...editingFoodItem, [name]: newValue });
    } else if (category === 'minuman' && editingDrinkItem) {
        setEditingDrinkItem({ ...editingDrinkItem, [name]: newValue });
    } else if (category === 'barang' && editingItem) {
        setEditingItem({ ...editingItem, [name]: newValue });
    }
  };
  
  const handleEditSubmit = (category: 'makanan' | 'minuman' | 'barang') => {
    const itemToEdit = category === 'makanan' ? editingFoodItem : category === 'minuman' ? editingDrinkItem : editingItem;
    if (!itemToEdit) return;

    const updatedInventory = inventory.map(item => item.id === itemToEdit.id ? itemToEdit : item);
    localStorage.setItem('sukabumi-inventory', JSON.stringify(updatedInventory));
    setInventory(updatedInventory);

    addActivityLog(`Memperbarui item: ${itemToEdit.name}`);
    toast({ title: "Item Diperbarui", description: `${itemToEdit.name} telah berhasil diperbarui.` });
    
    if (category === 'makanan') {
        setIsEditFoodDialogOpen(false);
        setEditingFoodItem(null);
    } else if (category === 'minuman') {
        setIsEditDrinkDialogOpen(false);
        setEditingDrinkItem(null);
    } else {
        setIsEditItemDialogOpen(false);
        setEditingItem(null);
    }
  };
  
  // --- Delete Logic for Inventory ---
  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = inventory.find(item => item.id === itemId);
    if (!itemToDelete) return;

    const updatedInventory = inventory.filter(item => item.id !== itemId);
    localStorage.setItem('sukabumi-inventory', JSON.stringify(updatedInventory));
    setInventory(updatedInventory);
    
    addActivityLog(`Menghapus item: ${itemToDelete.name}`);
    toast({ title: "Item Dihapus", description: `${itemToDelete.name} telah dihapus dari inventaris.`, variant: "destructive" });
  };
  
  // --- Edit Logic for Assets ---
    const openEditAssetDialog = (asset: AssetItem) => {
        setEditingAsset({...asset});
        setIsEditAssetDialogOpen(true);
    };

    const handleEditAssetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editingAsset) return;
        const { name, value } = e.target;
        const isNumeric = ['quantity', 'value'].includes(name);
        setEditingAsset({ ...editingAsset, [name]: isNumeric ? Number(value) : value });
    };

    const handleEditAssetSubmit = () => {
        if (!editingAsset) return;
        const updatedAssets = assets.map(asset => asset.id === editingAsset.id ? editingAsset : asset);
        localStorage.setItem('sukabumi-assets', JSON.stringify(updatedAssets));
        setAssets(updatedAssets);
        addActivityLog(`Memperbarui aset: ${editingAsset.name}`);
        toast({ title: "Aset Diperbarui", description: `${editingAsset.name} telah berhasil diperbarui.` });
        setIsEditAssetDialogOpen(false);
        setEditingAsset(null);
    };

    // --- Delete Logic for Assets ---
    const handleDeleteAsset = (assetId: string) => {
        const assetToDelete = assets.find(asset => asset.id === assetId);
        if (!assetToDelete) return;
        const updatedAssets = assets.filter(asset => asset.id !== assetId);
        localStorage.setItem('sukabumi-assets', JSON.stringify(updatedAssets));
        setAssets(updatedAssets);
        addActivityLog(`Menghapus aset: ${assetToDelete.name}`);
        toast({ title: "Aset Dihapus", description: `${assetToDelete.name} telah dihapus.`, variant: "destructive" });
    };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Memeriksa otorisasi...</p>
      </div>
    );
  }

  const renderInventoryTable = (items: InventoryItem[], category: 'makanan' | 'minuman' | 'barang') => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead><TableHead>Jenis</TableHead><TableHead>Harga Satuan</TableHead>
            <TableHead>Stok</TableHead><TableHead>Total Harga</TableHead><TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                <TableCell>{formatCurrency(item.price)}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>{formatCurrency(item.price * item.stock)}</TableCell>
                <TableCell className="text-right space-x-1 whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                      <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Item?</AlertDialogTitle>
                        <AlertDialogDescription>Anda yakin ingin menghapus <strong>{item.name}</strong>? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">Belum ada {category === 'barang' ? 'barang' : category} yang ditambahkan.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
  
  const renderAssetTable = (assetItems: AssetItem[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Aset</TableHead><TableHead>Jenis</TableHead><TableHead>Tgl Pembelian</TableHead>
            <TableHead>Jumlah</TableHead><TableHead>Nilai</TableHead><TableHead>Kondisi</TableHead>
            <TableHead>Lokasi</TableHead><TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assetItems.length > 0 ? (
            assetItems.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell><Badge variant="outline">{asset.type}</Badge></TableCell>
                <TableCell>{asset.purchaseDate}</TableCell>
                <TableCell>{asset.quantity}</TableCell>
                <TableCell>{formatCurrency(asset.value)}</TableCell>
                <TableCell><Badge variant={asset.condition === 'baik' ? 'default' : 'destructive'}>{asset.condition}</Badge></TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" onClick={() => openEditAssetDialog(asset)}>
                        <Pencil className="h-4 w-4" />
                   </Button>
                   <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Aset?</AlertDialogTitle>
                          <AlertDialogDescription>Anda yakin ingin menghapus <strong>{asset.name}</strong>? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteAsset(asset.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">Belum ada aset yang ditambahkan.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    );

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold font-headline">Inventory & Aset</h1>
          <p className="text-muted-foreground">Kelola daftar inventaris dan aset playground.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Inventory</CardTitle>
            <CardDescription>Kelola stok makanan, minuman, dan barang lainnya.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Inventory Makanan</CardTitle>
                      <Dialog open={isAddFoodDialogOpen} onOpenChange={setIsAddFoodDialogOpen}>
                        <DialogTrigger asChild><Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Tambah Makanan</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                              <DialogTitle>Tambah Makanan Baru</DialogTitle>
                              <DialogDescription>Masukkan detail makanan untuk menambahkannya ke inventaris.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddFoodSubmit}>
                              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="food-name" className="text-right">Nama makanan</Label><Input id="food-name" value={foodName} onChange={(e) => setFoodName(e.target.value)} className="col-span-3" required /></div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="food-type" className="text-right">Jenis</Label>
                                      <Select value={foodType} onValueChange={setFoodType}>
                                        <SelectTrigger id="food-type" className="col-span-3"><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="snack-kering">Snack Kering</SelectItem><SelectItem value="roti">Roti</SelectItem><SelectItem value="permen-coklat">Permen & Coklat</SelectItem>
                                            <SelectItem value="makanan-berat">Makanan Berat</SelectItem><SelectItem value="kue-pastry">Kue & Pastry</SelectItem><SelectItem value="gorengan">Gorengan</SelectItem>
                                            <SelectItem value="makanan-ringan">Makanan Ringan</SelectItem><SelectItem value="lainnya">Lainnya</SelectItem>
                                        </SelectContent>
                                      </Select>
                                  </div>
                                  {foodType === 'lainnya' && (<div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="other-food-type" className="text-right">Jenis Lainnya</Label><Input id="other-food-type" value={otherFoodType} onChange={(e) => setOtherFoodType(e.target.value)} className="col-span-3" placeholder="Tuliskan jenis makanan" required={foodType === 'lainnya'}/></div>)}
                                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="food-price" className="text-right">Harga Satuan</Label><Input id="food-price" type="number" value={foodPrice} onChange={(e) => setFoodPrice(e.target.value)} className="col-span-3" required min="0" /></div>
                                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="food-stock" className="text-right">Stok</Label><Input id="food-stock" type="number" value={foodStock} onChange={(e) => setFoodStock(e.target.value)} className="col-span-3" required min="0"/></div>
                                  <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="food-total" className="text-right">Total Harga</Label><Input id="food-total" value={formatCurrency(calculatedAddTotalPrice)} className="col-span-3 bg-muted" readOnly /></div>
                              </div>
                              <DialogFooter className="pt-4"><Button type="submit">Simpan</Button></DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                  </CardHeader>
                  <CardContent>{renderInventoryTable(foodItems, 'makanan')}</CardContent>
              </Card>
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Inventory Minuman</CardTitle>
                      <Dialog open={isAddDrinkDialogOpen} onOpenChange={setIsAddDrinkDialogOpen}>
                        <DialogTrigger asChild><Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Tambah Minuman</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Tambah Minuman Baru</DialogTitle>
                                <DialogDescription>Masukkan detail minuman untuk menambahkannya ke inventaris.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddDrinkSubmit}>
                                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="drink-name" className="text-right">Nama minuman</Label><Input id="drink-name" value={drinkName} onChange={(e) => setDrinkName(e.target.value)} className="col-span-3" required /></div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="drink-type" className="text-right">Jenis</Label>
                                        <Select value={drinkType} onValueChange={setDrinkType}>
                                          <SelectTrigger id="drink-type" className="col-span-3"><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="kopi">Kopi</SelectItem><SelectItem value="teh">Teh</SelectItem><SelectItem value="jus">Jus</SelectItem><SelectItem value="susu">Susu</SelectItem>
                                              <SelectItem value="minuman-soda">Minuman Soda</SelectItem><SelectItem value="air-mineral">Air Mineral</SelectItem><SelectItem value="lainnya">Lainnya</SelectItem>
                                          </SelectContent>
                                        </Select>
                                    </div>
                                    {drinkType === 'lainnya' && (<div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="other-drink-type" className="text-right">Jenis Lainnya</Label><Input id="other-drink-type" value={otherDrinkType} onChange={(e) => setOtherDrinkType(e.target.value)} className="col-span-3" placeholder="Tuliskan jenis minuman" required={drinkType === 'lainnya'}/></div>)}
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="drink-price" className="text-right">Harga Satuan</Label><Input id="drink-price" type="number" value={drinkPrice} onChange={(e) => setDrinkPrice(e.target.value)} className="col-span-3" required min="0" /></div>
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="drink-stock" className="text-right">Stok</Label><Input id="drink-stock" type="number" value={drinkStock} onChange={(e) => setDrinkStock(e.target.value)} className="col-span-3" required min="0"/></div>
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="drink-total" className="text-right">Total Harga</Label><Input id="drink-total" value={formatCurrency(calculatedAddDrinkTotalPrice)} className="col-span-3 bg-muted" readOnly /></div>
                                </div>
                                <DialogFooter className="pt-4"><Button type="submit">Simpan</Button></DialogFooter>
                            </form>
                        </DialogContent>
                      </Dialog>
                  </CardHeader>
                  <CardContent>{renderInventoryTable(drinkItems, 'minuman')}</CardContent>
              </Card>
              <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Inventory Non Makanan & Minuman</CardTitle>
                     <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                        <DialogTrigger asChild><Button size="sm" type="button"><PlusCircle className="mr-2 h-4 w-4" />Tambah Barang</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Tambah Barang Baru</DialogTitle>
                                <DialogDescription>Masukkan detail barang untuk menambahkannya ke inventaris.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddItemSubmit}>
                                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="item-name" className="text-right">Nama barang</Label><Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} className="col-span-3" required /></div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="item-type" className="text-right">Jenis</Label>
                                        <Select value={itemType} onValueChange={setItemType}>
                                          <SelectTrigger id="item-type" className="col-span-3"><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="mainan">Mainan</SelectItem><SelectItem value="souvenir">Souvenir</SelectItem><SelectItem value="pakaian">Pakaian</SelectItem>
                                              <SelectItem value="aksesoris">Aksesoris</SelectItem><SelectItem value="perlengkapan">Perlengkapan</SelectItem><SelectItem value="lainnya">Lainnya</SelectItem>
                                          </SelectContent>
                                        </Select>
                                    </div>
                                    {itemType === 'lainnya' && (<div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="other-item-type" className="text-right">Jenis Lainnya</Label><Input id="other-item-type" value={otherItemType} onChange={(e) => setOtherItemType(e.target.value)} className="col-span-3" placeholder="Tuliskan jenis barang" required={itemType === 'lainnya'}/></div>)}
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="item-price" className="text-right">Harga Satuan</Label><Input id="item-price" type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="col-span-3" required min="0" /></div>
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="item-stock" className="text-right">Stok</Label><Input id="item-stock" type="number" value={itemStock} onChange={(e) => setItemStock(e.target.value)} className="col-span-3" required min="0"/></div>
                                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="item-total" className="text-right">Total Harga</Label><Input id="item-total" value={formatCurrency(calculatedAddItemTotalPrice)} className="col-span-3 bg-muted" readOnly /></div>
                                </div>
                                <DialogFooter className="pt-4"><Button type="submit">Simpan</Button></DialogFooter>
                            </form>
                        </DialogContent>
                      </Dialog>
                  </CardHeader>
                  <CardContent>{renderInventoryTable(generalItems, 'barang')}</CardContent>
              </Card>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
                <CardTitle>Daftar Aset</CardTitle>
                <CardDescription>Kelola daftar aset tetap seperti properti dan peralatan.</CardDescription>
            </div>
            <Dialog open={isAddAssetDialogOpen} onOpenChange={setIsAddAssetDialogOpen}>
                <DialogTrigger asChild><Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Tambah Aset</Button></DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Aset Baru</DialogTitle>
                        <DialogDescription>Masukkan detail aset untuk menambahkannya ke daftar.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddAssetSubmit}>
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="asset-name">Nama Aset</Label>
                                    <Input id="asset-name" value={assetName} onChange={(e) => setAssetName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="asset-type">Jenis Aset</Label>
                                    <Select value={assetType} onValueChange={setAssetType}>
                                        <SelectTrigger><SelectValue placeholder="Pilih jenis..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="permainan">Permainan</SelectItem><SelectItem value="furnitur">Furnitur</SelectItem><SelectItem value="elektronik">Elektronik</SelectItem>
                                            <SelectItem value="dekorasi">Dekorasi</SelectItem><SelectItem value="properti">Properti</SelectItem><SelectItem value="lainnya">Lainnya</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {assetType === 'lainnya' && (<div className="space-y-2"><Label htmlFor="other-asset-type">Jenis Lainnya</Label><Input id="other-asset-type" value={otherAssetType} onChange={(e) => setOtherAssetType(e.target.value)} placeholder="Tuliskan jenis aset" required={assetType === 'lainnya'} /></div>)}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="asset-date">Tanggal Pembelian</Label>
                                    <Popover><PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !assetPurchaseDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />{assetPurchaseDate ? format(assetPurchaseDate, "dd-MM-yyyy") : <span>Pilih tanggal</span>}
                                        </Button>
                                    </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={assetPurchaseDate} onSelect={setAssetPurchaseDate} initialFocus /></PopoverContent></Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="asset-quantity">Jumlah</Label>
                                    <Input id="asset-quantity" type="number" value={assetQuantity} onChange={(e) => setAssetQuantity(e.target.value)} required min="1" />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="asset-value">Nilai Aset (Satuan)</Label>
                                    <Input id="asset-value" type="number" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} required min="0" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="asset-condition">Kondisi</Label>
                                    <Select value={assetCondition} onValueChange={setAssetCondition}>
                                        <SelectTrigger><SelectValue placeholder="Pilih kondisi..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="baru">Baru</SelectItem><SelectItem value="baik">Baik</SelectItem>
                                            <SelectItem value="perlu perbaikan">Perlu Perbaikan</SelectItem><SelectItem value="rusak">Rusak</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="asset-location">Lokasi Aset</Label>
                                <Input id="asset-location" value={assetLocation} onChange={(e) => setAssetLocation(e.target.value)} required />
                            </div>
                        </div>
                        <DialogFooter className="pt-4"><Button type="submit">Simpan Aset</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>{renderAssetTable(assets)}</CardContent>
        </Card>
      </div>

      <Dialog open={isEditFoodDialogOpen} onOpenChange={setIsEditFoodDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Item Makanan</DialogTitle><DialogDescription>Ubah detail item dan simpan perubahan.</DialogDescription></DialogHeader>
            {editingFoodItem && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-food-name" className="text-right">Nama</Label><Input id="edit-food-name" name="name" value={editingFoodItem.name} onChange={(e) => handleEditChange(e, 'makanan')} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-food-type" className="text-right">Jenis</Label><Input id="edit-food-type" name="type" value={editingFoodItem.type} onChange={(e) => handleEditChange(e, 'makanan')} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-food-price" className="text-right">Harga</Label><Input id="edit-food-price" name="price" type="number" value={editingFoodItem.price} onChange={(e) => handleEditChange(e, 'makanan')} className="col-span-3" min="0" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-food-stock" className="text-right">Stok</Label><Input id="edit-food-stock" name="stock" type="number" value={editingFoodItem.stock} onChange={(e) => handleEditChange(e, 'makanan')} className="col-span-3" min="0"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-food-total" className="text-right">Total Harga</Label><Input id="edit-food-total" value={formatCurrency(editingFoodItem.price * editingFoodItem.stock)} className="col-span-3 bg-muted" readOnly /></div>
                </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsEditFoodDialogOpen(false)}>Batal</Button><Button onClick={() => handleEditSubmit('makanan')}>Simpan Perubahan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDrinkDialogOpen} onOpenChange={setIsEditDrinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Item Minuman</DialogTitle><DialogDescription>Ubah detail item dan simpan perubahan.</DialogDescription></DialogHeader>
            {editingDrinkItem && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-drink-name" className="text-right">Nama</Label><Input id="edit-drink-name" name="name" value={editingDrinkItem.name} onChange={(e) => handleEditChange(e, 'minuman')} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-drink-type" className="text-right">Jenis</Label><Input id="edit-drink-type" name="type" value={editingDrinkItem.type} onChange={(e) => handleEditChange(e, 'minuman')} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-drink-price" className="text-right">Harga</Label><Input id="edit-drink-price" name="price" type="number" value={editingDrinkItem.price} onChange={(e) => handleEditChange(e, 'minuman')} className="col-span-3" min="0" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-drink-stock" className="text-right">Stok</Label><Input id="edit-drink-stock" name="stock" type="number" value={editingDrinkItem.stock} onChange={(e) => handleEditChange(e, 'minuman')} className="col-span-3" min="0"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-drink-total" className="text-right">Total Harga</Label><Input id="edit-drink-total" value={formatCurrency(editingDrinkItem.price * editingDrinkItem.stock)} className="col-span-3 bg-muted" readOnly /></div>
                </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsEditDrinkDialogOpen(false)}>Batal</Button><Button onClick={() => handleEditSubmit('minuman')}>Simpan Perubahan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Item Barang</DialogTitle><DialogDescription>Ubah detail item dan simpan perubahan.</DialogDescription></DialogHeader>
            {editingItem && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-item-name" className="text-right">Nama</Label><Input id="edit-item-name" name="name" value={editingItem.name} onChange={(e) => handleEditChange(e, 'barang')} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-item-type" className="text-right">Jenis</Label><Input id="edit-item-type" name="type" value={editingItem.type} onChange={(e) => handleEditChange(e, 'barang')} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-item-price" className="text-right">Harga</Label><Input id="edit-item-price" name="price" type="number" value={editingItem.price} onChange={(e) => handleEditChange(e, 'barang')} className="col-span-3" min="0" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-item-stock" className="text-right">Stok</Label><Input id="edit-item-stock" name="stock" type="number" value={editingItem.stock} onChange={(e) => handleEditChange(e, 'barang')} className="col-span-3" min="0"/></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-item-total" className="text-right">Total Harga</Label><Input id="edit-item-total" value={formatCurrency(editingItem.price * editingItem.stock)} className="col-span-3 bg-muted" readOnly /></div>
                </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsEditItemDialogOpen(false)}>Batal</Button><Button onClick={() => handleEditSubmit('barang')}>Simpan Perubahan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditAssetDialogOpen} onOpenChange={setIsEditAssetDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Edit Aset</DialogTitle><DialogDescription>Ubah detail aset dan simpan perubahan.</DialogDescription></DialogHeader>
            {editingAsset && (
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-asset-name">Nama Aset</Label>
                            <Input id="edit-asset-name" name="name" value={editingAsset.name} onChange={handleEditAssetChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-asset-type">Jenis Aset</Label>
                            <Input id="edit-asset-type" name="type" value={editingAsset.type} onChange={handleEditAssetChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-asset-date">Tanggal Pembelian</Label>
                            <Input id="edit-asset-date" name="purchaseDate" value={editingAsset.purchaseDate} onChange={handleEditAssetChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-asset-quantity">Jumlah</Label>
                            <Input id="edit-asset-quantity" name="quantity" type="number" value={editingAsset.quantity} onChange={handleEditAssetChange} min="1" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-asset-value">Nilai Aset (Satuan)</Label>
                            <Input id="edit-asset-value" name="value" type="number" value={editingAsset.value} onChange={handleEditAssetChange} min="0" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="edit-asset-condition">Kondisi</Label>
                             <Select value={editingAsset.condition} onValueChange={(value) => setEditingAsset(prev => prev ? {...prev, condition: value} : null)}>
                                <SelectTrigger><SelectValue placeholder="Pilih kondisi..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="baru">Baru</SelectItem><SelectItem value="baik">Baik</SelectItem>
                                    <SelectItem value="perlu perbaikan">Perlu Perbaikan</SelectItem><SelectItem value="rusak">Rusak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-asset-location">Lokasi Aset</Label>
                        <Input id="edit-asset-location" name="location" value={editingAsset.location} onChange={handleEditAssetChange} />
                    </div>
                 </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsEditAssetDialogOpen(false)}>Batal</Button><Button onClick={handleEditAssetSubmit}>Simpan Perubahan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
