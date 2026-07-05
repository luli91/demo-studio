"use client"

import { UploadCloud, Loader2, Users, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TabEquipo({ equipo, nuevoProfe, setNuevoProfe, handleCrearProfe, handleSubirFotoProfe, subiendoArchivo, handleBorrarProfe }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-2">
      <Card className="border-border shadow-sm rounded-[2rem] bg-card h-fit lg:col-span-1 overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-secondary/10 font-black uppercase tracking-tight">Nuevo Integrante</div>
        <form onSubmit={handleCrearProfe} className="p-6 space-y-5">
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</label><input required type="text" value={nuevoProfe.nombre} onChange={e => setNuevoProfe({...nuevoProfe, nombre: e.target.value})} placeholder="Ej: Marcos" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary font-bold" /></div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Especialidad / Rol</label><input required type="text" value={nuevoProfe.rol} onChange={e => setNuevoProfe({...nuevoProfe, rol: e.target.value})} placeholder="Ej: Coach de Boxeo" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" /></div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Foto (Retrato)</label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => document.getElementById('upload-profe')?.click()} className="flex-1 font-bold text-xs h-10 border-dashed"><UploadCloud className="h-4 w-4 mr-2" /> {nuevoProfe.foto ? "Cambiar Foto" : "Subir Retrato"}</Button>
              <input type="file" id="upload-profe" className="hidden" accept="image/*" onChange={handleSubirFotoProfe} />
              {subiendoArchivo === "profe" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : nuevoProfe.foto && <span className="text-xs font-bold text-emerald-600">Lista ✓</span>}
            </div>
          </div>
          <Button type="submit" disabled={subiendoArchivo === "profe"} className="w-full font-black uppercase tracking-widest h-12 shadow-md">Añadir al Equipo</Button>
        </form>
      </Card>

      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {equipo.map((profe: any) => (
          <Card key={profe.id} className="border-border shadow-sm rounded-2xl bg-card p-4 flex items-center gap-4 group">
            <div className="w-16 h-16 rounded-xl bg-secondary/20 overflow-hidden shrink-0">
              {profe.foto ? <img src={profe.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users className="h-6 w-6 text-muted-foreground opacity-30" /></div>}
            </div>
            <div className="min-w-0 flex-1"><h4 className="font-black uppercase text-sm text-foreground truncate">{profe.nombre}</h4><p className="text-xs text-muted-foreground truncate">{profe.rol}</p></div>
            <Button variant="ghost" size="icon" onClick={() => handleBorrarProfe(profe.id)} className="text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
        {equipo.length === 0 && <div className="sm:col-span-2 text-center py-12 text-muted-foreground bg-secondary/10 rounded-2xl border-2 border-dashed">No hay profesores cargados en la web.</div>}
      </div>
    </div>
  )
}