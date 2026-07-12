import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnvironmentalCharts } from "@/components/charts/environmental-charts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpRight, ArrowDownRight, Leaf } from "lucide-react"

export const revalidate = 0

export default async function EnvironmentalIndex() {
  const now = new Date()
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const prior30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  // Fetch recent transactions
  const transactions = await prisma.carbonTransaction.findMany({
    where: { transactionDate: { gte: sixMonthsAgo } },
    include: { department: true, emissionFactor: true },
    orderBy: { transactionDate: "desc" },
  })

  // Compute current vs prior 30-day emissions
  const currentTx = transactions.filter((t) => t.transactionDate >= last30Days)
  const priorTx = transactions.filter((t) => t.transactionDate >= prior30Days && t.transactionDate < last30Days)

  const currentCO2e = currentTx.reduce((sum, t) => sum + t.calculatedCO2e, 0)
  const priorCO2e = priorTx.reduce((sum, t) => sum + t.calculatedCO2e, 0)

  const diff = currentCO2e - priorCO2e
  const percentChange = priorCO2e > 0 ? (diff / priorCO2e) * 100 : 0
  const isIncrease = diff > 0

  // Group emissions by department
  const deptMap: Record<string, number> = {}
  transactions.forEach((t) => {
    const deptName = t.department.name
    deptMap[deptName] = (deptMap[deptName] || 0) + t.calculatedCO2e
  })

  const deptData = Object.entries(deptMap)
    .map(([department, co2e]) => ({ department, co2e: Math.round(co2e) }))
    .sort((a, b) => b.co2e - a.co2e)

  const topEmittingDept = deptData[0]?.department || "None"
  const topEmittingCO2e = deptData[0]?.co2e || 0

  // Group emissions by month
  const monthlyMap: Record<string, number> = {}
  // Initialize last 6 months to ensure chronological ordering
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(now.getMonth() - i)
    const label = d.toLocaleDateString("default", { month: "short", year: "2-digit" })
    monthlyMap[label] = 0
  }

  transactions.forEach((t) => {
    const label = t.transactionDate.toLocaleDateString("default", { month: "short", year: "2-digit" })
    if (label in monthlyMap) {
      monthlyMap[label] += t.calculatedCO2e
    }
  })

  const trendData = Object.entries(monthlyMap).map(([month, co2e]) => ({
    month,
    co2e: Math.round(co2e),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-emerald-700">
          <Leaf className="h-8 w-8" />
          Environmental Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">Carbon transactions rollup, departmental breakdown, and offset metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Emissions (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(currentCO2e).toLocaleString()} kg CO2e</div>
            <div className="mt-1 flex items-center text-xs font-semibold">
              {isIncrease ? (
                <span className="flex items-center text-rose-600">
                  <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
                  +{percentChange.toFixed(1)}% vs prior 30 days
                </span>
              ) : (
                <span className="flex items-center text-emerald-600">
                  <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
                  {percentChange.toFixed(1)}% vs prior 30 days
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Emitting Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">{topEmittingDept}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative: {topEmittingCO2e.toLocaleString()} kg CO2e</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Logged Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Spanning last 6 months</p>
          </CardContent>
        </Card>
      </div>

      <EnvironmentalCharts trendData={trendData} deptData={deptData} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Recent Emissions Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Source Type</TableHead>
                <TableHead>Emission Factor</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">CO2e (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{t.transactionDate.toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-xs">{t.department.name}</TableCell>
                  <TableCell className="text-xs">{t.sourceType}</TableCell>
                  <TableCell className="text-xs">{t.emissionFactor.name}</TableCell>
                  <TableCell className="text-right text-xs">
                    {t.quantity} {t.emissionFactor.unit}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs text-rose-600">
                    {Math.round(t.calculatedCO2e).toLocaleString()}
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
