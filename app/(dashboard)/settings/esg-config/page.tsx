import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getOrgESGConfig, upsertOrgESGConfig } from "@/lib/settings"

export default async function ESGConfigPage() {
  const config = await getOrgESGConfig()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ESG Configuration</h1>
      <Card>
        <CardHeader>
          <CardTitle>Organization ESG Weights</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertOrgESGConfig} className="space-y-3">
            <div>
              <Label>Environmental Weight</Label>
              <Input name="environmentalWeight" defaultValue={String(config.environmentalWeight)} type="number" />
            </div>
            <div>
              <Label>Social Weight</Label>
              <Input name="socialWeight" defaultValue={String(config.socialWeight)} type="number" />
            </div>
            <div>
              <Label>Governance Weight</Label>
              <Input name="governanceWeight" defaultValue={String(config.governanceWeight)} type="number" />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input name="autoEmissionCalculationEnabled" type="checkbox" defaultChecked={config.autoEmissionCalculationEnabled} />
                <span>Auto emission calculation</span>
              </label>
              <label className="flex items-center gap-2">
                <input name="evidenceRequirementEnabled" type="checkbox" defaultChecked={config.evidenceRequirementEnabled} />
                <span>Require evidence for activities</span>
              </label>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input name="badgeAutoAwardEnabled" type="checkbox" defaultChecked={config.badgeAutoAwardEnabled} />
                <span>Badge auto-award</span>
              </label>
              <label className="flex items-center gap-2">
                <input name="inAppNotificationsEnabled" type="checkbox" defaultChecked={config.inAppNotificationsEnabled} />
                <span>In-app notifications</span>
              </label>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input name="emailNotificationsEnabled" type="checkbox" defaultChecked={config.emailNotificationsEnabled} />
                <span>Email notifications</span>
              </label>
              <span className="text-sm text-muted-foreground">
                Saving ESG config triggers department score recalculation.
              </span>
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
