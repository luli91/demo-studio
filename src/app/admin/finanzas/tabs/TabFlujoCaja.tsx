import { TrendingUp, Clock, TrendingDown, Wallet, Printer, Plus, Minus, ReceiptText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TabFlujoCaja({ movimientos, ingresos, egresos, neto, dineroEnCalle }: { movimientos: any[], ingresos: number, egresos: number, neto: number, dineroEnCalle: number }) {
  const dataGrafico = [
    { name: 'Percibido (Caja Real)', Ingresos: ingresos, Gastos: egresos },
    { name: 'Proyectado (Total Esperado)', Ingresos: ingresos + dineroEnCalle, Gastos: egresos },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <Card className="border-border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-2 mb-2 text-emerald-600"><TrendingUp className="h-4 w-4" /><p className="font-black uppercase tracking-widest text-[10px]">Ingresado (Banco)</p></div><p className="text-2xl font-black">${ingresos.toLocaleString('es-AR')}</p></CardContent></Card>
        <Card className="border-amber-200 shadow-sm bg-amber-50/30"><CardContent className="p-5"><div className="flex items-center gap-2 mb-2 text-amber-600"><Clock className="h-4 w-4" /><p className="font-black uppercase tracking-widest text-[10px]">Por Cobrar (Morosos)</p></div><p className="text-2xl font-black text-amber-700">${dineroEnCalle.toLocaleString('es-AR')}</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-2 mb-2 text-destructive"><TrendingDown className="h-4 w-4" /><p className="font-black uppercase tracking-widest text-[10px]">Total Gastos</p></div><p className="text-2xl font-black">${egresos.toLocaleString('es-AR')}</p></CardContent></Card>
        <Card className={`border-none shadow-md text-white ${neto >= 0 ? 'bg-primary' : 'bg-destructive'}`}><CardContent className="p-5 relative overflow-hidden"><div className="absolute right-0 top-0 opacity-10"><Wallet className="h-24 w-24 -mt-2 -mr-2" /></div><p className="font-black uppercase tracking-widest text-[10px] opacity-80 mb-2">Neto Actual</p><p className="text-3xl font-black">${neto.toLocaleString('es-AR')}</p></CardContent></Card>
      </div>

      <Card className="border-border shadow-sm overflow-hidden print:hidden">
        <CardHeader className="p-5 border-b border-border bg-secondary/10">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Realidad vs Proyección Mensual</CardTitle>
        </CardHeader>
        <CardContent className="p-6 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} tickFormatter={(value) => `$${value >= 1000 ? (value/1000) + 'k' : value}`} />
              <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, 'Monto']} />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:w-full">
        <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/10 print:bg-transparent print:border-black print:pb-4">
          <h3 className="font-black text-sm uppercase tracking-widest print:text-black">Libro Diario</h3>
          <Button onClick={() => window.print()} variant="default" size="sm" className="gap-2 print:hidden"><Printer className="h-4 w-4" /> Imprimir</Button>
        </div>
        <div className="divide-y divide-border print:divide-black/20 max-h-[500px] overflow-y-auto">
          {movimientos.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground italic text-sm font-medium">No hay movimientos en la caja este mes.</p>
          ) : (
            movimientos.map((mov) => (
              <div key={mov.id} className="p-4 flex items-center justify-between hover:bg-secondary/5">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl print:hidden ${mov.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                    {mov.tipo === 'ingreso' ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground print:text-black">{mov.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 print:text-black/60">{new Date(mov.fecha).toLocaleDateString('es-AR')} • {mov.metodo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-black text-base print:text-black ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-foreground'}`}>
                    {mov.tipo === 'ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-AR')}
                  </p>
                  {mov.comprobante_url && (
                    <a href={mov.comprobante_url} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="outline" className="h-8 w-8 text-muted-foreground hover:text-primary"><ReceiptText className="h-4 w-4"/></Button>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}