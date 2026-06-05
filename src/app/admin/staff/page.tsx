"use client"

import { useState, useEffect } from "react"
import { format, parseISO, isSameDay, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Users, CalendarDays, Plus, Phone, X, CheckCircle, 
  Wallet, Search, ArrowLeft, Clock, UserMinus, AlertCircle, 
  Hand, ReceiptText, Banknote, Edit3
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AdminStaffPage() {
  const [isMounted, setIsMounted] = useState(false) 
  const [vistaActiva, setVistaActiva] = useState<'directorio' | 'liquidacion' | 'historial' | 'detalle'>('directorio')
  const [profeSeleccionado, setProfeSeleccionado] = useState<any | null>(null)
  const [filtro, setFiltro] = useState("")
  
  const [modalNuevoStaff, setModalNuevoStaff] = useState(false)
  const [modalLiquidar, setModalLiquidar] = useState<{abierto: boolean, empleado: any | null, montoSugerido: number}>({abierto: false, empleado: null, montoSugerido: 0})

  // 1. BASE DE DATOS SIMULADA
  const [staff, setStaff] = useState<any[]>([])
  const [historialPagos, setHistorialPagos] = useState<any[]>([])

  useEffect(() => {
    setIsMounted(true) 
    const hoyStr = new Date().toISOString().split('T')[0]
    
    // Cargar Staff
    const guardadoStaff = localStorage.getItem('lume_admin_staff_v2')
    if (guardadoStaff) {
      setStaff(JSON.parse(guardadoStaff))
    } else {
      setStaff([
        { 
          id: 1, nombre: "Profe Florencia", rol: "profesor", especialidad: "Pole Sport", tipoPago: 'por_clase', valor: 8000, telefono: "5491122334455", 
          clases: [
            { id: 101, nivel: "Pole Coreográfico", fecha: hoyStr, horario: "19:00:00", estado: "presente" },
            { id: 102, nivel: "Elongación", fecha: "2026-06-02", horario: "20:30:00", estado: "presente" },
            { id: 103, nivel: "Pole Sport", fecha: "2026-06-10", horario: "18:00:00", estado: "pendiente" }
          ]
        },
        { 
          id: 2, nombre: "Profe Carlos", rol: "profesor", especialidad: "Futsal Primera", tipoPago: 'fijo', valor: 350000, telefono: "5491198765432", 
          clases: [
            { id: 201, nivel: "Futsal Primera", fecha: hoyStr, horario: "21:00:00", estado: "pendiente" }
          ] 
        },
      ])
    }

    // Cargar Historial de Pagos
    const guardadoPagos = localStorage.getItem('lume_admin_historial_pagos')
    if (guardadoPagos) {
      setHistorialPagos(JSON.parse(guardadoPagos))
    }
  }, [])

  useEffect(() => {
    if (isMounted && staff.length > 0) {
      localStorage.setItem('lume_admin_staff_v2', JSON.stringify(staff))
      if (profeSeleccionado) {
        setProfeSeleccionado(staff.find(p => p.id === profeSeleccionado.id))
      }
    }
  }, [staff, isMounted])

  useEffect(() => {
    if (isMounted) localStorage.setItem('lume_admin_historial_pagos', JSON.stringify(historialPagos))
  }, [historialPagos, isMounted])

  if (!isMounted) return null

  // --- LÓGICA Y FUNCIONES ---
  const agregarStaff = (nuevo: any) => { setStaff([...staff, nuevo]) }

  const cambiarEstadoClaseManual = (profeId: number, claseId: number, nuevoEstado: 'presente' | 'ausente' | 'pendiente') => {
    setStaff(staff.map(p => {
      if (p.id !== profeId) return p
      return {
        ...p,
        clases: p.clases.map((c: any) => c.id === claseId ? { ...c, estado: nuevoEstado } : c)
      }
    }))
  }

  const abrirModalLiquidacion = (empleado: any) => {
    const clasesPresentes = empleado.clases.filter((c:any) => c.estado === 'presente').length
    const sugerido = empleado.tipoPago === 'fijo' ? empleado.valor : (clasesPresentes * empleado.valor)
    setModalLiquidar({ abierto: true, empleado, montoSugerido: sugerido })
  }

  const ejecutarLiquidacion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const montoFinal = parseInt(formData.get('montoFinal') as string)
    const observaciones = formData.get('observaciones') as string
    const empleado = modalLiquidar.empleado

    // 1. Guardar en el historial de recibos
    const nuevoPago = {
      id: Date.now(),
      profeId: empleado.id,
      profeNombre: empleado.nombre,
      monto: montoFinal,
      concepto: observaciones || "Liquidación de Honorarios Mensuales",
      fecha: new Date().toISOString()
    }
    setHistorialPagos([nuevoPago, ...historialPagos])

    // 2. Resetear contadores del profesor (pasar a liquidada)
    setStaff(staff.map(p => {
      if (p.id !== empleado.id) return p
      return {
        ...p,
        clases: p.clases.map((c: any) => ({ ...c, estado: c.estado === 'presente' ? 'liquidada' : c.estado }))
      }
    }))

    setModalLiquidar({abierto: false, empleado: null, montoSugerido: 0})
    alert("Liquidación registrada exitosamente.")
  }

  const abrirDetalle = (profe: any) => {
    setProfeSeleccionado(profe)
    setVistaActiva('detalle')
  }

  const hoy = new Date()
  const profesFiltradas = staff.filter(p => p.nombre.toLowerCase().includes(filtro.toLowerCase()))

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-6xl mx-auto">
      
      {/* HEADER PRINCIPAL */}
      {vistaActiva !== 'detalle' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" /> Staff y Honorarios
              </h1>
              <p className="text-muted-foreground mt-1 font-medium">Gestión de profesores, grillas manuales y sueldos.</p>
            </div>
            <Button onClick={() => setModalNuevoStaff(true)} className="w-full sm:w-auto bg-primary font-bold h-11 rounded-xl shadow-md">
              <Plus className="h-4 w-4 mr-2" /> Agregar Profe
            </Button>
          </div>

          <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
            <button onClick={() => setVistaActiva('directorio')} className={`shrink-0 px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${vistaActiva === 'directorio' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              Directorio
            </button>
            <button onClick={() => setVistaActiva('liquidacion')} className={`shrink-0 px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${vistaActiva === 'liquidacion' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              Liquidación a Pagar
            </button>
            <button onClick={() => setVistaActiva('historial')} className={`shrink-0 px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${vistaActiva === 'historial' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              Historial de Pagos
            </button>
          </div>
        </>
      )}

      {/* ===================================================================================
          VISTA 1: DIRECTORIO
      =================================================================================== */}
      {vistaActiva === 'directorio' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar profe por nombre..." 
              className="pl-12 h-14 bg-card border-border rounded-2xl shadow-sm text-base font-medium"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profesFiltradas.map((profe) => {
              const clasesPresente = profe.clases.filter((c:any) => c.estado === 'presente').length
              const clasesAusente = profe.clases.filter((c:any) => c.estado === 'ausente').length

              return (
                <Card key={profe.id} className="border-border shadow-sm bg-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => abrirDetalle(profe)}>
                  <div className="p-5 border-b border-border bg-secondary/10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/20 text-primary font-black text-xl flex items-center justify-center">
                        {profe.nombre.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-lg uppercase tracking-tight">{profe.nombre}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{profe.especialidad}</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                      <span className="text-muted-foreground font-medium">{profe.tipoPago === 'fijo' ? 'Abono Mensual:' : 'Pago por Clase:'}</span>
                      <span className="font-black text-foreground">${profe.valor.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center pt-2">
                      <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                        <p className="text-[9px] font-black uppercase text-emerald-700">A liquidar</p>
                        <p className="text-lg font-black text-emerald-600 leading-none mt-1">{clasesPresente}</p>
                      </div>
                      <div className="bg-destructive/5 p-2 rounded-xl border border-destructive/10">
                        <p className="text-[9px] font-black uppercase text-destructive">Faltas</p>
                        <p className="text-lg font-black text-destructive leading-none mt-1">{clasesAusente}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ===================================================================================
          VISTA 2: LIQUIDACIÓN A PAGAR
      =================================================================================== */}
      {vistaActiva === 'liquidacion' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-secondary/10 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-black text-lg uppercase tracking-tight">Planilla Pendiente de Pago</h3>
            </div>
            <div className="divide-y divide-border">
              {staff.map((empleado) => {
                const clasesPresentes = empleado.clases.filter((c:any) => c.estado === 'presente').length
                const totalSueldo = empleado.tipoPago === 'fijo' ? empleado.valor : (clasesPresentes * empleado.valor)
                const yaLiquidado = empleado.tipoPago === 'por_clase' && clasesPresentes === 0

                return (
                  <div key={empleado.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/5 transition-colors">
                    <div>
                      <p className="font-black text-base uppercase text-foreground">{empleado.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {empleado.tipoPago === 'fijo' 
                          ? `Contrato Fijo Mensual (Asistencias: ${clasesPresentes})` 
                          : `${clasesPresentes} clases dictadas sin abonar × $${empleado.valor.toLocaleString('es-AR')}`
                        }
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Sugerido</p>
                        <p className="text-2xl font-black text-primary">${totalSueldo.toLocaleString('es-AR')}</p>
                      </div>
                      <Button onClick={() => abrirModalLiquidacion(empleado)} disabled={yaLiquidado} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 rounded-xl px-4 shadow-sm">
                        <Edit3 className="h-4 w-4 mr-1.5" /> Generar Recibo
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================================
          VISTA 3: HISTORIAL DE PAGOS
      =================================================================================== */}
      {vistaActiva === 'historial' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-emerald-500/10 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-emerald-600" />
              <h3 className="font-black text-lg uppercase tracking-tight text-emerald-700 dark:text-emerald-500">Recibos Emitidos</h3>
            </div>
            <div className="divide-y divide-border">
              {historialPagos.length === 0 ? (
                <p className="p-12 text-center text-muted-foreground italic text-sm">No hay liquidaciones en el historial.</p>
              ) : (
                historialPagos.sort((a,b) => parseISO(b.fecha).getTime() - parseISO(a.fecha).getTime()).map(pago => (
                  <div key={pago.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-2xl text-emerald-600 shrink-0">
                        <Banknote className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-base uppercase text-foreground">{pago.profeNombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(pago.fecha), "dd 'de' MMMM yyyy - HH:mm", {locale: es})} hs</p>
                        <p className="text-[10px] font-bold text-foreground mt-2 bg-secondary border border-border inline-block px-2 py-1 rounded-md uppercase tracking-wider">
                          {pago.concepto}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Abonado</p>
                      <p className="text-3xl font-black text-emerald-600">${pago.monto.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================================
          VISTA DETALLE (LA GRILLA MANUAL DEL PROFE)
      =================================================================================== */}
      {vistaActiva === 'detalle' && profeSeleccionado && (
        <div className="space-y-6 animate-in slide-in-from-right-2">
          <Button variant="outline" onClick={() => setVistaActiva('directorio')} className="bg-card rounded-xl shadow-sm border-border">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Staff
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm text-center">
                <div className="h-28 w-28 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center text-5xl font-black mx-auto mb-4 shadow-lg shadow-primary/20">
                  {profeSeleccionado.nombre.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-foreground leading-none">{profeSeleccionado.nombre}</h2>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2">{profeSeleccionado.especialidad}</p>
                <div className="mt-6 bg-muted/30 p-4 rounded-3xl border border-border text-sm flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {profeSeleccionado.telefono}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">Grilla de Clases</h3>
              <p className="text-sm text-muted-foreground -mt-4 mb-6">Podés corregir las asistencias de esta profesora manualmente.</p>

              <div className="space-y-4">
                {profeSeleccionado.clases.sort((a:any,b:any) => parseISO(b.fecha).getTime() - parseISO(a.fecha).getTime()).map((clase: any) => {
                  const fechaObj = parseISO(clase.fecha)
                  const esHoy = isSameDay(fechaObj, hoy)

                  return (
                    <div key={clase.id} className={`p-4 bg-card border ${clase.estado === 'ausente' ? 'border-destructive/40' : (esHoy ? 'border-primary shadow-sm' : 'border-border')} rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl text-center min-w-[4rem] ${esHoy ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-secondary-foreground'}`}>
                          <p className="text-[10px] font-black uppercase leading-none mb-1 opacity-80">{format(fechaObj, 'EEE', { locale: es })}</p>
                          <p className="text-xl font-black leading-none">{format(fechaObj, 'dd')}</p>
                        </div>
                        <div>
                          <p className={`font-bold uppercase text-lg leading-tight tracking-tight ${clase.estado === 'ausente' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {clase.nivel}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {clase.horario.slice(0,5)} hs</p>
                            {clase.estado === 'presente' && <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Dictada</span>}
                            {clase.estado === 'ausente' && <span className="text-[9px] font-black text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Ausente</span>}
                            {clase.estado === 'liquidada' && <span className="text-[9px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Liquidada (Mes Ant.)</span>}
                            {clase.estado === 'pendiente' && <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">Pendiente</span>}
                          </div>
                        </div>
                      </div>
                      
                      {clase.estado !== 'liquidada' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant={clase.estado === 'ausente' ? 'default' : 'outline'} onClick={() => cambiarEstadoClaseManual(profeSeleccionado.id, clase.id, clase.estado === 'ausente' ? 'pendiente' : 'ausente')} className={`h-9 text-[10px] font-bold uppercase tracking-widest rounded-lg ${clase.estado === 'ausente' ? 'bg-destructive text-white hover:bg-destructive/90' : 'border-destructive text-destructive hover:bg-destructive hover:text-white'}`}>
                            <UserMinus className="h-3 w-3 mr-1" /> Faltó
                          </Button>
                          <Button size="sm" variant={clase.estado === 'presente' ? 'default' : 'outline'} onClick={() => cambiarEstadoClaseManual(profeSeleccionado.id, clase.id, clase.estado === 'presente' ? 'pendiente' : 'presente')} className={`h-9 text-[10px] font-bold uppercase tracking-widest rounded-lg ${clase.estado === 'presente' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                            <Hand className="h-3 w-3 mr-1" /> Presente
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL PARA LIQUIDAR Y CERRAR MES (CON MONTO Y OBSERVACIONES) --- */}
      {modalLiquidar.abierto && modalLiquidar.empleado && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-sm overflow-hidden">
            <div className="bg-primary p-6 text-center text-primary-foreground">
              <div className="mx-auto w-14 h-14 bg-background/20 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <Wallet className="h-7 w-7" />
              </div>
              <h3 className="font-black text-xl uppercase tracking-tighter">Emitir Recibo</h3>
              <p className="text-xs font-medium opacity-80 mt-1">Liquidando a {modalLiquidar.empleado.nombre}</p>
            </div>
            
            <form onSubmit={ejecutarLiquidacion} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Monto a Transferir ($)</label>
                <Input 
                  name="montoFinal" 
                  type="number" 
                  required 
                  defaultValue={modalLiquidar.montoSugerido}
                  className="h-14 rounded-2xl text-2xl font-black text-primary border-border focus-visible:ring-primary shadow-inner bg-secondary/20" 
                />
                <p className="text-[9px] text-muted-foreground italic px-2 pt-1">
                  * El sistema sugiere ${modalLiquidar.montoSugerido.toLocaleString('es-AR')}, pero podés editarlo.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Concepto / Observaciones</label>
                <Input 
                  name="observaciones" 
                  type="text" 
                  placeholder="Ej: Sueldo Mayo + Bono Adelanto"
                  className="h-12 rounded-xl border-border bg-background" 
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 leading-tight">
                  <AlertCircle className="h-3 w-3 inline mb-0.5 mr-1" />
                  Al confirmar, las clases presentes de este mes se marcarán como liquidadas y el contador volverá a cero.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" onClick={() => setModalLiquidar({abierto: false, empleado: null, montoSugerido: 0})} variant="outline" className="flex-1 rounded-xl h-12 font-bold text-muted-foreground">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-black uppercase tracking-widest shadow-md">Confirmar Pago</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ALTA DE PERSONAL... (Oculto por longitud, queda igual que antes) */}

    </div>
  )
}