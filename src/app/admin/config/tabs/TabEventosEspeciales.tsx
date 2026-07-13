"use client"

import { Plus, UploadCloud, Loader2, CalendarDays, Trash2, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TabEventosEspeciales({
  eventosProgramados,
  setModalNuevoEventoEspecial,
  handleBorrarEventoEspecial,
  datosEventoEspecial,
  setDatosEventoEspecial,
  archivoEventoEspecial,      
  setArchivoEventoEspecial,   
  handleCrearEventoEspecial,  
  guardandoEventoEspecial     
}: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2">
      {/* Formulario a la izquierda */}
      <div className="space-y-6">
        <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card border-primary/30">
          <div className="px-6 py-5 border-b border-border bg-primary/5">
            <h2 className="font-black text-primary uppercase tracking-tight flex items-center gap-2">
              <Plus className="h-5 w-5" /> Crear Nuevo Evento
            </h2>
          </div>
          <form onSubmit={handleCrearEventoEspecial} className="p-6 space-y-4">
            <input required value={datosEventoEspecial.titulo} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, titulo: e.target.value})} placeholder="Título del Evento" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm font-bold" />
            <textarea value={datosEventoEspecial.descripcion_evento} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, descripcion_evento: e.target.value})} placeholder="Descripción..." className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none" />
            <div className="grid grid-cols-2 gap-4">
               <input required type="date" value={datosEventoEspecial.fecha} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, fecha: e.target.value})} className="w-full border rounded-xl h-10 px-3 text-sm" />
               <input required type="time" value={datosEventoEspecial.hora_inicio} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, hora_inicio: e.target.value})} className="w-full border rounded-xl h-10 px-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <input required type="number" value={datosEventoEspecial.precio} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, precio: e.target.value})} placeholder="Precio $" className="w-full border rounded-xl h-10 px-3 text-sm" />
               <input required type="number" value={datosEventoEspecial.cupo_maximo} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, cupo_maximo: e.target.value})} placeholder="Cupo" className="w-full border rounded-xl h-10 px-3 text-sm" />
            </div>
            <Button type="button" variant="outline" onClick={() => document.getElementById('file-evento')?.click()} className="w-full border-dashed text-xs">
              <UploadCloud className="h-4 w-4 mr-2" /> {archivoEventoEspecial ? "Cambiar Imagen" : "Subir Flyer"}
            </Button>
            <input id="file-evento" type="file" className="hidden" accept="image/*" onChange={(e) => setArchivoEventoEspecial(e.target.files?.[0] || null)} />
            <Button type="submit" disabled={guardandoEventoEspecial} className="w-full font-black uppercase tracking-widest">{guardandoEventoEspecial ? <Loader2 className="animate-spin" /> : "Publicar Evento"}</Button>
          </form>
        </Card>
      </div>

      {/* Listado de tarjetas a la derecha */}
      <div className="space-y-4">
        <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Eventos Activos ({eventosProgramados.length})</h3>
        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
           {eventosProgramados.map((ev: any) => (
             <Card key={ev.id} className="rounded-2xl overflow-hidden group">
               {ev.imagen_url && <img src={ev.imagen_url} className="w-full h-32 object-cover" />}
               <CardContent className="p-4 flex justify-between items-center">
                 <div>
                   <p className="font-bold text-sm uppercase">{ev.titulo}</p>
                   <p className="text-[10px] text-slate-500">{ev.fecha} • Cupo: {ev.cupo_maximo}</p>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => handleBorrarEventoEspecial(ev.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
               </CardContent>
             </Card>
           ))}
        </div>
      </div>
    </div>
  )
}