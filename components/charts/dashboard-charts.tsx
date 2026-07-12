"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface DepartmentChartProps {
  data: Array<{
    name: string
    env: number
    social: number
    gov: number
    total: number
  }>
}

export function DepartmentComparisonChart({ data }: DepartmentChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
          <Legend />
          <Bar dataKey="env" name="Environmental" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="social" name="Social" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="gov" name="Governance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
