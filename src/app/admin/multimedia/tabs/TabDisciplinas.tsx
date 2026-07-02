import { Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TabDisciplinas({ disciplinas, nuevaDisciplina, setNuevoDisciplina, handleCrearDisciplina, handleEliminarDisciplina }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-2">
      <Card className="border-border shadow-sm rounded-[2rem] bg-card h-fit lg:col-span-1 overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-secondary/10 font-black uppercase tracking-tight">Nueva Disciplina</div>
        <form onSubmit={handleCrearDisciplina} className="p-6 space-y-4">
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título</label><input required type="text" value={nuevaDisciplina.titulo} onChange={e => setNuevoDisciplina({...nuevaDisciplina, titulo: e.target.value})} placeholder="Ej: Pole Sport" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary font-bold" /></div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción Corta</label><textarea value={nuevaDisciplina.descripcion} onChange={e => setNuevoDisciplina({...nuevaDisciplina, descripcion: e.target.value})} placeholder="Detalles de la disciplina..." className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:border-primary resize-none h-24" /></div>
          <Button type="submit" className="w-full font-black uppercase tracking-widest h-11">Agregar Categoría</Button>
        </form>
      </Card>

      <div className="lg:col-span-2 space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
        {disciplinas.map((d: any) => (
          <Card key={d.id} className="border-border shadow-sm rounded-2xl bg-card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black italic">{d.titulo.charAt(0)}</div>
              <div className="min-w-0"><h4 className="font-black text-sm uppercase text-foreground truncate">{d.titulo}</h4><p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{d.descripcion}</p></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleEliminarDisciplina(d.id)} className="text-destructive hover:bg-destructive/10 shrink-0 rounded-full"><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>
    </div>
  )
}