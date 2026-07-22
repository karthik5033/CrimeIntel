import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { CrimeTrendChart } from "@/components/charts/CrimeTrendChart";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Command Center</h2>
          <p className="text-muted-foreground mt-1">Statewide crime intelligence overview for the last 30 days.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">Download CSV</Button>
          <Button className="bg-primary hover:bg-primary/90 shadow-sm">Generate Report</Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Investigations</CardTitle>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <FileText className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">1,248</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-success font-medium mr-1">+12%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Persons of Interest</CardTitle>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <Users className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">3,192</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-success font-medium mr-1">+4%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">High-Risk Alerts</CardTitle>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <AlertTriangle className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">14</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-destructive font-medium">Critical attention needed</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Resolution Rate</CardTitle>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <ShieldCheck className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">68.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-success font-medium">+2.1%</span> since last quarter
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Content Area (Chart) */}
        <Card className="col-span-4 lg:col-span-5 shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold">Incident Trends</CardTitle>
            <CardDescription>
              Total reported incidents vs resolved cases over the last 7 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <CrimeTrendChart />
          </CardContent>
        </Card>

        {/* Side Panel (Recent Alerts) */}
        <Card className="col-span-4 lg:col-span-2 shadow-sm border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Early Warnings</CardTitle>
              <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-transparent">3 New</Badge>
            </div>
            <CardDescription>
              AI-generated predictive alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="divide-y divide-border/50">
              {[
                { title: "Vehicle Theft Spike", desc: "Whitefield showing +40% increase. 2 repeat offenders released nearby.", time: "2h ago", badge: "High Risk", variant: "destructive" },
                { title: "New Criminal Ring", desc: "4 suspects linked across 3 recent burglary cases through shared phone nodes.", time: "5h ago", badge: "Investigation", variant: "default" },
                { title: "Festival Risk Forecast", desc: "Dasara approaching. Expect 20% rise in chain snatching in Mysuru.", time: "1d ago", badge: "Warning", variant: "secondary" },
                { title: "Pattern Detected", desc: "Similar MO observed in 3 recent break-ins in Indiranagar.", time: "2d ago", badge: "Investigation", variant: "default" }
              ].map((alert, i) => (
                <div key={i} className="p-4 hover:bg-muted/50 transition-colors group cursor-pointer">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100`} />
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{alert.title}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{alert.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{alert.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases Table */}
      <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recent High-Priority FIRs</CardTitle>
            <CardDescription>Latest reported incidents requiring immediate attention.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px] font-semibold">FIR No.</TableHead>
                <TableHead className="font-semibold">Crime Type</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: "FIR-4521", type: "Vehicle Theft", loc: "Whitefield, Blr", date: "Today, 10:42 AM", status: "Under Investigation" },
                { id: "FIR-4520", type: "Armed Robbery", loc: "Koramangala, Blr", date: "Today, 08:15 AM", status: "Under Investigation" },
                { id: "FIR-4519", type: "Cyber Fraud", loc: "Electronic City, Blr", date: "Yesterday, 14:30 PM", status: "Suspect Identified" },
                { id: "FIR-4518", type: "Burglary", loc: "Mysuru Central", date: "Yesterday, 09:10 AM", status: "Evidence Collected" },
                { id: "FIR-4517", type: "Assault", loc: "Hubli North", date: "Oct 12, 22:45 PM", status: "Charge-sheeted" },
              ].map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-1.5 h-3 w-3" />
                      {row.loc}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-normal">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Investigate</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
