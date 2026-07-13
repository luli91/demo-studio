"use client"

import { Megaphone, CheckCircle2, Eye, EyeOff, DollarSign, MessageCircle, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SponsorsTable({ sponsors, historialPagos, mesActual, anioActual, toggleVisibilidadSponsor, setModalCobro, abrirModalEditar, handleEliminarSponsor }: any) {
  if (sponsors.length === 0) {
    return (
      <div className="py-12 text-center border-dashed p-8 bg-white rounded-2xl border">
        <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Aún no hay patrocinadores cargados en la plataforma.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden overflow-x-auto animate-in slide-in-from-bottom-2">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Marca / Patrocinador</th>
            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Acuerdo Mensual</th>
            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Contacto</th>
            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Estado</th>
            <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">App</th>
            <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sponsors.map((sponsor: any) => {
            const flex = typeof sponsor.datos_flexibles === 'string' ? JSON.parse(sponsor.datos_flexibles) : (sponsor.datos_flexibles || {})
            
            const tienePagoEsteMes = historialPagos.some((p: any) => {
              if (!p.fecha || p.alumno_id !== sponsor.id) return false
              const f = new Date(p.fecha)
              return f.getMonth() === mesActual && f.getFullYear() === anioActual
            })
            
            const telLimpio = sponsor.telefono ? sponsor.telefono.replace(/\D/g, '') : ""
            const msgWpp = `Hola, te escribimos de administración. Te recordamos que está pendiente el pago del patrocinio de este mes en la app. ¡Avisanos! Gracias.`
            const seMuestra = flex.mostrar_app !== false

            return (
              <tr key={sponsor.id} className={`hover:bg-slate-50/80 transition-colors ${!seMuestra && 'opacity-60 grayscale'}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-16 rounded-lg border bg-slate-50 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner">
                      {flex.logo_url ? (
                        <img src={flex.logo_url} alt={sponsor.nombre} className="h-full object-contain mix-blend-multiply" />
                      ) : (
                        <span className="font-black text-slate-300 text-xs uppercase">{sponsor.nombre.substring(0,3)}</span>
                      )}
                    </div>
                    <span className="font-black text-slate-900 uppercase text-sm">{sponsor.nombre}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-bold text-slate-900 text-sm">${Number(flex.cuota_mensual || 0).toLocaleString('es-AR')}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-slate-600 text-sm">{sponsor.telefono || "Sin registrar"}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tienePagoEsteMes ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Al día</span>
                  ) : (
                    <span className="bg-red-100 text-red-800 text-[10px] font-black uppercase px-2 py-0.5 rounded inline-flex items-center gap-1 animate-pulse">Pendiente</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button onClick={() => toggleVisibilidadSponsor(sponsor)} className={`h-8 w-8 inline-flex items-center justify-center rounded-xl border transition-colors ${seMuestra ? 'bg-slate-900 text-white' : 'bg-white text-red-500 border-slate-200'}`}>
                    {seMuestra ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* FIX: Se añade conversión segura .toString() para evitar bloqueos de React */}
                    <Button 
                      onClick={() => setModalCobro({ id: sponsor.id, nombre: sponsor.nombre, monto_a_cobrar: (flex.cuota_mensual || 0).toString() })} 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white" 
                      disabled={tienePagoEsteMes}
                      title="Registrar Cobro"
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                    {telLimpio ? (
                      <a href={`https://wa.me/${telLimpio}?text=${encodeURIComponent(msgWpp)}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon" className="h-8 w-8 text-slate-700"><MessageCircle className="h-4 w-4" /></Button></a>
                    ) : <Button variant="outline" size="icon" disabled className="h-8 w-8 text-slate-300"><MessageCircle className="h-4 w-4" /></Button>}
                    <Button onClick={() => abrirModalEditar(sponsor)} variant="outline" size="icon" className="h-8 w-8"><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => handleEliminarSponsor(sponsor.id)} className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-600 hover:text-white"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}