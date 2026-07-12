import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createAudit } from "@/lib/actions"
import { Shield, ShieldCheck, Clipboard } from "lucide-react"

export const revalidate = 0

export default async function AuditsPage() {
  const departments = await prisma.department.findMany({ where: { deletedAt: null } })
  const employees = await prisma.employee.findMany({
    where: { role: { in: ["Admin", "Manager"] } },
    orderBy: { name: "asc" },
  })

  const audits = await prisma.audit.findMany({
    include: { department: true, auditor: true },
    orderBy: { scheduledDate: "desc" },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15">Completed</Badge>
      case "InProgress":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/15">In Progress</Badge>
      case "Planned":
        return <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/15">Planned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-indigo-800">
          <Shield className="h-8 w-8" />
          ESG Audits
        </h1>
        <p className="text-muted-foreground text-sm">Log internal regulatory ESG compliance audits and scope upcoming inspections.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Side: Create Audit */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold">Schedule Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAudit} className="space-y-3">
              <div>
                <Label className="text-xs">Audit Title</Label>
                <Input name="title" placeholder="e.g. Q3 Carbon Audit" required />
              </div>
              <div>
                <Label className="text-xs">Scope</Label>
                <Input name="scope" placeholder="e.g. Operational, HR Policy" required />
              </div>
              <div>
                <Label className="text-xs">Department</Label>
                <select name="departmentId" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" required>
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Assigned Auditor</Label>
                <select name="auditorId" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" required>
                  <option value="">Select Auditor</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Scheduled Date</Label>
                <Input name="scheduledDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <Button type="submit" className="w-full text-xs">Schedule</Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Side: Audits List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Audit History & Schedule ({audits.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Audit Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">No audits scheduled.</TableCell>
                    </TableRow>
                  ) : (
                    audits.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-bold text-xs text-foreground flex items-center gap-1">
                            <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
                            {a.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{a.department.name}</TableCell>
                        <TableCell className="text-xs">{a.scope}</TableCell>
                        <TableCell className="text-xs">{a.auditor.name}</TableCell>
                        <TableCell className="text-xs">{a.scheduledDate.toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">
                          {a.completedDate ? a.completedDate.toLocaleDateString() : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs">{getStatusBadge(a.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
