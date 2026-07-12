import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { acknowledgePolicy } from "@/lib/actions"
import { Shield, CheckCircle, AlertTriangle } from "lucide-react"

export const revalidate = 0

export default async function AcknowledgementsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const employee = await prisma.employee.findUnique({
    where: { id: session.user.id },
  })
  if (!employee) return null

  const isApprover = employee.role === "Admin" || employee.role === "Manager"

  // Fetch all active policies
  const activePolicies = await prisma.eSGPolicy.findMany({
    where: { status: "Active" },
    orderBy: { effectiveDate: "desc" },
  })

  // Fetch user's own acknowledgements
  const myAcks = await prisma.policyAcknowledgement.findMany({
    where: { employeeId: employee.id },
    include: { policy: true },
  })

  const acknowledgedPolicyIds = new Set(myAcks.map((a) => a.policyId))

  // Find policies still pending user acknowledgement
  const pendingUserPolicies = activePolicies.filter((p) => !acknowledgedPolicyIds.has(p.id))

  // Admin completion data
  let policyMetrics: any[] = []
  if (isApprover) {
    const totalEmployeesCount = await prisma.employee.count()
    
    for (const p of activePolicies) {
      const ackCount = await prisma.policyAcknowledgement.count({
        where: { policyId: p.id },
      })
      
      const rate = totalEmployeesCount > 0 ? Math.round((ackCount / totalEmployeesCount) * 100) : 0
      
      // Fetch outstanding employees
      const outstanding = await prisma.employee.findMany({
        where: {
          NOT: {
            acknowledgements: {
              some: { policyId: p.id },
            },
          },
        },
        include: { department: true },
        take: 5,
      })

      policyMetrics.push({
        policy: p,
        ackCount,
        totalEmployeesCount,
        rate,
        outstanding,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-indigo-800">
          <Shield className="h-8 w-8" />
          Policy Acknowledgements
        </h1>
        <p className="text-muted-foreground text-sm">Acknowledge corporate ESG policies and view compliance completion rates.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Pending Acknowledgements */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-base font-bold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-5 w-5" />
                Required Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingUserPolicies.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">All active policies have been acknowledged. You are fully compliant!</p>
              ) : (
                pendingUserPolicies.map((p) => (
                  <div key={p.id} className="border p-3 rounded-lg space-y-2">
                    <div className="font-semibold text-xs">{p.title}</div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{p.description}</p>
                    <form action={acknowledgePolicy} className="pt-2">
                      <input type="hidden" name="policyId" value={p.id} />
                      <Button type="submit" size="sm" className="w-full text-xs h-8">
                        <CheckCircle className="h-4.5 w-4.5 mr-1" /> Acknowledge Policy
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">My Acknowledged Policies</CardTitle>
            </CardHeader>
            <CardContent className="px-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Acknowledged On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAcks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-4 text-xs">No policies acknowledged yet.</TableCell>
                    </TableRow>
                  ) : (
                    myAcks.map((ack) => (
                      <TableRow key={ack.id}>
                        <TableCell className="text-xs font-semibold">{ack.policy.title}</TableCell>
                        <TableCell className="text-xs">{ack.acknowledgedAt.toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Admin Metrics (Admin / Managers Only) */}
        <div className="lg:col-span-2">
          {isApprover ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Organization Compliance Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {policyMetrics.map((metric) => (
                  <div key={metric.policy.id} className="border-b pb-6 last:border-0 last:pb-0 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-foreground">{metric.policy.title}</div>
                        <div className="text-xs text-muted-foreground">Version v{metric.policy.version} • Effective: {metric.policy.effectiveDate.toLocaleDateString()}</div>
                      </div>
                      <Badge className="font-semibold text-xs">
                        {metric.ackCount} / {metric.totalEmployeesCount} Acknowledged
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Completion Rate</span>
                        <span>{metric.rate}%</span>
                      </div>
                      <Progress value={metric.rate} className="h-2" />
                    </div>

                    {metric.rate < 100 && (
                      <div className="pt-2">
                        <div className="text-xs font-bold text-rose-500 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Outstanding Employees (Sampling)
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 space-y-1">
                          {metric.outstanding.map((emp: any) => (
                            <div key={emp.id} className="flex justify-between text-[10px] text-muted-foreground">
                              <span>{emp.name} ({emp.email})</span>
                              <span className="font-semibold">{emp.department?.name || "Unassigned"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center text-muted-foreground py-12 text-sm">
                Administrative metrics are restricted to Managers and Admins.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
