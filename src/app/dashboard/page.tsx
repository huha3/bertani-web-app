'use client'

import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Download, MoreHorizontal, TrendingUp, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton";

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
]

export default function DashboardPage() {
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


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        {/* <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div> */}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.username || "User"}!
          </h2>
          <p className="text-muted-foreground">Here's an overview of your account activity and business performance.</p>
        </div>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {/* Total Tanaman yang Dikelola */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create project</CardTitle>
            <CardDescription>Deploy your new project in one-click.</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                {/* <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Name of your project" />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="framework">Framework</Label>
                  <Select>
                    <SelectTrigger id="framework">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="next">Next.js</SelectItem>
                      <SelectItem value="sveltekit">SvelteKit</SelectItem>
                      <SelectItem value="astro">Astro</SelectItem>
                      <SelectItem value="nuxt">Nuxt.js</SelectItem>
                    </SelectContent>
                  </Select> 
                </div> */}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
          </CardFooter>
        </Card>

        {/* Total Tanaman yang Terdata */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Create project</CardTitle>
            <CardDescription>Deploy your new project in one-click.</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                {/* <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Name of your project" />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="framework">Framework</Label>
                  <Select>
                    <SelectTrigger id="framework">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="next">Next.js</SelectItem>
                      <SelectItem value="sveltekit">SvelteKit</SelectItem>
                      <SelectItem value="astro">Astro</SelectItem>
                      <SelectItem value="nuxt">Nuxt.js</SelectItem>
                    </SelectContent>
                  </Select> 
                </div> */}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
          </CardFooter>
        </Card>

        {/* Jadwal Hari Ini */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Create project</CardTitle>
            <CardDescription>Deploy your new project in one-click.</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                {/* <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Name of your project" />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="framework">Framework</Label>
                  <Select>
                    <SelectTrigger id="framework">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="next">Next.js</SelectItem>
                      <SelectItem value="sveltekit">SvelteKit</SelectItem>
                      <SelectItem value="astro">Astro</SelectItem>
                      <SelectItem value="nuxt">Nuxt.js</SelectItem>
                    </SelectContent>
                  </Select> 
                </div> */}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
          </CardFooter>
        </Card>
      </div>
      <main className="flex-1 overflow-auto p-4 md:p-3"></main>
      <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Riwayat</h2>
          <p className="text-muted-foreground">Here's an overview of your account activity and business performance.</p>
        </div>
        {/* Riwayat Panen */}
        <div className="md:col-span-4">
        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.invoice}>
                <TableCell className="font-medium">{invoice.invoice}</TableCell>
                <TableCell>{invoice.paymentStatus}</TableCell>
                <TableCell>{invoice.paymentMethod}</TableCell>
                <TableCell className="text-right">{invoice.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">$2,500.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
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

