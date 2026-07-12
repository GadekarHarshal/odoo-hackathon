import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import {
  createEmissionFactor,
  getEmissionFactors,
  toggleEmissionFactorStatus,
  softDeleteEmissionFactor,
  updateEmissionFactor,
} from "@/lib/settings"

export default async function EmissionFactorsPage() {
  const factors = await getEmissionFactors()

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Emission Factors</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Create Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createEmissionFactor} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input name="name" />
              </div>
              <div>
                <Label>Activity Type</Label>
                <Input name="activityType" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input name="unit" />
              </div>
              <div>
                <Label>CO2e Factor</Label>
                <Input name="co2eFactorValue" type="number" />
              </div>
              <div>
                <Label>Source</Label>
                <Input name="source" />
              </div>
              <div>
                <Label>Effective Date</Label>
                <Input name="effectiveDate" type="date" />
              </div>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factors.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.name}</TableCell>
                    <TableCell>{f.activityType}</TableCell>
                    <TableCell>{f.unit}</TableCell>
                    <TableCell>{f.source}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <form action={toggleEmissionFactorStatus}>
                          <input type="hidden" name="id" value={f.id} />
                          <Button type="submit" size="sm">Toggle</Button>
                        </form>
                        <form action={softDeleteEmissionFactor}>
                          <input type="hidden" name="id" value={f.id} />
                          <Button type="submit" variant="destructive" size="sm">Delete</Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Edit Emission Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateEmissionFactor} className="space-y-3">
              <div>
                <Label>Factor</Label>
                <select name="id" className="w-full rounded-md border px-2 py-2">
                  <option value="">Select a factor</option>
                  {factors.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Name</Label>
                <Input name="name" />
              </div>
              <div>
                <Label>Activity Type</Label>
                <Input name="activityType" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input name="unit" />
              </div>
              <div>
                <Label>CO2e Factor</Label>
                <Input name="co2eFactorValue" type="number" />
              </div>
              <div>
                <Label>Source</Label>
                <Input name="source" />
              </div>
              <div>
                <Label>Effective Date</Label>
                <Input name="effectiveDate" type="date" />
              </div>
              <div>
                <Label>Status</Label>
                <select name="status" className="w-full rounded-md border px-2 py-2">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
