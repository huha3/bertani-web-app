"use client"

import { ReactNode } from 'react';
import { AppSidebar } from "@/components/app-sidebar"; 
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function ProfilLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}