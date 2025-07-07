'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React, { useState, useEffect } from "react"
import {
  BarChart3,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  ScanLine,
  Settings,
  ShoppingCart,
  Users,
  UsersRound,
} from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// Re-define menu interfaces for clarity
interface SubMenuItem {
  href: string;
  label: string;
}

interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
  subItems?: SubMenuItem[];
  id?: string;
}


export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const userJson = sessionStorage.getItem('sukabumi-active-user');
    if (userJson) {
      const user = JSON.parse(userJson);
      setUserRole(user.role?.toLowerCase() || null);
    } else {
      router.push('/login');
    }
  }, [router]);

  const isActive = (path: string, exact = false) => {
    if (path === '/dashboard') {
      return pathname === path
    }
    return exact ? pathname === path : pathname.startsWith(path)
  }

  const isSubMenuActive = (subItems: { href: string }[]) => {
    return subItems.some(sub => isActive(sub.href, true));
  }

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    sessionStorage.removeItem('sukabumi-active-user')
    router.push('/login')
  }

  if (!userRole) {
    return null; // Or a loading skeleton
  }
  
  // Construct menus based on role
  const role = userRole;
  let menuItems: MenuItem[] = [];
  
  menuItems.push({ href: "/dashboard", icon: LayoutDashboard, label: "Beranda" });

  if (role === 'staff') {
      menuItems.push({ href: "/dashboard/absen", icon: UsersRound, label: "Absen" });
  } else {
      const karyawanSubItems: SubMenuItem[] = [{ href: "/dashboard/absen", label: "Absen" }];
      if (['owner', 'manager', 'supervisor'].includes(role)) {
          karyawanSubItems.push({ href: "/dashboard/employees", label: "Data Karyawan" });
          karyawanSubItems.push({ href: "/dashboard/attendance", label: "Rekap Absen" });
      }
      menuItems.push({
          href: "/dashboard/absen",
          icon: UsersRound,
          label: "Manajemen Karyawan",
          subItems: karyawanSubItems,
      });
  }

  if (['owner', 'manager', 'supervisor', 'kasir'].includes(role)) {
      menuItems.push(
          {
              href: "/dashboard/members",
              icon: Users,
              label: "Manajemen Member",
              subItems: [
                  { href: "/dashboard/members", label: "Data Member" },
                  { href: "/dashboard/members/new", label: "Pendaftaran Member" },
              ],
          },
          { href: "/dashboard/check-in", icon: ScanLine, label: "Check-In Arena" },
          { href: "/dashboard/orders", icon: ShoppingCart, label: "Shopping" },
          { href: "/dashboard/cashier", icon: CircleDollarSign, label: "Transaksi Kasir" },
          { href: "/dashboard/logs", icon: FileText, label: "Log Aktivitas" },
          { href: "/dashboard/reports", icon: BarChart3, label: "Laporan Transaksi" },
          { href: "/dashboard/inventory", icon: PackageSearch, label: "Inventory & Aset" }
      );
  }
  
  let bottomMenuItems: MenuItem[] = []
  if (['owner', 'manager', 'supervisor'].includes(role)) {
      bottomMenuItems.push({ id: "settings", href: "/dashboard/settings", icon: Settings, label: "Pengaturan" });
  }
  bottomMenuItems.push({ id: "logout", href: "/login", icon: LogOut, label: "Keluar" });


  return (
    <>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={
                item.subItems
                  ? isSubMenuActive(item.subItems)
                  : isActive(item.href, true)
              }
              tooltip={item.label}
            >
              <Link href={item.subItems ? item.subItems[0].href : item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
            {item.subItems && (
              <SidebarMenuSub>
                {item.subItems.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.href}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive(subItem.href, true)}
                    >
                      <Link href={subItem.href}>{subItem.label}</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <div className="mt-auto">
        <SidebarMenu>
          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild tooltip={item.label}>
                <Link
                  href={item.href}
                  onClick={item.id === 'logout' ? handleLogout : undefined}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
    </>
  )
}
