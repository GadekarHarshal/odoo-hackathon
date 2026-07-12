"use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"

interface EnvChartsProps {
  trendData: Array<{ month: string; co2e: number }>
  deptData: Array<{ department: string; co2e: number }>
}

export function EnvironmentalCharts({ trendData, deptData }: EnvChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-card border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Monthly Emission Trend (kg CO2e)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCo2e" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#888888" fontSize={11} />
              <YAxis stroke="#888888" fontSize={11} />
              <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="co2e" name="CO2e (kg)" stroke="#10b981" fillOpacity={1} fill="url(#colorCo2e)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Emissions by Department</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="department" stroke="#888888" fontSize={11} />
              <YAxis stroke="#888888" fontSize={11} />
              <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              <Bar dataKey="co2e" name="CO2e (kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
