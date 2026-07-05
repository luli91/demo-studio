"use client"

import { Plus, UploadCloud, Loader2, CalendarDays, Megaphone, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TabCartelera({
  nuevoEvento,
  setNuevoEvento,
  archivoEvento,
  setArchivoEvento,
  handlePublicarEvento,
  publicandoEvento,
  infoAcademia,
  handleBorrarEvento,
  borrandoEventoId
}: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2">
      <div className="space-y-6">
        <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card border-amber-500/30">
          <div className="px-6 py-5 border-b border-border bg-amber-500/10">
            <h2 className="font-black text-amber-700 dark:text-amber-500 uppercase tracking-tight flex items-center gap-2">
              <Plus className="h-5 w-5" /> Publicar Nuevo Aviso
            </h2>
          </div>
          <form onSubmit={handlePublicarEvento} className="p-6 space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título del Aviso</label>
              <input required type="text" value={nuevoEvento.titulo} onChange={e => setNuevoEvento({...nuevoEvento, titulo: e.target.value})} placeholder="Ej: ¡Torneo de Invierno!" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm font-bold outline-none focus:border-amber-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalles del Evento</label>
              <textarea value={nuevoEvento.descripcion} onChange={e => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})} placeholder="Escribí fechas, lugares o información importante..." className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:border-amber-500 resize-none min-h-[100px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Flyer / Imagen (Opcional)</label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => document.getElementById('upload-aviso-nuevo')?.click()} className="font-bold text-xs h-10 border-dashed">
                  <UploadCloud className="h-4 w-4 mr-2" /> {archivoEvento ? "Cambiar Archivo" : "Seleccionar Imagen"}
                </Button>
                <input type="file" id="upload-aviso-nuevo" className="hidden" accept="image/*" onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) setArchivoEvento(e.target.files[0])
                }} />
                {archivoEvento && <span className="text-xs font-bold text-emerald-600">Imagen lista ✓</span>}
              </div>
            </div>
            <Button type="submit" disabled={publicandoEvento || !nuevoEvento.titulo} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest h-12 shadow-md">
              {publicandoEvento ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publicar en Cartelera"}
            </Button>
          </form>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" /> Avisos Publicados ({infoAcademia.eventos_cartelera?.length || 0})
        </h3>
        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
          {(!infoAcademia.eventos_cartelera || infoAcademia.eventos_cartelera.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-3xl bg-secondary/10">
              <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Cartelera Vacía</p>
            </div>
          ) : (
            infoAcademia.eventos_cartelera.map((evento: any) => (
              <Card key={evento.id} className="border-border shadow-sm rounded-2xl overflow-hidden bg-card flex flex-col group transition-all hover:border-primary/30">
                {evento.imagen_url && (
                  <div className="w-full h-32 bg-secondary/20 border-b border-border overflow-hidden">
                    <img src={evento.imagen_url} alt={evento.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-black text-foreground text-sm uppercase tracking-tight">{evento.titulo}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{evento.descripcion}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleBorrarEvento(evento.id, evento.imagen_url)} disabled={borrandoEventoId === evento.id} className="h-8 w-8 text-muted-foreground hover:bg-destructive hover:text-white shrink-0 rounded-full">
                      {borrandoEventoId === evento.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-4">
                    Publicado el {new Date(evento.fecha).toLocaleDateString('es-AR')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}