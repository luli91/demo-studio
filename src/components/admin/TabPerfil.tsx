"use client"

import { useState } from "react"
import { Camera, Phone, MapPin, ShieldAlert, AlertCircle, Trash2, UserX, Calendar, Loader2, Tag, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

interface TabPerfilProps {
  alumno: any
  esTutor: boolean
  direccionArmada: string
  subiendoFoto: boolean
  onCambiarFoto: (e: React.ChangeEvent<HTMLInputElement>) => void
  onEliminarPre: () => void
  onArchivar: () => void
  onRefresh: () => void // Nueva prop para avisar que se actualizaron los datos
}

export default function TabPerfil({ 
  alumno, esTutor, direccionArmada, subiendoFoto, onCambiarFoto, onEliminarPre, onArchivar, onRefresh 
}: TabPerfilProps) {
  
  const supabase = createClient()
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("")
  const [guardandoTag, setGuardandoTag] = useState(false)

  const flex = alumno.datos_flexibles || {}
  const etiquetas = flex.etiquetas || []

  // --- AGREGAR ETIQUETA ---
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    const tagLimpio = nuevaEtiqueta.trim().toUpperCase() // Todo a mayúsculas para estandarizar
    
    if (!tagLimpio) return
    if (alumno.es_preinscripcion) return toast.error("No se pueden poner etiquetas en sala de espera.")
    if (etiquetas.includes(tagLimpio)) return toast.error("Este alumno ya tiene esa etiqueta.")

    setGuardandoTag(true)
    try {
      const nuevasEtiquetas = [...etiquetas, tagLimpio]
      
      const { error } = await supabase
        .from('usuarios')
        .update({
          datos_flexibles: {
            ...flex,
            etiquetas: nuevasEtiquetas
          }
        })
        .eq('id', alumno.id)

      if (error) throw error

      toast.success(`Etiqueta "${tagLimpio}" vinculada.`)
      setNuevaEtiqueta("")
      onRefresh() // Fuerza al orquestador general a recargar la BD
    } catch (error: any) {
      toast.error("Error al guardar etiqueta: " + error.message)
    } finally {
      setGuardandoTag(false)
    }
  }

  // --- ELIMINAR ETIQUETA ---
  const handleRemoveTag = async (tagAEliminar: string) => {
    try {
      const nuevasEtiquetas = etiquetas.filter((t: string) => t !== tagAEliminar)
      
      const { error } = await supabase
        .from('usuarios')
        .update({
          datos_flexibles: {
            ...flex,
            etiquetas: nuevasEtiquetas
          }
        })
        .eq('id', alumno.id)

      if (error) throw error

      toast.success("Etiqueta desvinculada.")
      onRefresh()
    } catch (error: any) {
      toast.error("Error al eliminar etiqueta.")
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* TARJETA DE PERFIL Y DATOS PERSONALES */}
      <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm text-center relative">
        
        {esTutor && (
          <span className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Cuenta Tutora
          </span>
        )}

        {/* SECCIÓN FOTO DE PERFIL */}
        <div className="relative mx-auto w-28 h-28 mb-4 mt-4 group cursor-pointer">
          <div className="h-full w-full rounded-full bg-primary text-primary-foreground flex items-center justify-center text-5xl font-black overflow-hidden border-4 border-background shadow-sm">
            {subiendoFoto ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : flex.avatar_url ? (
              <img src={flex.avatar_url} className="h-full w-full object-cover" />
            ) : (
              `${alumno.nombre.charAt(0)}`
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-secondary p-2 rounded-full border-2 border-background cursor-pointer hover:bg-primary hover:text-white transition-colors">
            <Camera className="h-4 w-4" />
            <input type="file" className="hidden" accept="image/*" onChange={onCambiarFoto} disabled={subiendoFoto} />
          </label>
        </div>

        <h2 className="text-2xl font-black leading-none">{alumno.nombre} {alumno.apellido}</h2>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2">{alumno.email || "Cuenta de Menor"}</p>
        
        <div className="mt-8 space-y-4 text-left p-6 bg-secondary/10 rounded-3xl border border-border">
          {flex.fecha_nacimiento && (
            <div className="flex items-center gap-3 text-sm font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              Nacimiento: {format(new Date(flex.fecha_nacimiento), "dd/MM/yyyy")}
            </div>
          )}
          <div className="flex items-center gap-3 text-sm font-medium"><Phone className="h-4 w-4 text-muted-foreground" /> {alumno.telefono || "Sin teléfono"}</div>
          <div className="flex items-center gap-3 text-sm font-medium items-start"><MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> {direccionArmada || "Sin dirección"}</div>
        </div>

        {/* --- NUEVO MÓDULO: GESTIÓN DE CATEGORÍAS / ETIQUETAS --- */}
        <div className="mt-6 p-5 bg-background border rounded-2xl text-left space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Clasificación / Etiquetas (Filtros)
          </p>
          
          {/* Listado de pastillas */}
          <div className="flex flex-wrap gap-1.5 min-h-[2rem] items-center">
            {etiquetas.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sin etiquetas asignadas. Agregá categorías abajo.</p>
            ) : (
              etiquetas.map((tag: string) => (
                <span 
                  key={tag} 
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-primary/20 transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 cursor-pointer group"
                  onClick={() => handleRemoveTag(tag)}
                  title="Hacé clic para remover"
                >
                  {tag}
                  <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </span>
              ))
            )}
          </div>

          {/* Formulario rápido para agregar */}
          {!alumno.es_preinscripcion && (
            <form onSubmit={handleAddTag} className="flex gap-2 pt-1">
              <Input 
                value={nuevaEtiqueta}
                onChange={(e) => setNuevaEtiqueta(e.target.value)}
                placeholder="Ej: FUTSAL INFANTIL, SALSA, CAT 2015..." 
                className="h-9 text-xs rounded-xl bg-card"
                disabled={guardandoTag}
              />
              <Button type="submit" size="sm" disabled={guardandoTag} className="h-9 px-3 rounded-xl">
                {guardandoTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </div>

        <div className={`mt-6 p-4 rounded-2xl border-2 shadow-inner text-left ${flex.contacto_urgencia ? 'bg-destructive/5 border-destructive/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${flex.contacto_urgencia ? 'text-destructive' : 'text-amber-600'}`}>
            <AlertCircle className="h-4 w-4" /> Contacto Emergencia
          </p>
          <p className={`font-black text-sm uppercase mt-1 ${flex.contacto_urgencia ? 'text-foreground' : 'text-amber-700'}`}>
            {flex.contacto_urgencia || "⚠️ NO CARGADO"}
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acciones de Cuenta</p>
          {alumno.es_preinscripcion ? (
            <Button variant="ghost" onClick={() => { if(confirm("¿Eliminar?")) onEliminarPre() }} className="w-full text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest h-11 rounded-xl">
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar de Sala de Espera
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => { if(confirm("¿Archivar alumna?")) onArchivar() }} className="w-full text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest h-11 rounded-xl">
              <UserX className="h-4 w-4 mr-2" /> Archivar / Dar de Baja
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}