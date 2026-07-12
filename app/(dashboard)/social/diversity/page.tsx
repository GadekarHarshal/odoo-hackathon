import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DiversityCharts } from "@/components/charts/diversity-charts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users } from "lucide-react"

export const revalidate = 0

export default async function DiversityPage() {
  // Query all active employees
  const employees = await prisma.employee.findMany({
    include: { department: true },
    orderBy: { name: "asc" },
  })

  // Compute department breakdown
  const deptMap: Record<string, number> = {}
  employees.forEach((emp) => {
    const dName = emp.department?.name || "Unassigned"
    deptMap[dName] = (deptMap[dName] || 0) + 1
  })

  const deptData = Object.entries(deptMap).map(([name, value]) => ({
    name,
    value,
  }))

  // Compute role breakdown
  const roleMap: Record<string, number> = {}
  employees.forEach((emp) => {
    const role = emp.role
    roleMap[role] = (roleMap[role] || 0) + 1
  })

  const roleData = Object.entries(roleMap).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-blue-700">
          <Users className="h-8 w-8" />
          Diversity & Headcount Metrics
        </h1>
        <p className="text-muted-foreground text-sm">Demographic breakdowns and department headcounts calculated live from employees registry.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workforce</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employees.length} Employees</div>
            <p className="text-xs text-muted-foreground mt-1">Active registered staff accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Managers Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{roleMap["Manager"] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Department operations supervisors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departments count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">{deptData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Operational divisions</p>
          </CardContent>
        </Card>
      </div>

      <DiversityCharts deptData={deptData} roleData={roleData} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Workforce Directory</CardTitle>
        </CardHeader>
        <CardContent className="px-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Gamification XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-semibold text-xs">{emp.name}</TableCell>
                  <TableCell className="text-xs">{emp.email}</TableCell>
                  <TableCell className="text-xs">{emp.department?.name || "—"}</TableCell>
                  <TableCell className="text-xs">{emp.role}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-indigo-600 font-bold">
                    {emp.xp.toLocaleString()} XP
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
