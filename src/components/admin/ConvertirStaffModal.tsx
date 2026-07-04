"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { X, Search, UserPlus, Loader2, ArrowLeft, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function ConvertirStaffModal({ abierto, onClose, onConvertido }: any) {
  const supabase = createClient()
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [filtro, setFiltro] = useState("")
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  
  // Nuevo estado para el "Paso 2" de configuración
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any | null>(null)
  const [tipoPago, setTipoPago] = useState<'por_clase' | 'fijo'>('por_clase')
  const [monto, setMonto] = useState("")

  useEffect(() => {
    if (!abierto) {
      setAlumnoSeleccionado(null)
      setTipoPago('por_clase')
      setMonto("")
      setFiltro("")
      return
    }
    const cargar = async () => {
      setCargando(true)
      // Buscamos a los que son alumnos y están activos
      const { data } = await supabase.from('usuarios').select('id, nombre, email, datos_flexibles').eq('rol', 'alumno').eq('activa', true)
      if (data) setAlumnos(data)
      setCargando(false)
    }
    cargar()
  }, [abierto])

  if (!abierto) return null

  const filtrados = alumnos.filter(a => a.nombre.toLowerCase().includes(filtro.toLowerCase()))

  const handleConfirmarAscenso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!monto || Number(monto) <= 0) return toast.error("Ingresá un monto válido.")
    
    setProcesando(true)
    try {
      // Leemos los datos flexibles actuales para no pisar información
      let flexActual: any = {}
      try { flexActual = typeof alumnoSeleccionado.datos_flexibles === 'string' ? JSON.parse(alumnoSeleccionado.datos_flexibles) : (alumnoSeleccionado.datos_flexibles || {}) } catch(e){}
      
      // Le inyectamos la configuración de sueldo
      const nuevoFlex = {
        ...flexActual,
        tipoPago: tipoPago,
        valor_clase: Number(monto)
      }

      // Actualizamos rol y sueldo en Supabase
      const { error } = await supabase.from('usuarios').update({ 
        rol: 'profesor',
        datos_flexibles: nuevoFlex
      }).eq('id', alumnoSeleccionado.id)
      
      if (error) throw error
      
      toast.success(`${alumnoSeleccionado.nombre} fue añadido al Staff exitosamente.`)
      onConvertido()
    } catch (e: any) {
      toast.error("Error al añadir al staff: " + e.message)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md overflow-hidden">
        
        <div className="p-6 border-b border-border bg-primary/10 flex justify-between items-center">
          <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Añadir al Staff
          </h3>
          <button onClick={onClose} className="hover:bg-primary/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
        </div>

        {!alumnoSeleccionado ? (
          /* PASO 1: SELECCIONAR ALUMNO */
          <>
            <div className="p-4 bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar alumno por nombre..." value={filtro} onChange={e => setFiltro(e.target.value)} className="pl-9 h-12 bg-background border-border" />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
              {cargando ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : filtrados.length === 0 ? (
                <p className="text-center p-8 text-sm text-muted-foreground italic">No se encontraron alumnos activos.</p>
              ) : (
                filtrados.map(a => (
                  <div key={a.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                    <div>
                      <p className="font-bold text-sm uppercase">{a.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">{a.email || "Sin correo"}</p>
                    </div>
                    <Button size="sm" onClick={() => setAlumnoSeleccionado(a)} className="h-8 text-[10px] font-bold uppercase">
                      Seleccionar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* PASO 2: CONFIGURAR CONTRATO Y SUELDO */
          <form onSubmit={handleConfirmarAscenso} className="p-6 space-y-6 animate-in slide-in-from-right-2">
            
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="h-12 w-12 rounded-full bg-primary/20 text-primary font-black text-xl flex items-center justify-center shrink-0">
                {alumnoSeleccionado.nombre.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Configurando a:</p>
                <p className="font-black text-foreground uppercase truncate">{alumnoSeleccionado.nombre}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Modalidad de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={tipoPago === 'por_clase' ? 'default' : 'outline'} onClick={() => setTipoPago('por_clase')} className={`h-12 font-bold text-xs ${tipoPago === 'por_clase' ? 'shadow-inner' : ''}`}>
                    Por Clase
                  </Button>
                  <Button type="button" variant={tipoPago === 'fijo' ? 'default' : 'outline'} onClick={() => setTipoPago('fijo')} className={`h-12 font-bold text-xs ${tipoPago === 'fijo' ? 'shadow-inner' : ''}`}>
                    Fijo Mensual
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  {tipoPago === 'fijo' ? 'Sueldo Mensual ($)' : 'Valor por Clase ($)'}
                </label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    type="number" 
                    required 
                    placeholder="Ej: 5000" 
                    value={monto} 
                    onChange={e => setMonto(e.target.value)} 
                    className="pl-12 h-14 text-lg font-black bg-background border-border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" onClick={() => setAlumnoSeleccionado(null)} variant="outline" className="flex-1 rounded-xl h-12 font-bold text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
              </Button>
              <Button type="submit" disabled={procesando} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-black uppercase tracking-widest shadow-md">
                {procesando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Alta"}
              </Button>
            </div>
            
          </form>
        )}
      </div>
    </div>
  )
}