"use client"

import { Search, Users, Send, Clock, Filter, AlertCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface ListaDirectorioProps {
  alumnos: any[]
  modeloNegocio: string
  textos: any
  filtroTexto: string
  onFiltroTextoChange: (valor: string) => void
  filtroEtiqueta: string
  onFiltroEtiquetaChange: (valor: string) => void
  onAbrirDetalle: (alumno: any) => void
  onPreRegistro: () => void
}

export default function ListaDirectorio({
  alumnos, modeloNegocio, textos, filtroTexto, onFiltroTextoChange, 
  filtroEtiqueta, onFiltroEtiquetaChange, onAbrirDetalle, onPreRegistro
}: ListaDirectorioProps) {
  
  // Extraemos dinámicamente todas las etiquetas únicas que existen en la BD
  const etiquetasUnicas = Array.from(new Set(
    alumnos.flatMap(a => a.datos_flexibles?.etiquetas || [])
  )).filter(Boolean) as string[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Directorio de {textos.pluralSujeros}
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Búsqueda rápida, filtros y estados de cuenta.</p>
        </div>
        <Button onClick={onPreRegistro} className="w-full sm:w-auto bg-primary font-bold h-11 rounded-xl shadow-md">
          <Send className="h-4 w-4 mr-2" /> Pre-inscribir Titular
        </Button>
      </div>

      <div className="bg-card p-4 rounded-2xl border shadow-sm space-y-4">
        {/* BARRA DE BÚSQUEDA */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder={`Buscar por nombre o email...`} 
            className="pl-12 h-12 bg-background rounded-xl font-medium border-border" 
            value={filtroTexto} 
            onChange={(e) => onFiltroTextoChange(e.target.value)} 
          />
        </div>

        {/* FILTROS RÁPIDOS Y ETIQUETAS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
          
          <Button 
            variant={filtroEtiqueta === '' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => onFiltroEtiquetaChange('')}
            className="rounded-full h-8 px-4 text-xs font-bold"
          >
            Todos
          </Button>

          {/* Filtros Inteligentes (Automáticos) */}
          {modeloNegocio === 'mensual' && (
            <Button 
              variant={filtroEtiqueta === 'deudores' ? 'destructive' : 'outline'} 
              size="sm" 
              onClick={() => onFiltroEtiquetaChange(filtroEtiqueta === 'deudores' ? '' : 'deudores')}
              className={`rounded-full h-8 px-4 text-xs font-bold ${filtroEtiqueta !== 'deudores' && 'text-destructive border-destructive/30 hover:bg-destructive/10'}`}
            >
              <AlertCircle className="h-3 w-3 mr-1" /> Con Deuda
            </Button>
          )}

          <Button 
            variant={filtroEtiqueta === 'tutores' ? 'secondary' : 'outline'} 
            size="sm" 
            onClick={() => onFiltroEtiquetaChange(filtroEtiqueta === 'tutores' ? '' : 'tutores')}
            className="rounded-full h-8 px-4 text-xs font-bold text-amber-600 border-amber-600/30 hover:bg-amber-50"
          >
            <ShieldCheck className="h-3 w-3 mr-1" /> Solo Tutores
          </Button>

          {/* Separador */}
          {etiquetasUnicas.length > 0 && <div className="h-4 w-px bg-border mx-2 shrink-0"></div>}

          {/* Etiquetas Dinámicas de la Academia */}
          {etiquetasUnicas.map(etiqueta => (
            <Button 
              key={etiqueta}
              variant={filtroEtiqueta === etiqueta ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => onFiltroEtiquetaChange(filtroEtiqueta === etiqueta ? '' : etiqueta)}
              className="rounded-full h-8 px-4 text-xs font-bold uppercase tracking-wider"
            >
              {etiqueta}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-[2rem] border shadow-sm overflow-hidden mt-4">
        <div className="p-5 border-b bg-secondary/10 flex justify-between items-center">
          <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Resultados ({alumnos.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {alumnos.length === 0 ? (
            <p className="p-12 text-center text-muted-foreground italic text-sm">No se encontraron resultados con los filtros actuales.</p>
          ) : (
            alumnos.map((alumno) => (
              <div 
                key={alumno.id} 
                onClick={() => onAbrirDetalle(alumno)} 
                className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4 hover:bg-secondary/10 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-4">
                  
                  {/* FOTO / INICIALES */}
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
                    <p className="font-black text-base uppercase text-foreground group-hover:text-primary transition-colors flex items-center gap-2 flex-wrap">
                      {alumno.nombre} {alumno.apellido}
                      {alumno.es_preinscripcion && (
                        <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-md font-black tracking-widest uppercase animate-pulse">Sala de Espera</span>
                      )}
                      {alumno.entrena === false && (
                        <span className="text-[9px] border border-amber-500 text-amber-600 px-2 py-0.5 rounded-md font-black tracking-widest uppercase">Tutor</span>
                      )}
                    </p>
                    
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                      {alumno.es_preinscripcion ? (
                        <span className="text-amber-600 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Pendiente de registro</span>
                      ) : (
                        alumno.email || "Menor asociado a tutor"
                      )}
                    </p>

                    {/* MUESTRA LAS ETIQUETAS DEL ALUMNO DEBAJO DEL MAIL */}
                    {alumno.datos_flexibles?.etiquetas?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {alumno.datos_flexibles.etiquetas.map((tag: string) => (
                          <span key={tag} className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* COLUMNA DERECHA COMPORTAMIENTO FINANCIERO */}
                <div className="text-left sm:text-right flex items-center sm:items-end justify-between sm:justify-center sm:flex-col gap-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest sm:mb-1">
                    {modeloNegocio === 'mensual' ? 'Estado de Cuota' : 'Créditos'}
                  </p>
                  
                  {alumno.es_preinscripcion ? (
                    modeloNegocio === 'reservas' ? (
                      <p className="font-black text-2xl leading-none text-amber-600">{alumno.creditos}</p>
                    ) : (
                      <span className="text-[10px] uppercase font-black px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">Por Activar</span>
                    )
                  ) : (
                    modeloNegocio === 'mensual' ? (
                      <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 ${alumno.estado_cuota === 'al_dia' ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${alumno.estado_cuota === 'al_dia' ? 'bg-emerald-500' : 'bg-destructive animate-pulse'}`}></span>
                        {alumno.estado_cuota === 'al_dia' ? 'Al Día' : 'Deuda'}
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
    </div>
  )
}