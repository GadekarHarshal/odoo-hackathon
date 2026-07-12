import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { createCarbonTransaction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Leaf } from "lucide-react"

export const revalidate = 0

interface PageProps {
  searchParams: {
    departmentId?: string
    sourceType?: string
    startDate?: string
    endDate?: string
  }
}

export default async function CarbonTransactionsPage({ searchParams }: PageProps) {
  // Query master data for the forms and filters
  const departments = await prisma.department.findMany({ where: { deletedAt: null } })
  const factors = await prisma.emissionFactor.findMany({ where: { deletedAt: null, status: "Active" } })
  const config = await prisma.orgESGConfig.findFirst()
  const autoCalc = config ? config.autoEmissionCalculationEnabled : true

  // Build dynamic where clause for filtering
  const where: any = {}
  if (searchParams.departmentId) {
    where.departmentId = searchParams.departmentId
  }
  if (searchParams.sourceType) {
    where.sourceType = searchParams.sourceType
  }
  if (searchParams.startDate || searchParams.endDate) {
    where.transactionDate = {}
    if (searchParams.startDate) {
      where.transactionDate.gte = new Date(searchParams.startDate)
    }
    if (searchParams.endDate) {
      where.transactionDate.lte = new Date(searchParams.endDate)
    }
  }

  // Fetch filtered transactions from DB
  const transactions = await prisma.carbonTransaction.findMany({
    where,
    include: { department: true, emissionFactor: true },
    orderBy: { transactionDate: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-emerald-700">
          <Leaf className="h-8 w-8" />
          Carbon Transactions
        </h1>
        <p className="text-muted-foreground text-sm">Log and filter all environmental operational emission transactions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters and Creation Form Column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Filters Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Filter Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <form method="GET" className="space-y-3">
                <div>
                  <Label className="text-xs">Department</Label>
                  <select name="departmentId" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" defaultValue={searchParams.departmentId || ""}>
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Source Type</Label>
                  <select name="sourceType" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" defaultValue={searchParams.sourceType || ""}>
                    <option value="">All Sources</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Expense">Expense</option>
                    <option value="Fleet">Fleet</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" name="startDate" className="h-8 text-xs" defaultValue={searchParams.startDate || ""} />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" name="endDate" className="h-8 text-xs" defaultValue={searchParams.endDate || ""} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" className="flex-1 text-xs">Apply</Button>
                  <Button type="button" size="sm" variant="outline" asChild className="flex-1 text-xs">
                    <a href="/environmental/carbon-transactions">Clear</a>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Creation Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Log Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createCarbonTransaction} className="space-y-3">
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
                  <Label className="text-xs">Source Type</Label>
                  <select name="sourceType" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" required>
                    <option value="Purchase">Purchase</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Expense">Expense</option>
                    <option value="Fleet">Fleet</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Emission Factor</Label>
                  <select name="emissionFactorId" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" required>
                    <option value="">Select Factor</option>
                    {factors.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.co2eFactorValue} kg/unit)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input name="quantity" type="number" step="0.01" placeholder="Quantity value" required className="h-8 text-xs" />
                </div>
                {!autoCalc && (
                  <div>
                    <Label className="text-xs">Calculated CO2e (kg)</Label>
                    <Input name="calculatedCO2e" type="number" step="0.01" placeholder="Calculated emission" required className="h-8 text-xs" />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Transaction Date</Label>
                  <Input name="transactionDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="h-8 text-xs" />
                </div>
                <Button type="submit" className="w-full text-xs h-8">Submit Transaction</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table Column */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Transaction Logs ({transactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Source Type</TableHead>
                    <TableHead>Emission Factor</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">CO2e (kg)</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No transactions match the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs">{t.transactionDate.toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold text-xs">{t.department.name}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline">{t.sourceType}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {t.emissionFactor.name}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {t.quantity} <span className="text-muted-foreground">{t.emissionFactor.unit}</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs text-rose-600">
                          {Math.round(t.calculatedCO2e).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={t.calculationMethod === "Auto" ? "default" : "secondary"}>
                            {t.calculationMethod}
                          </Badge>
                        </TableCell>
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
