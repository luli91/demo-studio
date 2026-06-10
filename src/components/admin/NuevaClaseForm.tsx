"use client"

import { useState } from "react"
import { CalendarDays, Clock, Users, UserPlus, Dumbbell, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
// import { createClient } from "@/lib/supabase" // Para cuando conectes la base real

// ========================================================
// LISTAS CERRADAS (Evita errores de tipeo y mejora métricas)
// ========================================================
const ACTIVIDADES_DISPONIBLES = [
  "Pole Sport",
  "Pole Mix",
  "Pole Coreo",
  "Pole Exotic",
  "Elongación",
  "Aro Aéreo",
  "Acrobacia",
  "Preparación Física"
]

const DIAS_SEMANA = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
]

const PROFESORES = [
  "Flor", "Micaela", "Julieta", "Admin"
]

export default function NuevaClaseForm({ onCertado }: { onCertado: () => void }) {
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setGuardando(true)

    // const formData = new FormData(e.currentTarget)
    // const payload = Object.fromEntries(formData)

    try {
      // ⚠️ Acá iría tu lógica de Supabase:
      // const supabase = createClient()
      // const { error } = await supabase.from('clases').insert({...})
      
      // Simulamos la carga de red por 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("¡Serie de clases generada con éxito!")
      onCertado() // Cierra el form y recarga la grilla en la página padre
    } catch (error) {
      toast.error("Hubo un error al crear la grilla.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
      <div className="text-center mb-6 border-b border-border pb-6">
        <h3 className="font-black text-2xl uppercase tracking-tighter text-foreground">Programar Grilla</h3>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Definí la regla fija. El sistema replicará esta clase todas las semanas.
        </p>
      </div>

      {/* 1. SELECCIÓN DE ACTIVIDAD (SELECT ESTRICTO) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
          Disciplina / Nivel
        </label>
        <div className="relative">
          <Dumbbell className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 pointer-events-none" />
          <select 
            name="nivel" 
            required 
            defaultValue=""
            className="w-full bg-background border border-border rounded-xl h-14 pl-10 pr-4 text-foreground font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="" disabled>Seleccioná una actividad...</option>
            {ACTIVIDADES_DISPONIBLES.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 2. DÍA DE LA SEMANA */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Día Fijo
          </label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 pointer-events-none" />
            <select 
              name="dia_semana" 
              required 
              defaultValue="Lunes"
              className="w-full bg-background border border-border rounded-xl h-14 pl-10 pr-4 text-foreground font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
            >
              {DIAS_SEMANA.map(dia => (
                <option key={dia} value={dia}>{dia}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. HORARIO DE INICIO */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Horario de Inicio
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 pointer-events-none" />
            <input 
              type="time" 
              name="horario" 
              required
              className="w-full bg-background border border-border rounded-xl h-14 pl-10 pr-4 text-foreground font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 4. CUPO MÁXIMO */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Cupo Máximo
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 pointer-events-none" />
            <input 
              type="number" 
              name="cupo_maximo" 
              defaultValue={10}
              min={1}
              required
              className="w-full bg-secondary/30 border border-border rounded-xl h-14 pl-10 pr-4 text-foreground font-black text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* 5. PROFESOR ASIGNADO */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Profesor/a
          </label>
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 pointer-events-none" />
            <select 
              name="profesor" 
              required 
              defaultValue="Flor"
              className="w-full bg-background border border-border rounded-xl h-14 pl-10 pr-4 text-foreground font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
            >
              {PROFESORES.map(profe => (
                <option key={profe} value={profe}>{profe}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Button 
          type="submit" 
          disabled={guardando}
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl"
        >
          {guardando ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Generando Grilla Infinita...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Guardar Serie de Clases
            </>
          )}
        </Button>
      </div>
    </form>
  )
}