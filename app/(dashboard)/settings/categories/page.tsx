import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import {
  createCategory,
  getCategories,
  toggleCategoryStatus,
  softDeleteCategory,
  updateCategory,
} from "@/lib/settings"

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Create Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCategory} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input name="name" />
              </div>
              <div>
                <Label>Type</Label>
                <select name="type" className="w-full rounded-md border px-2 py-2">
                  <option value="ESG_GENERAL">ESG General</option>
                  <option value="CSR_ACTIVITY">CSR Activity</option>
                  <option value="CHALLENGE">Challenge</option>
                </select>
              </div>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <form action={toggleCategoryStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button type="submit" size="sm">Toggle</Button>
                        </form>
                        <form action={softDeleteCategory}>
                          <input type="hidden" name="id" value={c.id} />
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
            <CardTitle>Edit Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateCategory} className="space-y-3">
              <div>
                <Label>Category</Label>
                <select name="id" className="w-full rounded-md border px-2 py-2">
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Name</Label>
                <Input name="name" />
              </div>
              <div>
                <Label>Type</Label>
                <select name="type" className="w-full rounded-md border px-2 py-2">
                  <option value="ESG_GENERAL">ESG General</option>
                  <option value="CSR_ACTIVITY">CSR Activity</option>
                  <option value="CHALLENGE">Challenge</option>
                </select>
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
