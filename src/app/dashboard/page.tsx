'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, CreditCard, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { isToday, isThisMonth } from 'date-fns';

interface Transaction {
  date: string;
  totalAmount: number;
}

export default function DashboardPage() {
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [todayTransactionsTotal, setTodayTransactionsTotal] = useState(0);
  const [todayTotalVisitors, setTodayTotalVisitors] = useState(0);
  const [monthlyTransactionsTotal, setMonthlyTransactionsTotal] = useState(0);
  const [monthlyVisitorsTotal, setMonthlyVisitorsTotal] = useState(0);


  const updateDashboardData = () => {
    // Total Members
    const membersData = localStorage.getItem('sukabumi-members');
    setTotalMembers(membersData ? JSON.parse(membersData).length : 0);
    
    // Total Employees
    const usersData = localStorage.getItem('sukabumi-users');
    setTotalEmployees(usersData ? JSON.parse(usersData).length : 0);

    // Transaction Data
    const transactionsData = localStorage.getItem('sukabumi-transactions');
    const transactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];

    // Today's Transactions & Visitors
    const todayTransactions = transactions.filter(tx => isToday(new Date(tx.date)));
    const todayTotal = todayTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
    setTodayTransactionsTotal(todayTotal);
    setTodayTotalVisitors(todayTransactions.length);

    // Monthly Transactions Total & Visitors
    const monthlyTransactions = transactions.filter(tx => isThisMonth(new Date(tx.date)));
    const monthlyTotal = monthlyTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
    setMonthlyTransactionsTotal(monthlyTotal);
    setMonthlyVisitorsTotal(monthlyTransactions.length);
  }

  useEffect(() => {
    updateDashboardData();
    window.addEventListener('storage', updateDashboardData);
    return () => {
      window.removeEventListener('storage', updateDashboardData);
    };
  }, []);

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Beranda</h1>
        <p className="text-muted-foreground">SELAMAT DATANG DI SUKABUMI PLAYGROUND</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transaksi Hari Ini
            </CardTitle>
            <span className="text-muted-foreground font-bold">Rp</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayTransactionsTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {todayTotalVisitors > 0 ? `${todayTotalVisitors} total pengunjung hari ini` : 'Belum ada transaksi hari ini'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transaksi Bulan Ini
            </CardTitle>
            <span className="text-muted-foreground font-bold">Rp</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyTransactionsTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Total pendapatan bulan ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengunjung Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTotalVisitors}</div>
            <p className="text-xs text-muted-foreground">
              {todayTotalVisitors > 0 ? `${todayTotalVisitors} total pengunjung hari ini` : 'Belum ada pengunjung hari ini'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengunjung Bulan Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyVisitorsTotal}</div>
            <p className="text-xs text-muted-foreground">
              Total pengunjung bulan ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Member Terdaftar</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Jumlah total member terdaftar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyawan Terdaftar</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Total karyawan keseluruhan saat ini
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
