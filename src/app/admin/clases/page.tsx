"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, Loader2, Trash2, Users, AlertTriangle, 
  Search, Settings2, Plus, Clock, ArrowLeft 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import NuevaClaseForm from "@/components/admin/NuevaClaseForm" 
import GestionarClaseModal from "@/components/admin/GestionarClaseModal"

export default function AdminClasesPage() {
  const [mostrandoForm, setMostrandoForm] = useState(false)
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  const [filtro, setFiltro] = useState("")
  const [claseABorrar, setClaseABorrar] = useState<any | null>(null)
  const [borrando, setBorrando] = useState(false)
  const [claseAGestionar, setClaseAGestionar] = useState<any | null>(null)

  // --- MOCK TEMPORAL PARA REEMPLAZAR SUPABASE ---
  // (Cuando conectes BD real, borrás esto y volvés a usar el supabase.from("clases")...)
  const cargarClasesMock = () => {
    setCargando(true)
    setTimeout(() => {
      setClases([
        {
          id: "cls-1",
          nivel: "Pole Sport Nivel 1",
          dia_semana: "Lunes",
          fecha: "2026-06-15",
          horario: "18:00",
          cupo_maximo: 10,
          grupo_id: "grupo-pole-lunes", // Este ID dice que es una clase repetitiva
          reservas_confirmadas: [{id: 1}, {id: 2}, {id: 3}],
          profesor: "Micaela"
        },
        {
          id: "cls-2",
          nivel: "Elongación",
          dia_semana: "Martes",
          fecha: "2026-06-16",
          horario: "19:30",
          cupo_maximo: 8,
          grupo_id: "grupo-elong-martes",
          reservas_confirmadas: [{id: 1}],
          profesor: "Flor"
        }
      ])
      setCargando(false)
    }, 500)
  }

  useEffect(() => {
    cargarClasesMock()
  }, [])

  // --- LÓGICA DE BORRADO (UNA O SERIE) ---
  const confirmarBorrado = async (tipo: 'una' | 'serie') => {
    if (!claseABorrar) return
    setBorrando(true)
    
    try {
      // Acá iría la lógica Supabase. Por ahora lo simulamos:
      setTimeout(() => {
        if (tipo === 'una' || !claseABorrar.grupo_id) {
          setClases(clases.filter(c => c.id !== claseABorrar.id))
        } else {
          setClases(clases.filter(c => c.grupo_id !== claseABorrar.grupo_id))
        }
        toast.success(tipo === 'una' ? "Clase individual eliminada" : "Serie de clases eliminada permanentemente")
        setClaseABorrar(null)
        setBorrando(false)
      }, 800)

    } catch (error: any) {
      toast.error("Error al borrar: " + error.message)
      setBorrando(false)
    }
  }

  const handleClaseCreada = () => {
    setMostrandoForm(false)
    cargarClasesMock() // O cargarClases() real
  }

  const formatearFecha = (fechaString: string) => {
    const [año, mes, dia] = fechaString.split('-')
    return `${dia}/${mes}/${año}`
  }

  const clasesFiltradas = clases.filter(clase => {
    const busqueda = filtro.toLowerCase()
    const fechaFormateada = formatearFecha(clase.fecha)
    return (
      clase.nivel.toLowerCase().includes(busqueda) ||
      clase.dia_semana.toLowerCase().includes(busqueda) ||
      clase.horario.includes(busqueda) ||
      fechaFormateada.includes(busqueda)
    )
  })

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-6xl mx-auto">
      
      {/* ===================================================================================
          ENCABEZADO
      =================================================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" /> Grilla Maestra
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Gestión de horarios permanentes, profesores y cupos.</p>
        </div>
        
        {!mostrandoForm && (
          <Button onClick={() => setMostrandoForm(true)} className="w-full sm:w-auto bg-primary font-bold h-11 rounded-xl shadow-md uppercase tracking-widest">
            <Plus className="h-5 w-5 mr-2" /> Nueva Clase Fija
          </Button>
        )}
      </div>

      {/* ===================================================================================
          FORMULARIO
      =================================================================================== */}
      {mostrandoForm && (
        <div className="space-y-4 animate-in slide-in-from-right-2">
          <Button variant="outline" onClick={() => setMostrandoForm(false)} className="bg-card rounded-xl shadow-sm border-border">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la Grilla
          </Button>
          
          <Card className="border-border shadow-2xl rounded-[2.5rem] bg-card p-6 md:p-8 max-w-2xl mx-auto">
            
            {/* ACÁ LLAMAMOS AL FORMULARIO REAL QUE CREASTE */}
            <NuevaClaseForm onCertado={handleClaseCreada} /> 
            
          </Card>
        </div>
      )}

      {/* ===================================================================================
          LISTADO DE CLASES / GRILLA
      =================================================================================== */}
      {!mostrandoForm && (
        <div className="space-y-6">
          
          {/* BUSCADOR */}
          {!cargando && clases.length > 0 && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar clase por nombre o día (Ej: Pole, Lunes)..." 
                className="pl-12 h-14 bg-card border-border rounded-2xl shadow-sm text-base font-medium"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          )}

          {/* LISTA EN FORMATO TARJETAS MODERNAS */}
          <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
            {cargando ? (
              <div className="flex justify-center items-center p-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : clases.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground font-medium">
                No hay clases programadas. Configurá tu grilla.
              </div>
            ) : clasesFiltradas.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground font-medium">
                No se encontraron clases para "{filtro}".
              </div>
            ) : (
              <div className="divide-y divide-border">
                {clasesFiltradas.map((clase) => {
                  const estaLlena = (clase.reservas_confirmadas?.length || 0) >= clase.cupo_maximo;
                  
                  return (
                  <div key={clase.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                    
                    {/* INFO PRINCIPAL DE LA CLASE */}
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl text-center min-w-[80px] shadow-inner ${estaLlena ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{clase.dia_semana}</p>
                        <p className="text-xl font-black">{clase.horario.slice(0,5)}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                          {clase.nivel}
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" /> A partir del {formatearFecha(clase.fecha)}
                        </p>
                      </div>
                    </div>

                    {/* CONTROLES Y CUPOS */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                      
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs ${estaLlena ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}`}>
                        <Users className="h-4 w-4" />
                        <span>{clase.reservas_confirmadas?.length || 0} / {clase.cupo_maximo} Cupos</span>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <Button 
                          variant="outline" 
                          onClick={() => setClaseAGestionar(clase)} 
                          className="flex-1 md:flex-none border-border hover:bg-primary/10 hover:text-primary rounded-xl"
                        >
                          <Settings2 className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline font-bold uppercase text-xs tracking-widest">Alumnas</span>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={() => setClaseABorrar(clase)} 
                          className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================================
          MODAL: BORRADO (SERIE O INDIVIDUAL)
      =================================================================================== */}
      {claseABorrar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-border p-6 text-center space-y-6">
            
            <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
              <Trash2 className="h-8 w-8" />
            </div>
            
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter mb-2 text-foreground">¿Eliminar Clase?</h3>
              <p className="text-muted-foreground text-sm font-medium">
                Estás a punto de borrar el horario de <span className="font-bold text-foreground">{claseABorrar.nivel}</span> ({claseABorrar.dia_semana} {claseABorrar.horario.slice(0,5)}).
              </p>
            </div>

            {claseABorrar.reservas_confirmadas?.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 text-destructive p-4 rounded-xl text-xs text-left">
                <p className="font-black uppercase tracking-widest mb-1 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Alumnas Anotadas</p>
                Tiene <strong>{claseABorrar.reservas_confirmadas.length} reservas</strong> activas. Al borrarla, el sistema cancelará las reservas y le devolverá el crédito a las alumnas automáticamente.
              </div>
            )}
            
            <div className="space-y-3 pt-2">
              {claseABorrar.grupo_id && (
                <Button 
                  onClick={() => confirmarBorrado('serie')} 
                  disabled={borrando} 
                  className="w-full h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-black uppercase tracking-widest shadow-md"
                >
                  {borrando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Eliminar esta y las siguientes"}
                </Button>
              )}
              
              <Button 
                onClick={() => confirmarBorrado('una')} 
                disabled={borrando} 
                variant={claseABorrar.grupo_id ? "outline" : "destructive"} 
                className={`w-full h-12 rounded-xl font-bold ${!claseABorrar.grupo_id ? 'bg-destructive hover:bg-destructive/90 text-white uppercase tracking-widest shadow-md' : 'text-foreground'}`}
              >
                {borrando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Eliminar SÓLO esta fecha"}
              </Button>
              
              <Button 
                onClick={() => setClaseABorrar(null)} 
                disabled={borrando} 
                variant="ghost" 
                className="w-full h-12 text-muted-foreground hover:text-foreground font-bold"
              >
                Cancelar
              </Button>
            </div>

          </div>
        </div>
      )}
      
      {/* ===================================================================================
          MODAL GESTIONAR CLASE (Componente Externo)
      =================================================================================== */}
      {claseAGestionar && (
        <GestionarClaseModal 
          clase={claseAGestionar} 
          onClose={() => setClaseAGestionar(null)} 
          onUpdate={cargarClasesMock} 
        />
      )}
    </div>
  )
}