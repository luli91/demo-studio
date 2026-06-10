"use client"

import { useState } from "react"
import { 
  X, Users, UserMinus, UserPlus, AlertCircle, 
  Search, Loader2, CalendarClock 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface GestionarClaseModalProps {
  clase: any
  onClose: () => void
  onUpdate: () => void
}

export default function GestionarClaseModal({ clase, onClose, onUpdate }: GestionarClaseModalProps) {
  const [procesando, setProcesando] = useState(false)
  
  // Estado para la sección de agregar alumna manual
  const [mostrandoAgregar, setMostrandoAgregar] = useState(false)
  const [busqueda, setBusqueda] = useState("")

  // Estado para el modal interno de Confirmar Baja
  const [modalBaja, setModalBaja] = useState<{ idReserva: string, nombre: string } | null>(null)

  // Normalizamos las reservas para que no de error si viene vacío
  const reservas = clase.reservas_confirmadas || []
  const estaLlena = reservas.length >= (clase.cupo_maximo || 10)

  // --- HANDLER: DAR DE BAJA (Ahora recibe explícitamente si hay reembolso o no) ---
  const handleConfirmarBaja = async (conReembolso: boolean) => {
    if (!modalBaja) return
    setProcesando(true)

    try {
      // ⚠️ Lógica Supabase futura:
      // 1. await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', modalBaja.idReserva)
      // 2. Si conReembolso es true:
      //    const { data: reserva } = await supabase.from('reservas').select('perfil_id').eq('id', modalBaja.idReserva).single()
      //    // sumar +1 al perfil_id...

      // Simulamos la espera de base de datos
      await new Promise(resolve => setTimeout(resolve, 800))

      if (conReembolso) {
        toast.success(`Baja confirmada. Se le devolvió el crédito a ${modalBaja.nombre}.`)
      } else {
        toast.error(`Baja confirmada. ${modalBaja.nombre} perdió la clase (Sin devolución).`)
      }

      setModalBaja(null)
      onUpdate() // Actualiza la grilla de fondo
      onClose()  // Cerramos para forzar refresco visual
    } catch (error) {
      toast.error("Error al procesar la baja.")
    } finally {
      setProcesando(false)
    }
  }

  // --- HANDLER: AGREGAR MANUAL ---
  const handleAgregarManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!busqueda.trim()) return

    setProcesando(true)
    try {
      // ⚠️ Lógica Supabase futura: Buscar alumna y anotar

      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast.success(`¡Alumna inscripta manualmente con éxito!`)
      setMostrandoAgregar(false)
      setBusqueda("")
      onUpdate()
    } catch (error) {
      toast.error("Error al inscribir alumna.")
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card border border-border shadow-2xl rounded-[2rem] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ENCABEZADO */}
        <div className="p-6 border-b border-border bg-secondary/30 relative">
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <X className="h-5 w-5" />
          </Button>
          
          <div className="pr-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {clase.dia_semana} • {clase.horario?.slice(0,5)} HS
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-none">
              {clase.nivel}
            </h2>
            <div className="flex items-center gap-4 mt-3 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Cupo: {reservas.length}/{clase.cupo_maximo}</span>
              <span className="flex items-center gap-1"><CalendarClock className="h-4 w-4" /> Profe: {clase.profesor || "Sin asignar"}</span>
            </div>
          </div>
        </div>

        {/* CUERPO CENTRAL (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* SECCIÓN AGREGAR MANUAL */}
          {!mostrandoAgregar ? (
            <Button 
              onClick={() => setMostrandoAgregar(true)} 
              disabled={estaLlena}
              className="w-full h-12 rounded-xl font-bold uppercase tracking-widest border-dashed border-2 bg-transparent text-primary hover:bg-primary/5"
            >
              {estaLlena ? "Clase sin cupo disponible" : <><UserPlus className="h-4 w-4 mr-2" /> Agregar Alumna Manual</>}
            </Button>
          ) : (
            <div className="p-4 bg-secondary/20 border border-border rounded-2xl animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Inscribir Alumna</h4>
                <Button variant="ghost" size="sm" onClick={() => setMostrandoAgregar(false)} className="h-6 px-2 text-xs">Cancelar</Button>
              </div>
              <form onSubmit={handleAgregarManual} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={busqueda} 
                    onChange={(e) => setBusqueda(e.target.value)} 
                    placeholder="Buscar por nombre..." 
                    className="pl-9 h-11 rounded-xl bg-background"
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={!busqueda.trim() || procesando} className="h-11 rounded-xl px-6 font-bold">
                  {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Anotar"}
                </Button>
              </form>
            </div>
          )}

          {/* LISTA DE ALUMNAS */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              Lista Oficial ({reservas.length})
            </h4>
            
            <div className="space-y-2">
              {reservas.length === 0 ? (
                <div className="p-8 text-center bg-secondary/10 rounded-2xl border border-dashed border-border text-muted-foreground text-sm italic">
                  Nadie se anotó a esta clase todavía.
                </div>
              ) : (
                reservas.map((reserva: any, index: number) => {
                  const nombreAlumna = reserva.perfiles?.nombre 
                    ? `${reserva.perfiles.nombre} ${reserva.perfiles.apellido || ''}` 
                    : reserva.nombre_completo || `Alumna #${index + 1}`

                  return (
                    <div key={reserva.id || index} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-border bg-card hover:bg-secondary/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm uppercase">{nombreAlumna}</p>
                          {reserva.perfiles?.estado_cuota && (
                            <p className={`text-[9px] uppercase font-black tracking-widest ${reserva.perfiles.estado_cuota === 'al_dia' ? 'text-emerald-500' : 'text-destructive'}`}>
                              {reserva.perfiles.estado_cuota === 'al_dia' ? 'Cuota al día' : 'Deuda Pendiente'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setModalBaja({ idReserva: reserva.id, nombre: nombreAlumna })}
                        className="text-destructive hover:bg-destructive hover:text-white rounded-xl h-9 w-9 shrink-0"
                        title="Dar de baja"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================================
          MODAL INTERNO: CONFIRMAR BAJA (BOTONES EXPLÍCITOS)
      =================================================================================== */}
      {modalBaja && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-card border border-border shadow-2xl rounded-[2rem] w-full max-w-sm p-6 text-center space-y-6">
            
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-2">
              <AlertCircle className="h-8 w-8" />
            </div>
            
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter mb-2 text-foreground">Acción Requerida</h3>
              <p className="text-muted-foreground text-sm leading-snug">
                Estás por sacar a <span className="font-bold text-foreground">{modalBaja.nombre}</span> de la lista. ¿Qué querés hacer con su crédito?
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <Button 
                variant="default" 
                disabled={procesando} 
                className="h-12 font-black uppercase tracking-widest rounded-xl bg-destructive hover:bg-destructive/90 text-white w-full" 
                onClick={() => handleConfirmarBaja(true)}
              >
                {procesando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Baja Y DEVOLVER PASE"}
              </Button>
              
              <Button 
                variant="outline" 
                disabled={procesando} 
                className="h-12 font-bold uppercase tracking-widest rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10 w-full" 
                onClick={() => handleConfirmarBaja(false)}
              >
                {procesando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Baja SIN DEVOLUCIÓN"}
              </Button>

              <Button 
                variant="ghost" 
                disabled={procesando} 
                className="h-12 font-bold rounded-xl text-muted-foreground w-full mt-2" 
                onClick={() => setModalBaja(null)}
              >
                Volver (No hacer nada)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}