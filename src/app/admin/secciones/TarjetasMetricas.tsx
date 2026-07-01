import { DollarSign, TrendingUp, TrendingDown, Users, PauseCircle, UserCheck, UserMinus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function TarjetasMetricas({ metricas }: { metricas: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* TARJETA INGRESOS */}
      <Card className="border-slate-200 shadow-sm relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><DollarSign className="h-6 w-6" /></div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ingresos Mes</p>
              <p className="text-2xl font-black text-slate-900">${metricas.recaudacionMes.toLocaleString('es-AR')}</p>
            </div>
          </div>
          <div className={`mt-4 text-xs font-bold flex items-center gap-1 ${metricas.crecimientoPorcentaje >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {metricas.crecimientoPorcentaje >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {metricas.crecimientoPorcentaje > 0 ? '+' : ''}{metricas.crecimientoPorcentaje}% vs. mes pasado
          </div>
        </CardContent>
      </Card>

      {/* TARJETA MATRÍCULA */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Users className="h-6 w-6" /></div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Matrícula Activa</p>
              <p className="text-2xl font-black text-slate-900">{metricas.totalAlumnasActivas}</p>
            </div>
          </div>
          <div className="mt-4 text-xs font-bold flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
            <PauseCircle className="h-3.5 w-3.5" /> {metricas.alumnasPausadas} {metricas.alumnasPausadas === 1 ? 'cuenta pausada' : 'cuentas pausadas'}
          </div>
        </CardContent>
      </Card>

      {/* TARJETA AL DÍA */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><UserCheck className="h-6 w-6" /></div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Al día</p>
            <p className="text-2xl font-black text-slate-900">{metricas.alumnasAlDia}</p>
          </div>
        </CardContent>
      </Card>

      {/* TARJETA MOROSAS */}
      <Card className="border-red-100 shadow-sm bg-red-50/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 text-red-600 p-3 rounded-xl"><UserMinus className="h-6 w-6" /></div>
            <div>
              <p className="text-red-800/70 text-xs font-bold uppercase tracking-wider">Morosas</p>
              <p className="text-2xl font-black text-red-700">{metricas.alumnasEnMora}</p>
            </div>
          </div>
          <div className="mt-4 text-[11px] font-black uppercase tracking-widest text-red-600/70 border-t border-red-200/50 pt-2">
            Dinero en la calle: <span className="text-red-700 font-black">${metricas.dineroEnCalle.toLocaleString('es-AR')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}