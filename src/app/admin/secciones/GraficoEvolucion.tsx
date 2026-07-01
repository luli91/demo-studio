import { TrendingUp } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function GraficoEvolucion({ datosGrafico }: { datosGrafico: any[] }) {
  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" /> Evolución de Ingresos (6 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-8 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datosGrafico} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
            <YAxis 
              axisLine={false} tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
              tickFormatter={(value) => `$${value >= 1000 ? (value/1000) + 'k' : value}`} 
            />
            <Tooltip 
              cursor={{fill: '#f1f5f9'}}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, 'Ingresos']}
            />
            <Bar dataKey="ingresos" radius={[6, 6, 0, 0]}>
              {datosGrafico.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === datosGrafico.length - 1 ? '#10b981' : '#cbd5e1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}