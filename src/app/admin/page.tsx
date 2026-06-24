"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { 
  Users, DollarSign, Loader2, UserMinus, UserCheck, 
  PlusCircle, MinusCircle, 
  AlertCircle, MessageCircle, Receipt, 
  StickyNote, Calendar, CheckCircle2, Circle, 
  Trash2, Clock4, X, ArrowUpRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const ETIQUETAS = [
  { id: "Administrativo", color: "bg-blue-100 text-blue-700" },
  { id: "Urgente", color: "bg-red-100 text-red-700" },
  { id: "Cumpleaños", color: "bg-fuchsia-100 text-fuchsia-700" },
  { id: "Cobro", color: "bg-emerald-100 text-emerald-700" },
  { id: "Personal", color: "bg-slate-100 text-slate-700" },
]

export default function AdminDashboardMainPage() {
  const supabase = createClient()
  
  const [metricas, setMetricas] = useState({
    recaudacionMes: 0,
    totalAlumnasActivas: 0,
    alumnasAlDia: 0,
    alumnasEnMora: 0,
    listaDeudores: [] as any[],
    ultimosPagos: [] as any[]
  })
  
  const [cargando, setCargando] = useState(true)
  const [tareas, setTareas] = useState<any[]>([])
  const [modalTareaVisible, setModalTareaVisible] = useState(false)
  const [nuevaTarea, setNuevaTarea] = useState({ texto: "", fecha: "", etiqueta: "Administrativo" })
  const [modalPosponerVisible, setModalPosponerVisible] = useState(false)
  const [tareaIdPosponer, setTareaIdPosponer] = useState<string | null>(null)
  const [fechaPosponer, setFechaPosponer] = useState("")

  const hoy = new Date()
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  useEffect(() => {
    setNuevaTarea(prev => ({ ...prev, fecha: hoyStr }))

    const cargarDashboardYDB = async () => {
      try {
        // Traemos TODOS los pagos de la BD para poder calcular el historial total (alumnos nuevos)
        const [resPagos, resUsuarios, resTareas] = await Promise.all([
          supabase.from("pagos").select("monto, fecha, beneficiario, concepto_categoria, alumno_id").order("fecha", { ascending: false }),
          supabase.from("usuarios").select("id, nombre, telefono, created_at, activa, datos_flexibles, titular_id, rol").eq("activa", true),
          supabase.from("tareas").select("*")
        ])
        
        const usuarios = resUsuarios.data || []
        const todosLosPagos = resPagos.data || []
        
        if (resTareas.data) {
          setTareas(resTareas.data)
        }

        // CORRECCIÓN: Declaramos las variables correctamente dentro de la carga asíncrona
        let alDiaCount = 0
        let enMoraCount = 0
        const morososList: any[] = []
        
        const diaActual = hoy.getDate()
        const mesActual = hoy.getMonth()
        const anioActual = hoy.getFullYear()

        // Filtramos en memoria los pagos correspondientes al mes corriente para las KPIs de recaudación
        const pagosDelMes = todosLosPagos.filter((p: any) => {
          const f = new Date(p.fecha)
          return f.getMonth() === mesActual && f.getFullYear() === anioActual
        })

        usuarios.forEach((u: any) => {
          // El Dashboard solo debe calcular cuentas de alumnos, salteamos administradores
          if (u.rol === "admin") return

          let flex: any = {}
          try {
            flex = typeof u.datos_flexibles === 'string' ? JSON.parse(u.datos_flexibles) : (u.datos_flexibles || {})
          } catch (e) {}

          // Buscamos los pagos históricos totales vinculados al alumno (o a su tutor si es menor)
          const pagosHistorialTotal = todosLosPagos.filter(p => p.alumno_id === u.id || (u.titular_id && p.alumno_id === u.titular_id))
          
          // Buscamos su día de vencimiento (si es menor, hereda el del tutor para mantener sincronismo familiar)
          let diaVencimiento = flex.dia_vencimiento ? parseInt(flex.dia_vencimiento) : 10
          if (u.titular_id) {
            const tutor = usuarios.find((t: any) => t.id === u.titular_id)
            if (tutor?.datos_flexibles) {
              const tutorFlex = typeof tutor.datos_flexibles === 'string' ? JSON.parse(tutor.datos_flexibles) : tutor.datos_flexibles
              if (tutorFlex?.dia_vencimiento) {
                diaVencimiento = parseInt(tutorFlex.dia_vencimiento)
              }
            }
          }

          // Verificamos si tiene registrada una 'CUOTA' este mes
          const tienePagoEsteMes = pagosHistorialTotal.some((p: any) => {
            const f = new Date(p.fecha)
            return p.concepto_categoria === 'CUOTA' && f.getMonth() === mesActual && f.getFullYear() === anioActual
          })

          let estaAlDia = false

          // APLICACIÓN DE LA REGLA DE HISTORIAL:
          if (pagosHistorialTotal.length === 0) {
            estaAlDia = false // Alumno nuevo sin historial de pagos entra de inmediato como deudor
          } else if (tienePagoEsteMes) {
            estaAlDia = true  // Ya pagó la cuota mensual
          } else {
            estaAlDia = diaActual <= diaVencimiento // No pagó aún, evaluamos período de gracia
          }

          if (estaAlDia) {
            alDiaCount++
          } else {
            enMoraCount++
            morososList.push({
              id: u.id,
              nombre: u.nombre,
              telefono: u.telefono,
              detalle: pagosHistorialTotal.length === 0 
                ? "Ingreso Nuevo • Matrícula/Cuota Pendiente" 
                : `Vencido el ${diaVencimiento} • ${flex.clase_asignada || "Cuota Mensual"}`
            })
          }
        })

        const totalRecaudado = pagosDelMes.reduce((sum, p) => sum + Number(p.monto || 0), 0)

        setMetricas({
          recaudacionMes: totalRecaudado,
          totalAlumnasActivas: usuarios.filter(usr => usr.rol !== "admin").length,
          alumnasAlDia: alDiaCount,
          alumnasEnMora: enMoraCount,
          listaDeudores: morososList,
          ultimosPagos: pagosDelMes.slice(0, 5)
        })

      } catch (error) {
        console.error("Error al sincronizar el tablero:", error)
      } finally {
        setCargando(false)
      }
    }

    cargarDashboardYDB()
  }, [supabase])

  // --- FUNCIONES DE TAREAS ---
  const handleAgregarTarea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaTarea.texto.trim()) return
    setModalTareaVisible(false)
    const { data, error } = await supabase.from('tareas').insert([{ texto: nuevaTarea.texto, fecha: nuevaTarea.fecha, etiqueta: nuevaTarea.etiqueta, completada: false }]).select().single()
    if (!error && data) setTareas(prev => [...prev, data])
    setNuevaTarea({ texto: "", fecha: hoyStr, etiqueta: "Administrativo" })
  }

  const toggleTarea = async (id: string) => {
    const tarea = tareas.find(t => t.id === id)
    if (!tarea) return
    const nuevoEstado = !tarea.completada
    setTareas(tareas.map(t => t.id === id ? { ...t, completada: nuevoEstado } : t))
    await supabase.from('tareas').update({ completada: nuevoEstado }).eq('id', id)
  }

  const eliminarTarea = async (id: string) => {
    setTareas(tareas.filter(t => t.id !== id))
    await supabase.from('tareas').delete().eq('id', id)
  }

  const iniciarPosponer = (id: string) => {
    setTareaIdPosponer(id)
    const mañana = new Date(); mañana.setDate(mañana.getDate() + 1)
    setFechaPosponer(`${mañana.getFullYear()}-${String(mañana.getMonth() + 1).padStart(2, '0')}-${String(mañana.getDate()).padStart(2, '0')}`)
    setModalPosponerVisible(true)
  }

  const confirmarPosponer = async (e: React.FormEvent) => {
    e.preventDefault(); if (!tareaIdPosponer || !fechaPosponer) return
    setTareas(tareas.map(t => t.id === tareaIdPosponer ? { ...t, fecha: fechaPosponer } : t))
    const idA = tareaIdPosponer; const nF = fechaPosponer
    setModalPosponerVisible(false); setTareaIdPosponer(null)
    await supabase.from('tareas').update({ fecha: nF }).eq('id', idA)
  }

  const tareasVisibles = tareas
    .filter(t => t.fecha <= hoyStr || (t.completada && t.fecha === hoyStr))
    .sort((a, b) => {
      if (a.completada === b.completada) return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      return a.completada ? 1 : -1
    })

  if (cargando) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6 animate-in fade-in pb-12 max-w-[1600px] mx-auto relative">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resumen de la Academia</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Control de cuotas e ingresos en tiempo real.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/finanzas"><Button variant="outline" className="h-11 border-red-200 text-red-600 font-bold px-6"><MinusCircle className="h-4 w-4 mr-2" /> Nuevo Gasto</Button></Link>
          <Link href="/admin/finanzas"><Button className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md shadow-emerald-600/20"><PlusCircle className="h-4 w-4 mr-2" /> Registrar Cobro</Button></Link>
        </div>
      </div>

      {/* 2. KPIs GLOBALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-5 flex items-center gap-4"><div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><DollarSign className="h-6 w-6" /></div><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ingresos Mes</p><p className="text-2xl font-black text-slate-900">${metricas.recaudacionMes.toLocaleString('es-AR')}</p></div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-5 flex items-center gap-4"><div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Users className="h-6 w-6" /></div><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Matrícula Activa</p><p className="text-2xl font-black text-slate-900">{metricas.totalAlumnasActivas}</p></div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-5 flex items-center gap-4"><div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><UserCheck className="h-6 w-6" /></div><div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Al día</p><p className="text-2xl font-black text-slate-900">{metricas.alumnasAlDia}</p></div></CardContent></Card>
        <Card className="border-red-100 shadow-sm bg-red-50/50"><CardContent className="p-5 flex items-center gap-4"><div className="bg-red-100 text-red-600 p-3 rounded-xl"><UserMinus className="h-6 w-6" /></div><div><p className="text-red-800/70 text-xs font-bold uppercase tracking-wider">Morosas</p><p className="text-2xl font-black text-red-700">{metricas.alumnasEnMora}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Agenda + Pagos */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* A. AGENDA */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between bg-amber-50/30 rounded-t-xl">
              <div className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle className="text-lg font-black text-slate-800">Mi Agenda Diaria</CardTitle>
                  <p className="text-[11px] text-slate-500 font-medium">Tareas de hoy y atrasadas.</p>
                </div>
              </div>
              <Button onClick={() => setModalTareaVisible(true)} size="sm" className="h-9 bg-slate-900 text-white font-bold"><PlusCircle className="h-4 w-4 mr-1.5" /> Agregar</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {tareasVisibles.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center"><CheckCircle2 className="h-10 w-10 text-emerald-200 mb-3" /><p className="text-slate-500 text-sm">¡Todo al día!</p></div>
                ) : (
                  tareasVisibles.map((rec) => {
                    const cE = ETIQUETAS.find(e => e.id === rec.etiqueta)?.color || "bg-slate-100 text-slate-700"
                    const atrasada = rec.fecha < hoyStr && !rec.completada
                    return (
                      <div key={rec.id} className={`p-4 px-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors ${rec.completada ? 'opacity-60' : ''}`}>
                        <div className="flex flex-1 items-center gap-3">
                          <button onClick={() => toggleTarea(rec.id)} className={rec.completada ? 'text-emerald-500' : 'text-slate-300'}>
                            {rec.completada ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                          </button>
                          <div>
                            <p className={`font-bold text-sm ${rec.completada ? 'line-through text-slate-500' : 'text-slate-800'}`}>{rec.texto}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${cE}`}>{rec.etiqueta}</span>
                              {atrasada && <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Atrasada ({rec.fecha.split('-').reverse().join('/')})</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pl-9 sm:pl-0">
                          {!rec.completada && <Button onClick={() => iniciarPosponer(rec.id)} variant="outline" size="sm" className="h-8 text-[11px] font-bold text-amber-600 border-amber-200 gap-1.5"><Clock4 className="h-3.5 w-3.5" /> Posponer</Button>}
                          <Button onClick={() => eliminarTarea(rec.id)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* B. ÚLTIMOS PAGOS */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2"><Receipt className="h-5 w-5 text-slate-400" /> Cobros del Mes</CardTitle>
              <Link href="/admin/finanzas" className="text-sm font-bold text-primary hover:underline flex items-center">Historial <ArrowUpRight className="h-4 w-4 ml-1" /></Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {metricas.ultimosPagos.map((p, idx) => (
                  <div key={idx} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">{p.beneficiario?.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.beneficiario}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.concepto_categoria} • {new Date(p.fecha).toLocaleDateString('es-AR')}</p>
                      </div>
                    </div>
                    <div className="text-right"><span className="font-black text-emerald-600">+ ${Number(p.monto).toLocaleString('es-AR')}</span></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. COLUMNA DERECHA: Cobranza de Cuotas */}
        <div className="xl:col-span-1">
          <Card className="border-red-200 shadow-lg shadow-red-900/5 bg-white sticky top-24">
            <CardHeader className="p-5 border-b border-red-100 bg-red-50/50 rounded-t-xl">
              <div className="flex items-center gap-2 text-red-700"><AlertCircle className="h-5 w-5" /><CardTitle className="text-base font-black uppercase tracking-tight">Cobranza de Cuotas</CardTitle></div>
              <p className="text-xs text-red-600/70 font-medium mt-1">Avisos automáticos a morosas.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 h-[600px] overflow-y-auto">
                {metricas.listaDeudores.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center"><UserCheck className="h-8 w-8 text-emerald-400 mb-3" />¡Todo al día!</div>
                ) : (
                  metricas.listaDeudores.map((alumno) => {
                    const tL = alumno.telefono ? String(alumno.telefono).replace(/\D/g, '') : ""
                    const msg = `Hola ${alumno.nombre.split(' ')[0]}, te escribimos de administración. Te recordamos que se encuentra pendiente el pago de tu cuota. ¡Avisanos cuando puedas regularizarlo! Gracias.`
                    return (
                      <div key={alumno.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex-1 min-w-0 pr-4"><p className="font-bold text-slate-900 text-sm truncate uppercase">{alumno.nombre}</p><p className="text-[11px] text-slate-500 truncate mt-0.5">{alumno.detalle}</p></div>
                        {tL ? (
                          <a href={`https://wa.me/${tL}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"><MessageCircle className="h-4 w-4" /></Button></a>
                        ) : <span className="text-[10px] text-slate-400 italic">Sin Tel</span>}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODALES */}
      {modalTareaVisible && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-5">
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><StickyNote className="h-5 w-5 text-primary" /> Nueva Tarea</h3>
            <form onSubmit={handleAgregarTarea} className="space-y-4">
              <input type="text" autoFocus required placeholder="¿Qué tenés que hacer?" value={nuevaTarea.texto} onChange={(e) => setNuevaTarea({...nuevaTarea, texto: e.target.value})} className="w-full border border-slate-200 rounded-xl h-12 px-4 text-sm font-medium" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={nuevaTarea.fecha} onChange={(e) => setNuevaTarea({...nuevaTarea, fecha: e.target.value})} className="w-full border border-slate-200 rounded-xl h-11 px-3 text-sm font-medium" />
                <select value={nuevaTarea.etiqueta} onChange={(e) => setNuevaTarea({...nuevaTarea, etiqueta: e.target.value})} className="w-full border border-slate-200 rounded-xl h-11 px-3 text-sm font-medium">
                  {ETIQUETAS.map(etq => <option key={etq.id} value={etq.id}>{etq.id}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2"><Button type="button" onClick={() => setModalTareaVisible(false)} variant="outline" className="flex-1">Cancelar</Button><Button type="submit" className="flex-1 bg-slate-900 text-white">Guardar</Button></div>
            </form>
          </div>
        </div>
      )}

      {modalPosponerVisible && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Clock4 className="h-5 w-5 text-amber-600" /> Posponer</h3>
            <form onSubmit={confirmarPosponer} className="space-y-4">
              <input type="date" autoFocus required min={hoyStr} value={fechaPosponer} onChange={(e) => setFechaPosponer(e.target.value)} className="w-full border border-slate-200 rounded-xl h-12 px-4" />
              <div className="flex gap-3"><Button type="button" onClick={() => setModalPosponerVisible(false)} variant="outline" className="flex-1">Cancelar</Button><Button type="submit" className="flex-1 bg-amber-500 text-white">Confirmar</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}