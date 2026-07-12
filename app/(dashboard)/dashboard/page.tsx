import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { DepartmentComparisonChart } from "@/components/charts/dashboard-charts"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react"

export const revalidate = 0

export default async function DashboardPage() {
  // Query config
  const config = (await prisma.orgESGConfig.findFirst()) || {
    environmentalWeight: 40,
    socialWeight: 30,
    governanceWeight: 30,
  }

  // Get department scores
  const allScores = await prisma.departmentScore.findMany({
    orderBy: { periodEnd: "desc" },
    include: { department: true },
  })

  // Find unique periodEnd dates to distinguish periods
  const periods = Array.from(new Set(allScores.map((s) => s.periodEnd.getTime()))).sort((a, b) => b - a)

  const currentPeriodTime = periods[0] || 0
  const priorPeriodTime = periods[1] || 0

  const currentScores = allScores.filter((s) => s.periodEnd.getTime() === currentPeriodTime)
  const priorScores = allScores.filter((s) => s.periodEnd.getTime() === priorPeriodTime)

  // Compute weighted scores for current period
  let currentTotalWeighted = 0
  let currentEnvWeighted = 0
  let currentSocialWeighted = 0
  let currentGovWeighted = 0
  let currentTotalEmployees = 0

  currentScores.forEach((score) => {
    // Get actual headcount in employee table for reliability
    const headcount = score.department.employeeCount || 1
    currentTotalWeighted += score.totalScore * headcount
    currentEnvWeighted += score.environmentalScore * headcount
    currentSocialWeighted += score.socialScore * headcount
    currentGovWeighted += score.governanceScore * headcount
    currentTotalEmployees += headcount
  })

  const overallScore = currentTotalEmployees > 0 ? currentTotalWeighted / currentTotalEmployees : 0
  const overallEnv = currentTotalEmployees > 0 ? currentEnvWeighted / currentTotalEmployees : 0
  const overallSocial = currentTotalEmployees > 0 ? currentSocialWeighted / currentTotalEmployees : 0
  const overallGov = currentTotalEmployees > 0 ? currentGovWeighted / currentTotalEmployees : 0

  // Prior scores
  let priorTotalWeighted = 0
  let priorTotalEmployees = 0
  priorScores.forEach((score) => {
    const headcount = score.department.employeeCount || 1
    priorTotalWeighted += score.totalScore * headcount
    priorTotalEmployees += headcount
  })
  const priorOverallScore = priorTotalEmployees > 0 ? priorTotalWeighted / priorTotalEmployees : 0

  const scoreDiff = overallScore - priorOverallScore
  const isPositiveChange = scoreDiff >= 0

  // Chart data
  const chartData = currentScores.map((s) => ({
    name: s.department.code,
    env: Math.round(s.environmentalScore),
    social: Math.round(s.socialScore),
    gov: Math.round(s.governanceScore),
    total: Math.round(s.totalScore),
  }))

  // Rank departments by totalScore desc
  const rankedDepts = [...currentScores].sort((a, b) => b.totalScore - a.totalScore)

  // Activity logs
  const activityLogs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { actor: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Organization Dashboard</h1>
          <p className="text-muted-foreground text-sm">Unified ESG Performance rollups and recent operational activities.</p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall ESG Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{overallScore.toFixed(1)}</div>
            <div className="mt-1 flex items-center text-xs font-semibold">
              {isPositiveChange ? (
                <span className="flex items-center text-emerald-600">
                  <ArrowUpRight className="mr-0.5 h-3 w-3" />
                  +{scoreDiff.toFixed(1)} vs last period
                </span>
              ) : (
                <span className="flex items-center text-rose-600">
                  <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
                  {scoreDiff.toFixed(1)} vs last period
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Environmental (E)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{overallEnv.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Weight: {config.environmentalWeight}%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Social (S)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{overallSocial.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Weight: {config.socialWeight}%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Governance (G)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{overallGov.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Weight: {config.governanceWeight}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Department Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentComparisonChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Department Rankings</CardTitle>
          </CardHeader>
          <CardContent className="px-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[10px]">Rank</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedDepts.map((score, index) => (
                  <TableRow key={score.id} className={index === 0 ? "bg-emerald-500/5 font-semibold" : ""}>
                    <TableCell className="font-bold text-muted-foreground">#{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{score.department.name}</div>
                        <div className="text-[10px] text-muted-foreground">Headcount: {score.department.employeeCount || 0}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {score.totalScore.toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {log.action} — <span className="text-muted-foreground font-normal">{log.details || log.entity}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      By {log.actor?.name || "System"} • {log.actor?.role || "System Process"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
