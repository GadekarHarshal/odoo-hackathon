import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createComplianceIssue } from "@/lib/actions"
import { ShieldAlert, AlertCircle, Clock, CheckCircle } from "lucide-react"

export const revalidate = 0

export default async function ComplianceIssuesPage() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
  })
  
  const audits = await prisma.audit.findMany({
    orderBy: { scheduledDate: "desc" },
  })

  const issues = await prisma.complianceIssue.findMany({
    include: { owner: true, audit: true },
    orderBy: { dueDate: "asc" },
  })

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical":
        return <Badge variant="destructive" className="font-bold">Critical</Badge>
      case "High":
        return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 font-semibold">High</Badge>
      case "Medium":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/15">Medium</Badge>
      case "Low":
        return <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/15">Low</Badge>
      default:
        return <Badge variant="outline">{sev}</Badge>
    }
  }

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return (
        <Badge className="bg-rose-600 text-white flex items-center gap-1 w-fit">
          <Clock className="h-3 w-3" /> Overdue
        </Badge>
      )
    }

    switch (status) {
      case "Resolved":
      case "Closed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" /> {status}
          </Badge>
        )
      case "InProgress":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/15 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" /> In Progress
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/15 flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" /> Open
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-indigo-800">
          <ShieldAlert className="h-8 w-8" />
          Compliance Issues
        </h1>
        <p className="text-muted-foreground text-sm">Raise and track regulatory non-compliance observations and mitigation status.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Side: Raise Issue */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold">Raise Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createComplianceIssue} className="space-y-3">
              <div>
                <Label className="text-xs">Issue Title</Label>
                <Input name="title" placeholder="e.g. Missing Emission Record" required />
              </div>
              <div>
                <Label className="text-xs">Severity</Label>
                <select name="severity" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" required>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input name="description" placeholder="Observation details..." required />
              </div>
              <div>
                <Label className="text-xs">Owner / Responsible Staff</Label>
                <select name="ownerId" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" required>
                  <option value="">Select Owner</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Linked Audit (Optional)</Label>
                <select name="auditId" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background">
                  <option value="">None</option>
                  {audits.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input name="dueDate" type="date" required />
              </div>
              <Button type="submit" className="w-full text-xs">Raise Issue</Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Side: Issues Table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Mitigation Log ({issues.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Audit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">No compliance issues raised.</TableCell>
                    </TableRow>
                  ) : (
                    issues.map((issue) => {
                      const isOverdue = new Date(issue.dueDate).getTime() < Date.now() && issue.status === "Open"

                      return (
                        <TableRow key={issue.id} className={isOverdue ? "bg-rose-500/5 hover:bg-rose-500/10" : ""}>
                          <TableCell>
                            <div>
                              <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                {isOverdue && <AlertCircle className="h-4 w-4 text-rose-600 animate-pulse" />}
                                {issue.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{issue.description}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{getSeverityBadge(issue.severity)}</TableCell>
                          <TableCell className="text-xs font-semibold">{issue.owner.name}</TableCell>
                          <TableCell className="text-xs">{issue.dueDate.toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">{getStatusBadge(issue.status, isOverdue)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {issue.audit ? issue.audit.title : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })
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
