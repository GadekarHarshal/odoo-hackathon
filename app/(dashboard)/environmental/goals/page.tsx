import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { createEnvironmentalGoal } from "@/lib/actions"
import { Leaf, Calendar } from "lucide-react"

export const revalidate = 0

export default async function EnvironmentalGoalsPage() {
  const departments = await prisma.department.findMany({ where: { deletedAt: null } })
  const goals = await prisma.environmentalGoal.findMany({
    include: { department: true },
    orderBy: { deadline: "asc" },
  })

  const getStatusDetails = (current: number, target: number, deadline: Date) => {
    const isCompleted = current >= target
    const isOverdue = deadline.getTime() < Date.now() && !isCompleted

    // Calculate days remaining
    const diffTime = deadline.getTime() - Date.now()
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const progress = current / target
    const isAtRisk = daysRemaining <= 5 && progress < 0.5 && !isCompleted && !isOverdue

    if (isCompleted) return { label: "Completed", variant: "default" as const, color: "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/15" }
    if (isOverdue) return { label: "Overdue", variant: "destructive" as const, color: "text-rose-600 bg-rose-500/10 hover:bg-rose-500/15" }
    if (isAtRisk) return { label: "At Risk", variant: "secondary" as const, color: "text-amber-600 bg-amber-500/10 hover:bg-amber-500/15" }
    return { label: "On Track", variant: "secondary" as const, color: "text-teal-600 bg-teal-500/10 hover:bg-teal-500/15" }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-emerald-700">
          <Leaf className="h-8 w-8" />
          Sustainability Goals
        </h1>
        <p className="text-muted-foreground text-sm">Define target values for resource metrics and track progress timelines.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Side: Create Goal */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold">New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createEnvironmentalGoal} className="space-y-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input name="title" placeholder="e.g. Save Water" required />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input name="description" placeholder="Description details" required />
              </div>
              <div>
                <Label className="text-xs">Target Metric</Label>
                <Input name="targetMetric" placeholder="e.g. Liters, kWh, CO2e" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Target Value</Label>
                  <Input name="targetValue" type="number" step="0.1" required />
                </div>
                <div>
                  <Label className="text-xs">Current Value</Label>
                  <Input name="currentValue" type="number" step="0.1" defaultValue="0" />
                </div>
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
                <Label className="text-xs">Deadline</Label>
                <Input name="deadline" type="date" required />
              </div>
              <Button type="submit" className="w-full text-xs">Create Goal</Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Side: Goals List */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Active Goals</h2>
          {goals.length === 0 ? (
            <Card>
              <CardContent className="text-center text-muted-foreground py-8 text-sm">
                No sustainability goals have been created yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((g) => {
                const progressPercent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
                const status = getStatusDetails(g.currentValue, g.targetValue, g.deadline)
                const daysLeft = Math.ceil((g.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

                return (
                  <Card key={g.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-muted-foreground font-semibold">
                          {g.department ? g.department.name : "Organization-wide"}
                        </span>
                        <Badge className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold mt-1">{g.title}</CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-2">{g.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span>Progress: {progressPercent}%</span>
                          <span className="text-muted-foreground">
                            {g.currentValue} / {g.targetValue} {g.targetMetric}
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Deadline: {g.deadline.toLocaleDateString()}</span>
                        {daysLeft > 0 ? (
                          <span className="font-semibold text-foreground">({daysLeft} days left)</span>
                        ) : daysLeft === 0 ? (
                          <span className="font-semibold text-rose-600">(Due today)</span>
                        ) : (
                          <span className="font-semibold text-rose-600">({Math.abs(daysLeft)} days overdue)</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
