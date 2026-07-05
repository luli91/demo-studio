"use client"

import { AlertCircle, UserCheck, MessageCircle, Receipt } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AlertasYPagos({ deudores, ultimosPagos }: { deudores: any[], ultimosPagos: any[] }) {
  return (
    <div className="xl:col-span-1 space-y-6">
      <Card className="border-red-200 shadow-lg shadow-red-900/5 bg-white">
        <CardHeader className="p-5 border-b border-red-100 bg-red-50/50 rounded-t-xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <CardTitle className="text-base font-black uppercase tracking-tight">Cobranza de Cuotas</CardTitle>
          </div>
          <p className="text-xs text-red-600/70 font-medium mt-1">Avisos automáticos a morosas.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {deudores.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
                <UserCheck className="h-8 w-8 text-emerald-400 mb-3" />¡Todo al día!
              </div>
            ) : (
              deudores.map((alumno) => {
                const tL = alumno.telefono ? String(alumno.telefono).replace(/\D/g, '') : ""
                const msg = `Hola, te escribimos de administración. Te recordamos que se encuentra pendiente la cuota de ${alumno.nombre.split(' ')[0]}. ¡Avisanos cuando puedas regularizarlo! Gracias.`
                return (
                  <div key={alumno.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-slate-900 text-sm truncate uppercase">{alumno.nombre}</p>
                      <p className="text-[11px] font-bold text-red-500 truncate mt-0.5">{alumno.detalle}</p>
                    </div>
                    {tL ? (
                      <a href={`https://wa.me/${tL}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"><MessageCircle className="h-4 w-4" /></Button>
                      </a>
                    ) : <span className="text-[10px] text-slate-400 italic">Sin Tel</span>}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-slate-400" /> Últimos Cobros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {ultimosPagos.map((p, idx) => (
              <div key={idx} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {p.beneficiario?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{p.beneficiario}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 mt-0.5">{new Date(p.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-emerald-600">+ ${Number(p.monto).toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}