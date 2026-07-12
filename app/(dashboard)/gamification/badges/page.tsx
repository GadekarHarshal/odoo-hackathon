import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge as UIBadge } from "@/components/ui/badge"
import { Trophy, Award, Users } from "lucide-react"

export const revalidate = 0

export default async function BadgesPage() {
  // Query all badges and include employee awards
  const badges = await prisma.badge.findMany({
    where: { status: "Active" },
    include: {
      awards: {
        include: {
          employee: {
            include: { department: true }
          }
        }
      }
    },
    orderBy: { name: "asc" },
  })

  const getRuleText = (rule: any) => {
    try {
      const parsed = typeof rule === "string" ? JSON.parse(rule) : rule
      if (parsed.type === "XP") {
        return `Reach ${parsed.threshold} XP`
      }
      if (parsed.type === "CHALLENGES_COMPLETED") {
        return `Complete ${parsed.threshold} Challenges`
      }
      return "Special Achievement"
    } catch (err) {
      return "Special Achievement"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-indigo-700">
          <Award className="h-8 w-8 text-yellow-500" />
          Achievement Badges
        </h1>
        <p className="text-muted-foreground text-sm">Track milestones, badges unlock rules, and employees achievements.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {badges.map((b) => {
          const awardCount = b.awards.length

          return (
            <Card key={b.id} className="flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Trophy className="h-24 w-24 text-yellow-500" />
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <UIBadge variant="outline" className="text-xs bg-indigo-500/5 text-indigo-600 border-indigo-500/20 font-semibold">
                    {getRuleText(b.unlockRule)}
                  </UIBadge>
                  <UIBadge className="text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200">
                    {awardCount} earned
                  </UIBadge>
                </div>
                <CardTitle className="text-lg font-bold mt-3 flex items-center gap-1.5 text-foreground">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {b.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{b.description || "Milestone award for active ESG participation."}</p>
              </CardHeader>
              <CardContent className="pt-2 border-t mt-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Unlocked By ({awardCount})
                  </div>
                  {awardCount === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">No employees have unlocked this badge yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {b.awards.map((aw) => (
                        <div key={aw.id} className="flex justify-between text-[11px] bg-muted/40 p-1.5 rounded">
                          <span className="font-semibold text-foreground">{aw.employee.name}</span>
                          <span className="text-muted-foreground text-[10px]">{aw.employee.department?.name || "No Dept"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
