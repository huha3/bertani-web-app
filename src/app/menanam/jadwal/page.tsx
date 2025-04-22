'use client'

import { useEffect, useState } from "react";
import { Trash } from 'lucide-react';
import supabase from "@/lib/supabase";
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function JadwalPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Gagal ambil user:", error.message);
      } else {
        setUser(data?.user?.user_metadata || {});
      }
      setLoading(false);
    };

    fetchUser();
  }, []);
  
  const App = () => {
    return (
      <Trash />
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Jadwal</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">{user?.username || "User"} Ini Jadwal Penanamanmu</h2>
          <p className="text-muted-foreground">Selesaikan tugas-tugas sampai panen nanti</p>
        </div>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {/* Total Tanaman yang Dikelola */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Nama Tanaman</CardTitle>
            <CardDescription>Deskripsi Tanaman Singkat</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">
                <Trash className="w-4 h-4 mr-0" />
            </Button>
            <Button>Kerjakan</Button>
          </CardFooter>
        </Card>
      </div>
      </main>
    </div>
  )
}

// Sample data for transactions
// const transactions = [
//   {
//     id: "1",
//     description: "Payment from John Doe",
//     amount: "250.00",
//     status: "Completed",
//     date: "Today, 2:30 PM",
//     type: "credit",
//   },
//   {
//     id: "2",
//     description: "Subscription renewal",
//     amount: "12.99",
//     status: "Processing",
//     date: "Today, 11:23 AM",
//     type: "debit",
//   },
//   {
//     id: "3",
//     description: "Invoice #12345 payment",
//     amount: "450.00",
//     status: "Completed",
//     date: "Yesterday, 3:40 PM",
//     type: "credit",
//   },
//   {
//     id: "4",
//     description: "Office supplies purchase",
//     amount: "59.99",
//     status: "Completed",
//     date: "Mar 12, 2023",
//     type: "debit",
//   },
// ]

// Simple demo chart component
// function DemoChart() {
//   return (
//     <div className="flex h-full w-full items-end justify-between gap-2 px-4 pb-4">
//       {Array.from({ length: 12 }).map((_, i) => {
//         const height = Math.floor(Math.random() * 70) + 30
//         return (
//           <div key={i} className="group flex flex-col items-center gap-2">
//             <div
//               className="w-full rounded-t-md bg-primary transition-all group-hover:bg-primary/80"
//               style={{ height: `${height}%` }}
//             />
//             <span className="text-xs text-muted-foreground">
//               {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
//             </span>
//           </div>
//         )
//       })}
//     </div>
//   )
// }

