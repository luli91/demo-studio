"use client"

import { useState } from "react"
import { X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"

interface NuevoAlumnoModalProps {
  abierto: boolean
  modeloNegocio: string
  onClose: () => void
  onGuardado: () => void 
}

export default function NuevoAlumnoModal({ abierto, modeloNegocio, onClose, onGuardado }: NuevoAlumnoModalProps) {
  const [procesando, setProcesando] = useState(false)
  const supabase = createClient()

  if (!abierto) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProcesando(true)

    const formData = new FormData(e.currentTarget)
    const emailInput = (formData.get('email') as string).toLowerCase().trim()
    const nombreCompleto = `${formData.get('nombre')} ${formData.get('apellido')}`.trim()
    
    const creditosIniciales = modeloNegocio === 'reservas' ? parseInt(formData.get('creditos') as string) : 0
    const datosFlexibles = {
      estado_cuota: 'al_dia',
      creditos_clases: creditosIniciales,
      contacto_urgencia: "", 
      documentos: [],
      pagos: [],
      asistencias: []
    }

    // Estructura exacta para nuestra nueva tabla "pre_inscripciones"
    const nuevaPreInscripcion = {
      email: emailInput,
      nombre: nombreCompleto,
      telefono: formData.get('telefono') as string,
      datos_flexibles: datosFlexibles
    }

    try {
      // 1. Verificamos que no exista ya un usuario oficial con ese email
      const { data: usuarioExistente } = await supabase.from('usuarios').select('id').eq('email', emailInput).single()
      if (usuarioExistente) throw new Error("Ya existe una alumna registrada con este email.")

      // 2. Guardamos en la sala de espera (Upsert por si la admin corrige algo)
      const { error } = await supabase
        .from('pre_inscripciones')
        .upsert([nuevaPreInscripcion])

      if (error) throw error

      toast.success("¡Ficha creada en Sala de Espera! La alumna ya puede registrarse.")
      onGuardado() 
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Error al pre-inscribir.")
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md overflow-hidden">
        
        <div className="p-6 flex justify-between items-center bg-primary text-primary-foreground">
          <div>
            <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-2">
              <Send className="h-5 w-5"/> Pre-Inscripción
            </h3>
            <p className="text-xs font-medium opacity-80 mt-1">Crear ficha en Sala de Espera.</p>
          </div>
          <button type="button" onClick={onClose} className="hover:bg-black/20 p-1 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre</label>
              <Input name="nombre" type="text" required placeholder="Ej: Laura" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Apellido</label>
              <Input name="apellido" type="text" required placeholder="Ej: Gómez" className="h-11 rounded-xl" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">WhatsApp</label>
            <Input name="telefono" type="tel" required placeholder="Ej: 11 1234-5678" className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-primary tracking-widest ml-1">Email (Clave para vincular)</label>
            <Input name="email" type="email" required placeholder="laura@ejemplo.com" className="h-11 rounded-xl border-primary/30 bg-primary/5 font-bold focus-visible:ring-primary" />
          </div>

          {modeloNegocio === 'reservas' && (
            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Créditos a Otorgar</label>
              <Input name="creditos" type="number" defaultValue="0" min="0" className="h-11 rounded-xl font-bold" />
            </div>
          )}
          
          <Button type="submit" disabled={procesando} className="w-full h-12 rounded-xl font-black uppercase tracking-widest mt-4 shadow-md">
            {procesando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Dejar ficha en espera"}
          </Button>
        </form>

      </div>
    </div>
  )
}