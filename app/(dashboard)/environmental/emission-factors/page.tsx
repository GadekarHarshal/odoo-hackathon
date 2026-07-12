import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import {
  createEmissionFactor,
  getEmissionFactors,
  toggleEmissionFactorStatus,
  softDeleteEmissionFactor,
} from "@/lib/settings"
import { Badge } from "@/components/ui/badge"
import { Leaf } from "lucide-react"

export const revalidate = 0

export default async function EmissionFactorsPage() {
  const factors = await getEmissionFactors()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-emerald-700">
          <Leaf className="h-8 w-8" />
          Emission Factors
        </h1>
        <p className="text-muted-foreground text-sm">Create and manage emission factors for auto-calculating carbon metrics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Create Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createEmissionFactor} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input name="name" placeholder="e.g. Electricity (kWh)" required />
              </div>
              <div>
                <Label>Activity Type</Label>
                <Input name="activityType" placeholder="e.g. Energy" required />
              </div>
              <div>
                <Label>Unit</Label>
                <Input name="unit" placeholder="e.g. kWh" required />
              </div>
              <div>
                <Label>CO2e Factor (kg CO2e per unit)</Label>
                <Input name="co2eFactorValue" type="number" step="0.0001" placeholder="e.g. 0.5" required />
              </div>
              <div>
                <Label>Source</Label>
                <Input name="source" placeholder="e.g. DEFRA" required />
              </div>
              <div>
                <Label>Effective Date</Label>
                <Input name="effectiveDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">All Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Factor</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-4">No emission factors found.</TableCell>
                  </TableRow>
                ) : (
                  factors.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-semibold text-xs">{f.name}</TableCell>
                      <TableCell className="text-xs">{f.activityType}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{f.co2eFactorValue.toFixed(4)}</TableCell>
                      <TableCell className="text-xs">{f.unit}</TableCell>
                      <TableCell className="text-xs">{f.source}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={f.status === "Active" ? "default" : "secondary"}>
                          {f.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <form action={toggleEmissionFactorStatus}>
                            <input type="hidden" name="id" value={f.id} />
                            <Button type="submit" size="sm" variant="outline" className="text-xs py-1 h-7">Toggle</Button>
                          </form>
                          <form action={softDeleteEmissionFactor}>
                            <input type="hidden" name="id" value={f.id} />
                            <Button type="submit" variant="destructive" size="sm" className="text-xs py-1 h-7">Delete</Button>
                          </form>
                        </div>
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
  )
}
