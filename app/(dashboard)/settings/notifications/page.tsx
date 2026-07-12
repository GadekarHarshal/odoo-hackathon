import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getNotificationSettings, toggleNotificationSetting } from "@/lib/settings"

export default async function NotificationsPage() {
  const settings = await getNotificationSettings()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notification Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settings.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.notificationType} — {s.channel}</div>
                </div>
                <form action={toggleNotificationSetting}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="enabled" value={String(!s.enabled)} />
                  <Button type="submit">{s.enabled ? "Disable" : "Enable"}</Button>
                </form>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
