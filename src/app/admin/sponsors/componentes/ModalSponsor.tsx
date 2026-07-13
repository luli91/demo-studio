"use client"

import { Button } from "@/components/ui/button"
import { Loader2, UploadCloud, ExternalLink } from "lucide-react"

export default function ModalSponsor({ modalAbierto, setModalAbierto, sponsorEditando, nuevoSponsor, setNuevoSponsor, archivoLogo, setArchivoLogo, handleGuardarSponsor, guardando }: any) {
  if (!modalAbierto) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b bg-slate-50">
          <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">
            {sponsorEditando ? "Editar Patrocinador" : "Nuevo Patrocinador"}
          </h3>
        </div>
        <form onSubmit={handleGuardarSponsor} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nombre de la Marca</label>
            <input required value={nuevoSponsor.nombre} onChange={e => setNuevoSponsor({...nuevoSponsor, nombre: e.target.value})} className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900 font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Teléfono (WhatsApp)</label>
              <input value={nuevoSponsor.telefono} onChange={e => setNuevoSponsor({...nuevoSponsor, telefono: e.target.value})} className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Cuota Mensual ($)</label>
              <input required type="number" value={nuevoSponsor.cuota_mensual} onChange={e => setNuevoSponsor({...nuevoSponsor, cuota_mensual: e.target.value})} className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900 font-bold text-emerald-600" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Link / Instagram (Opcional)</label>
            <input value={nuevoSponsor.link} onChange={e => setNuevoSponsor({...nuevoSponsor, link: e.target.value})} placeholder="https://instagram.com/..." className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900" />
          </div>
          <div className="space-y-1 pt-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Logo del Sponsor</label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => document.getElementById('logo-sponsor')?.click()} className="border-dashed font-bold hover:bg-slate-100">
                <UploadCloud className="h-4 w-4 mr-2" /> Subir Logo
              </Button>
              <input type="file" id="logo-sponsor" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files) setArchivoLogo(e.target.files[0]) }} />
              {archivoLogo ? <span className="text-xs font-bold text-emerald-600">Logo listo ✓</span> : sponsorEditando?.logo_url ? <span className="text-xs font-bold text-slate-500">Tiene logo cargado</span> : null}
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="ghost" onClick={() => setModalAbierto(false)} className="flex-1 font-bold">Cancelar</Button>
            <Button type="submit" disabled={guardando} className="flex-1 bg-slate-900 hover:bg-slate-800 font-bold text-white">
              {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Marca"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}