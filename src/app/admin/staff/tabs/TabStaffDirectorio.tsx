"use client"

import { Search, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function TabStaffDirectorio({ staff, filtro, setFiltro, onVerDetalle }: any) {
  // Filtramos por nombre o por cualquier etiqueta que el profe tenga
  const filtradas = staff.filter((p: any) => {
    const busqueda = filtro.toLowerCase()
    const etiquetas = (p.datos_flexibles?.etiquetas_asignadas || []).join(" ").toLowerCase()
    return (
      p.nombre.toLowerCase().includes(busqueda) || 
      p.especialidad.toLowerCase().includes(busqueda) ||
      etiquetas.includes(busqueda)
    )
  })

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 max-w-4xl mx-auto">
      {/* BARRA DE BUSQUEDA */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Buscar profe por nombre o grupo (ej: Futsal Femenino)..." 
          className="pl-12 h-14 bg-card border-border rounded-2xl shadow-sm text-base font-medium" 
          value={filtro} 
          onChange={(e) => setFiltro(e.target.value)} 
        />
      </div>

      {/* LISTADO DE PROFESORES */}
      <div className="space-y-3">
        {filtradas.length === 0 && (
          <div className="text-center py-10 bg-secondary/20 rounded-2xl border-2 border-dashed border-border">
            <p className="text-muted-foreground italic text-sm">No hay resultados para tu búsqueda.</p>
          </div>
        )}
        
        {filtradas.map((profe: any) => (
          <Card 
            key={profe.id} 
            className="border-border shadow-sm bg-card hover:border-primary/50 transition-all cursor-pointer group rounded-2xl overflow-hidden" 
            onClick={() => onVerDetalle(profe)}
          >
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center shrink-0">
                  {profe.nombre.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight leading-none mb-2 text-foreground">
                    {profe.nombre}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {/* Especialidad principal */}
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border font-bold">
                      {profe.especialidad}
                    </span>
                    {/* Etiquetas/Grupos asignados */}
                    {profe.datos_flexibles?.etiquetas_asignadas?.map((tag: string) => (
                      <span key={tag} className="text-[9px] uppercase tracking-widest bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity underline decoration-dashed">
                  Ver Ficha
                </span>
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}