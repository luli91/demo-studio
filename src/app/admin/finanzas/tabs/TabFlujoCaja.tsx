"use client"

import { FileText, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, LayoutList } from "lucide-react"

export default function TabFlujoCaja({ movimientos, ingresos, egresos, neto, dineroEnCalle }: any) {
  
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      
      {/* CUADROS DE RESUMEN FINANCIERO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Ingresado (Caja)</h3>
            <div className="bg-emerald-100 p-1.5 rounded-md text-emerald-600"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black mt-3 text-slate-900">${ingresos.toLocaleString('es-AR')}</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Total Gastos</h3>
            <div className="bg-red-100 p-1.5 rounded-md text-red-600"><TrendingDown className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black mt-3 text-slate-900">${egresos.toLocaleString('es-AR')}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Neto Actual del Mes</h3>
            <div className="bg-slate-800 p-1.5 rounded-md text-white"><LayoutList className="h-4 w-4" /></div>
          </div>
          <div className="flex items-end justify-between mt-3">
            <p className={`text-4xl font-black ${neto >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${neto.toLocaleString('es-AR')}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase">Dinero en Deudores: ${dineroEnCalle.toLocaleString('es-AR')}</p>
          </div>
        </div>
      </div>

      {/* LIBRO DIARIO (Sin Clic para PDF) */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-slate-50 flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-500" />
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">Libro Diario</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {movimientos.length === 0 ? (
            <p className="p-12 text-center text-slate-500 text-sm italic">No hay movimientos registrados este mes.</p>
          ) : (
            movimientos.map((mov: any) => (
              <div 
                key={mov.id} 
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${mov.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {mov.tipo === 'ingreso' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 uppercase text-sm">{mov.descripcion}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(mov.fecha).toLocaleDateString('es-AR', {day: 'numeric', month: 'short'})} • {mov.metodo}
                    </p>
                  </div>
                </div>
                <span className={`font-black text-lg ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {mov.tipo === 'ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-AR')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}