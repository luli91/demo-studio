import { Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TabEventos({ eventos, nuevoEvento, setNuevoEvento, handleCrearEvento, handleEliminarEvento }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-2">
      <Card className="border-border shadow-sm rounded-[2rem] bg-card h-fit lg:col-span-1 overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-secondary/10 font-black uppercase tracking-tight">Publicar Evento Especial</div>
        <form onSubmit={handleCrearEvento} className="p-6 space-y-4">
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título / Nivel</label><input required type="text" value={nuevoEvento.nivel} onChange={e => setNuevoEvento({...nuevoEvento, nivel: e.target.value})} placeholder="Ej: Workshop de Telas" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary font-bold" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</label><input required type="date" value={nuevoEvento.fecha} onChange={e => setNuevoEvento({...nuevoEvento, fecha: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" /></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horario</label><input required type="time" value={nuevoEvento.horario} onChange={e => setNuevoEvento({...nuevoEvento, horario: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" /></div>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Precio Entrada ($)</label><input type="number" value={nuevoEvento.precio} onChange={e => setNuevoEvento({...nuevoEvento, precio: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary font-bold" /></div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalles</label><textarea value={nuevoEvento.descripcion_evento} onChange={e => setNuevoEvento({...nuevoEvento, descripcion_evento: e.target.value})} placeholder="Información sobre las entradas..." className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:border-primary resize-none h-20" /></div>
          <Button type="submit" className="w-full font-black uppercase tracking-widest h-11">Publicar en Agenda</Button>
        </form>
      </Card>

      <div className="lg:col-span-2 space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
        {eventos.map((ev: any) => (
          <Card key={ev.id} className="border-border shadow-sm rounded-2xl bg-card p-5 flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">{ev.fecha.split('-').reverse().join('/')} - {ev.horario.slice(0, 5)} HS</span>
              <h4 className="font-black text-base uppercase text-foreground pt-1">{ev.nivel}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{ev.descripcion_evento}</p>
              <p className="text-xs font-black text-emerald-600 pt-1">${Number(ev.precio).toLocaleString('es-AR')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleEliminarEvento(ev.id)} className="text-destructive hover:bg-destructive/10 shrink-0 rounded-full"><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>
    </div>
  )
}