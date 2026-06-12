"use client"

import { Search, Users, Send, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ListaDirectorioProps {
  alumnos: any[]
  modeloNegocio: string
  textos: any
  filtro: string
  onFiltroChange: (valor: string) => void
  onAbrirDetalle: (alumno: any) => void
  onPreRegistro: () => void
}

export default function ListaDirectorio({
  alumnos, modeloNegocio, textos, filtro, onFiltroChange, onAbrirDetalle, onPreRegistro
}: ListaDirectorioProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Directorio de {textos.pluralSujeros}
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Búsqueda rápida y estados de cuenta.</p>
        </div>
        <Button onClick={onPreRegistro} className="w-full sm:w-auto bg-primary font-bold h-11 rounded-xl shadow-md">
          <Send className="h-4 w-4 mr-2" /> Pre-inscribir
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder={`Buscar ${textos.singularSujero.toLowerCase()} por nombre o email...`} 
          className="pl-12 h-14 bg-card rounded-2xl shadow-sm font-medium border-border" 
          value={filtro} 
          onChange={(e) => onFiltroChange(e.target.value)} 
        />
      </div>

      <div className="bg-card rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-secondary/10">
          <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Listado Activo ({alumnos.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {alumnos.length === 0 ? (
            <p className="p-12 text-center text-muted-foreground italic text-sm">No se encontraron resultados.</p>
          ) : (
            alumnos.map((alumno) => (
              <div 
                key={alumno.id} 
                onClick={() => onAbrirDetalle(alumno)} 
                className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4 hover:bg-secondary/10 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-4">
                  
                  {/* FOTO / INICIALES (Con diseño condicional si está en sala de espera) */}
                  <div className={`h-12 w-12 rounded-full font-black flex items-center justify-center overflow-hidden shrink-0 transition-all ${
                    alumno.es_preinscripcion 
                      ? 'bg-amber-500/10 border-2 border-dashed border-amber-500 text-amber-600' 
                      : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                  }`}>
                    {alumno.avatar_url ? (
                      <img src={alumno.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      `${alumno.nombre.charAt(0)}${alumno.apellido ? alumno.apellido.charAt(0) : ''}`
                    )}
                  </div>

                  <div>
                    {/* NOMBRE + BADGE DE SALA DE ESPERA */}
                    <p className="font-black text-base uppercase text-foreground group-hover:text-primary transition-colors flex items-center gap-2 flex-wrap">
                      {alumno.nombre} {alumno.apellido}
                      {alumno.es_preinscripcion && (
                        <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-md font-black tracking-widest uppercase animate-pulse">
                          Sala de Espera
                        </span>
                      )}
                    </p>
                    
                    {/* SUBTÍTULO DINÁMICO */}
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                      {alumno.es_preinscripcion ? (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Pendiente: falta registrarse en la app
                        </span>
                      ) : (
                        alumno.email || "Menor asociado a tutor"
                      )}
                    </p>
                  </div>
                </div>
                
                {/* COLUMNA DERECHA COMPORTAMIENTO FINANCIERO */}
                <div className="text-left sm:text-right flex items-center sm:items-end justify-between sm:justify-center sm:flex-col gap-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest sm:mb-1">
                    {modeloNegocio === 'mensual' ? 'Estado de Cuota' : 'Créditos'}
                  </p>
                  
                  {alumno.es_preinscripcion ? (
                    // Si está en sala de espera, mostramos los créditos/pases que Flor ya le dejó guardados
                    modeloNegocio === 'reservas' ? (
                      <p className="font-black text-2xl leading-none text-amber-600">{alumno.creditos}</p>
                    ) : (
                      <span className="text-[10px] uppercase font-black px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                        Por Activar
                      </span>
                    )
                  ) : (
                    // Comportamiento normal para las ya registradas
                    modeloNegocio === 'mensual' ? (
                      <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 ${alumno.estado_cuota === 'al_dia' ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${alumno.estado_cuota === 'al_dia' ? 'bg-emerald-500' : 'bg-destructive animate-pulse'}`}></span>
                        {alumno.estado_cuota === 'al_dia' ? 'Al Día' : 'Deuda / Vencido'}
                      </span>
                    ) : (
                      <p className="font-black text-2xl leading-none text-foreground">{alumno.creditos}</p>
                    )
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}