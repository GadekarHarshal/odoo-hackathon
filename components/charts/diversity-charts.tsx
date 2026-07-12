"use client"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface DiversityChartsProps {
  deptData: Array<{ name: string; value: number }>
  roleData: Array<{ name: string; value: number }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export function DiversityCharts({ deptData, roleData }: DiversityChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Headcount by Department</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deptData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {deptData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} employees`, "Count"]} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Headcount by Role</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#888888" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="#888888" fontSize={11} width={80} />
              <Tooltip formatter={(value) => [`${value} employees`, "Count"]} />
              <Bar dataKey="value" name="Employees" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
