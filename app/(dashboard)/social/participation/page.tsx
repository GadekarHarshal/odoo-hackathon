import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { submitCSRParticipation, approveCSRParticipation, rejectCSRParticipation } from "@/lib/actions"
import { Users, FileText, Check, X, ShieldAlert } from "lucide-react"

export const revalidate = 0

export default async function ParticipationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  // Fetch logged-in employee details
  const employee = await prisma.employee.findUnique({
    where: { id: session.user.id },
    include: { department: true },
  })
  if (!employee) return null

  const isAdmin = employee.role === "Admin"
  const isManager = employee.role === "Manager"
  const isApprover = isAdmin || isManager

  // Fetch CSR activities for dropdown
  const activities = await prisma.cSRActivity.findMany({
    where: { status: "Active" },
    orderBy: { title: "asc" },
  })

  // Fetch employee's own participations
  const myParticipations = await prisma.employeeParticipation.findMany({
    where: { employeeId: employee.id },
    include: { csrActivity: true, approvedBy: true },
    orderBy: { createdAt: "desc" },
  })

  // Fetch pending approvals if manager/admin
  let pendingApprovals: any[] = []
  if (isApprover) {
    const whereClause: any = { approvalStatus: "Pending" }
    if (isManager && employee.departmentId) {
      whereClause.employee = { departmentId: employee.departmentId }
      // Exclude self approvals
      whereClause.employeeId = { not: employee.id }
    }
    pendingApprovals = await prisma.employeeParticipation.findMany({
      where: whereClause,
      include: { employee: { include: { department: true } }, csrActivity: true },
      orderBy: { createdAt: "asc" },
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15">Approved</Badge>
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/15">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-blue-700">
          <Users className="h-8 w-8" />
          Employee CSR Participation
        </h1>
        <p className="text-muted-foreground text-sm">Submit your volunteering proof and review department approvals.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Submit Participation Proof Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold">Submit Volunteering Proof</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submitCSRParticipation} className="space-y-4">
              <div>
                <Label className="text-xs">CSR Activity Event</Label>
                <select name="csrActivityId" className="w-full rounded-md border px-2 py-2 text-sm bg-background" required>
                  <option value="">Select Event</option>
                  {activities.map((act) => (
                    <option key={act.id} value={act.id}>{act.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Proof File URL (Image / Document Link)</Label>
                <Input name="proofFileUrl" placeholder="https://example.com/proof.jpg" required />
                <p className="text-[10px] text-muted-foreground mt-1">Provide a valid image or document URL confirming your participation.</p>
              </div>
              <Button type="submit" className="w-full text-xs">Submit for Approval</Button>
            </form>
          </CardContent>
        </Card>

        {/* My Participations History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending approvals queue (Only for Managers / Admins) */}
          {isApprover && (
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-1.5 text-amber-700">
                  <ShieldAlert className="h-5 w-5" />
                  Manager Approvals Queue
                </CardTitle>
                <Badge variant="outline">{pendingApprovals.length} pending</Badge>
              </CardHeader>
              <CardContent className="px-1">
                {pendingApprovals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No pending participations to approve in your department.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Proof</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApprovals.map((pa) => (
                        <TableRow key={pa.id}>
                          <TableCell>
                            <div>
                              <div className="font-semibold text-xs">{pa.employee.name}</div>
                              <div className="text-[10px] text-muted-foreground">{pa.employee.department?.name || "No Dept"}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium">{pa.csrActivity.title}</TableCell>
                          <TableCell className="text-xs">
                            {pa.proofFileUrl ? (
                              <a href={pa.proofFileUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline flex items-center gap-0.5">
                                <FileText className="h-3 w-3" /> View Evidence
                              </a>
                            ) : (
                              <span className="text-rose-500 font-semibold text-[10px]">No Proof URL</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <form action={approveCSRParticipation}>
                                <input type="hidden" name="id" value={pa.id} />
                                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-2.5">
                                  <Check className="h-3.5 w-3.5 mr-0.5" /> Approve
                                </Button>
                              </form>
                              <form action={rejectCSRParticipation}>
                                <input type="hidden" name="id" value={pa.id} />
                                <Button type="submit" size="sm" variant="destructive" className="h-7 text-xs px-2.5">
                                  <X className="h-3.5 w-3.5 mr-0.5" /> Reject
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">My Volunteering History</CardTitle>
            </CardHeader>
            <CardContent className="px-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead className="text-right">Points Earned</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myParticipations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-xs">
                        You have not submitted any CSR volunteering participations yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    myParticipations.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-semibold">{p.csrActivity.title}</TableCell>
                        <TableCell className="text-xs">{p.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">
                          {p.proofFileUrl ? (
                            <a href={p.proofFileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                              View Link
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-blue-600">
                          {p.pointsEarned > 0 ? `+${p.pointsEarned}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{getStatusBadge(p.approvalStatus)}</TableCell>
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
