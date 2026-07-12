import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createESGPolicy } from "@/lib/actions"
import { Shield, FileText, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const revalidate = 0

export default async function PoliciesPage() {
  const policies = await prisma.eSGPolicy.findMany({
    orderBy: { effectiveDate: "desc" },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15">Active</Badge>
      case "Draft":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/15">Draft</Badge>
      case "Archived":
        return <Badge variant="secondary">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-indigo-800">
          <Shield className="h-8 w-8" />
          ESG Policies
        </h1>
        <p className="text-muted-foreground text-sm">Review, publish and version environmental, social, and corporate governance policies.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left: Create Policy */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold">New Policy Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createESGPolicy} className="space-y-3">
              <div>
                <Label className="text-xs">Policy Title</Label>
                <Input name="title" placeholder="e.g. Code of Conduct" required />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Input name="category" placeholder="e.g. Governance, Environmental" required />
              </div>
              <div>
                <Label className="text-xs">Version</Label>
                <Input name="version" placeholder="e.g. 1.0" required />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea name="description" placeholder="Summarize policy intent..." required className="h-20" />
              </div>
              <div>
                <Label className="text-xs">Effective Date</Label>
                <Input name="effectiveDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <select name="status" className="w-full rounded-md border px-2 py-1.5 text-sm bg-background" required>
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Document File URL (Optional)</Label>
                <Input name="fileUrl" placeholder="https://example.com/policy.pdf" />
              </div>
              <Button type="submit" className="w-full text-xs">Create Policy</Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: Policies Directory */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Policies Directory ({policies.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                        No ESG policies registered.
                      </TableCell>
                    </TableRow>
                  ) : (
                    policies.map((p) => (
                      <TableRow key={p.id} className={p.status === "Archived" ? "opacity-60" : ""}>
                        <TableCell>
                          <div>
                            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {p.title}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{p.category}</TableCell>
                        <TableCell className="text-xs font-mono">v{p.version}</TableCell>
                        <TableCell className="text-xs">{p.effectiveDate.toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">{getStatusBadge(p.status)}</TableCell>
                        <TableCell className="text-right">
                          {p.fileUrl ? (
                            <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                              <a href={p.fileUrl} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4 text-blue-500" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
