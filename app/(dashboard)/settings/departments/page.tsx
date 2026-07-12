import * as React from "react"
import { Department } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import {
  createDepartment,
  getDepartments,
  toggleDepartmentStatus,
  softDeleteDepartment,
  updateDepartment,
} from "@/lib/settings"

type DepartmentWithRelations = Department & {
  parent: Department | null
  children: Department[]
}

export default async function DepartmentsPage() {
  const departments = (await getDepartments()) as DepartmentWithRelations[]
  const rootDepartments = departments.filter((department) => !department.parentDepartmentId)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Departments</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Create Department</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createDepartment} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input name="name" />
              </div>
              <div>
                <Label>Code</Label>
                <Input name="code" />
              </div>
              <div>
                <Label>Parent Department</Label>
                <select name="parentDepartmentId" className="w-full rounded-md border px-2 py-2">
                  <option value="">None</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rootDepartments.map((department) => (
                  <React.Fragment key={department.id}>
                    <TableRow>
                      <TableCell>{department.name}</TableCell>
                      <TableCell>{department.code}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>{department.status}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <form action={toggleDepartmentStatus}>
                            <input type="hidden" name="id" value={department.id} />
                            <Button type="submit" size="sm">Toggle</Button>
                          </form>
                          <form action={softDeleteDepartment}>
                            <input type="hidden" name="id" value={department.id} />
                            <Button type="submit" variant="destructive" size="sm">Delete</Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                    {department.children?.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell className="pl-8">↳ {child.name}</TableCell>
                        <TableCell>{child.code}</TableCell>
                        <TableCell>{department.name}</TableCell>
                        <TableCell>{child.status}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <form action={toggleDepartmentStatus}>
                              <input type="hidden" name="id" value={child.id} />
                              <Button type="submit" size="sm">Toggle</Button>
                            </form>
                            <form action={softDeleteDepartment}>
                              <input type="hidden" name="id" value={child.id} />
                              <Button type="submit" variant="destructive" size="sm">Delete</Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Edit Department</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateDepartment} className="space-y-3">
              <div>
                <Label>Department</Label>
                <select name="id" className="w-full rounded-md border px-2 py-2">
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Name</Label>
                <Input name="name" />
              </div>
              <div>
                <Label>Code</Label>
                <Input name="code" />
              </div>
              <div>
                <Label>Parent Department</Label>
                <select name="parentDepartmentId" className="w-full rounded-md border px-2 py-2">
                  <option value="">None</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
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
