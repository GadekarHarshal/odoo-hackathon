import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { joinChallenge, submitChallengeEvidence, approveChallengeParticipation } from "@/lib/actions"
import { Trophy, CheckCircle, ShieldAlert, Play, Send } from "lucide-react"

export const revalidate = 0

export default async function ChallengesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const employee = await prisma.employee.findUnique({
    where: { id: session.user.id },
  })
  if (!employee) return null

  const isApprover = employee.role === "Admin" || employee.role === "Manager"

  // Fetch all active/visible challenges
  const challenges = await prisma.challenge.findMany({
    where: { status: { in: ["Active", "Completed", "UnderReview", "Draft", "Archived"] } },
    include: { category: true },
    orderBy: { status: "asc" },
  })

  // Fetch current user participations
  const userParticipations = await prisma.challengeParticipation.findMany({
    where: { employeeId: employee.id },
  })

  const participationsMap = new Map(
    userParticipations.map((p) => [p.challengeId, p])
  )

  // Fetch pending review participations if admin/manager
  let pendingReviews: any[] = []
  if (isApprover) {
    pendingReviews = await prisma.challengeParticipation.findMany({
      where: { approvalStatus: "Pending", progressPercent: 100 },
      include: { employee: true, challenge: true },
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "Draft":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20"
      case "UnderReview":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "Completed":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      default:
        return "bg-rose-500/10 text-rose-600 border-rose-500/20"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-indigo-700">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Gamified Challenges
        </h1>
        <p className="text-muted-foreground text-sm">Join active challenges, submit evidence, and earn rewards points.</p>
      </div>

      {isApprover && pendingReviews.length > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-amber-700 flex items-center gap-1.5">
              <ShieldAlert className="h-5 w-5" />
              Challenges Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Evidence Link</TableHead>
                  <TableHead className="text-right">XP Reward</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReviews.map((pr) => (
                  <TableRow key={pr.id}>
                    <TableCell className="font-semibold text-xs">{pr.employee.name}</TableCell>
                    <TableCell className="text-xs">{pr.challenge.title}</TableCell>
                    <TableCell className="text-xs">
                      {pr.proofFileUrl ? (
                        <a href={pr.proofFileUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                          View Proof
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs text-indigo-600">
                      {pr.challenge.xp} XP
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={approveChallengeParticipation}>
                        <input type="hidden" name="id" value={pr.id} />
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-2.5">
                          Approve
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((c) => {
          const userPart = participationsMap.get(c.id)
          const hasJoined = !!userPart
          const isApproved = userPart?.approvalStatus === "Approved"
          const isPending = userPart?.approvalStatus === "Pending" && userPart?.progressPercent === 100

          return (
            <Card key={c.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                    {c.status}
                  </Badge>
                  <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/15 text-xs font-semibold px-2 py-0.5">
                    +{c.xp} XP
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold mt-2">{c.title}</CardTitle>
                <div className="text-[10px] text-muted-foreground font-medium">Category: {c.category.name}</div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {hasJoined ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Your Progress</span>
                        <span>{userPart.progressPercent}%</span>
                      </div>
                      <Progress value={userPart.progressPercent} className="h-1.5" />
                    </div>

                    {isApproved ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 p-2 rounded-md">
                        <CheckCircle className="h-4 w-4" /> Challenge Approved!
                      </div>
                    ) : isPending ? (
                      <div className="text-xs text-amber-600 font-semibold bg-amber-50 p-2 rounded-md">
                        Awaiting Manager Review
                      </div>
                    ) : (
                      <form action={submitChallengeEvidence} className="border-t pt-3 space-y-2">
                        <input type="hidden" name="challengeId" value={c.id} />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px]">Progress %</Label>
                            <Input name="progressPercent" type="number" min="0" max="100" defaultValue={userPart.progressPercent} required className="h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-[10px]">Proof URL</Label>
                            <Input name="proofFileUrl" placeholder="https://..." defaultValue={userPart.proofFileUrl || ""} className="h-8 text-xs" />
                          </div>
                        </div>
                        <Button type="submit" size="sm" className="w-full text-xs h-7">
                          <Send className="h-3 w-3 mr-1" /> Submit Evidence
                        </Button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="border-t pt-3">
                    <form action={joinChallenge}>
                      <input type="hidden" name="challengeId" value={c.id} />
                      <Button type="submit" className="w-full text-xs h-8" disabled={c.status !== "Active"}>
                        <Play className="h-3 w-3 mr-1" /> Join Challenge
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
