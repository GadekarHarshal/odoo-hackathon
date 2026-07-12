import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createCSRActivity } from "@/lib/actions"
import { Users, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const revalidate = 0

interface PageProps {
  searchParams: {
    categoryId?: string
  }
}

export default async function CSRActivitiesPage({ searchParams }: PageProps) {
  // Query all departments
  const departments = await prisma.department.findMany({ where: { deletedAt: null } })

  // Query only categories of type CSR_ACTIVITY
  const categories = await prisma.category.findMany({
    where: { type: "CSR_ACTIVITY", deletedAt: null },
  })

  // Filter activities
  const where: any = {}
  if (searchParams.categoryId) {
    where.categoryId = searchParams.categoryId
  }

  const activities = await prisma.cSRActivity.findMany({
    where,
    include: { category: true, department: true },
    orderBy: { startDate: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-blue-700">
          <Users className="h-8 w-8" />
          CSR Activities
        </h1>
        <p className="text-muted-foreground text-sm">Organize and monitor Corporate Social Responsibility volunteering events.</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <Button size="sm" variant={!searchParams.categoryId ? "default" : "outline"} asChild className="text-xs">
          <a href="/social/csr-activities">All Activities</a>
        </Button>
        {categories.map((cat) => (
          <Button key={cat.id} size="sm" variant={searchParams.categoryId === cat.id ? "default" : "outline"} asChild className="text-xs">
            <a href={`/social/csr-activities?categoryId=${cat.id}`}>{cat.name}</a>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Side: Create CSR */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold">New CSR Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCSRActivity} className="space-y-3">
              <div>
                <Label className="text-xs">Event Title</Label>
                <Input name="title" placeholder="e.g. Tree Planting Drive" required />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <select name="categoryId" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" required>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea name="description" placeholder="Activity details..." required className="h-20" />
              </div>
              <div>
                <Label className="text-xs">Department (Optional)</Label>
                <select name="departmentId" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background">
                  <option value="">Organization-wide</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input name="startDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input name="endDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <Button type="submit" className="w-full text-xs">Publish Activity</Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Side: List CSR */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Activities Directory ({activities.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Department Focus</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                        No CSR activities found for this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activities.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div>
                            <div className="font-bold text-sm text-foreground">{a.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline">{a.category.name}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {a.startDate.toLocaleDateString()} - {a.endDate.toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {a.department ? a.department.name : "Organization-wide"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="default">{a.status}</Badge>
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
