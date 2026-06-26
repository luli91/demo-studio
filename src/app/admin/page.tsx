"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { 
  Users, DollarSign, Loader2, UserMinus, UserCheck, 
  PlusCircle, MinusCircle, 
  AlertCircle, MessageCircle, Receipt, 
  StickyNote, CheckCircle2, Circle, 
  Trash2, Clock4, TrendingUp, TrendingDown, PauseCircle, Wallet
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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
    recaudacionAnterior: 0,
    crecimientoPorcentaje: 0,
    dineroEnCalle: 0,
    totalAlumnasActivas: 0,
    alumnasAlDia: 0,
    alumnasEnMora: 0,
    alumnasPausadas: 0,
    listaDeudores: [] as any[],
    ultimosPagos: [] as any[],
    graficoEvolucion: [] as any[]
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
        // AGREGAMOS LA CONSULTA A LAS TARIFAS REALES
        const [resPagos, resUsuarios, resTareas, resTarifas] = await Promise.all([
          supabase.from("pagos").select("monto, fecha, beneficiario, concepto_categoria, alumno_id").order("fecha", { ascending: false }),
          supabase.from("usuarios").select("id, nombre, telefono, created_at, activa, datos_flexibles, titular_id, rol").eq("activa", true),
          supabase.from("tareas").select("*"),
          supabase.from("tarifas").select("precio").eq("tipo", "mensual")
        ])
        
        const usuarios = resUsuarios.data || []
        const todosLosPagos = resPagos.data || []
        const tarifasBD = resTarifas.data || []
        
        if (resTareas.data) setTareas(resTareas.data)

        // CALCULAMOS EL PRECIO DE LA CUOTA EN VIVO
        let promedioCuota = 0
        if (tarifasBD.length > 0) {
          const suma = tarifasBD.reduce((acc, curr) => acc + Number(curr.precio), 0)
          promedioCuota = suma / tarifasBD.length
        }

        let alDiaCount = 0
        let enMoraCount = 0
        let pausadasCount = 0
        const morososList: any[] = []
        
        const diaActual = hoy.getDate()
        const mesActual = hoy.getMonth()
        const anioActual = hoy.getFullYear()

        const pagosMesActual = todosLosPagos.filter((p: any) => {
          const f = new Date(p.fecha)
          return f.getMonth() === mesActual && f.getFullYear() === anioActual
        })

        const mesPasado = mesActual === 0 ? 11 : mesActual - 1
        const anioMesPasado = mesActual === 0 ? anioActual - 1 : anioActual
        const pagosMesAnterior = todosLosPagos.filter((p: any) => {
          const f = new Date(p.fecha)
          return f.getMonth() === mesPasado && f.getFullYear() === anioMesPasado
        })

        const totalMesActual = pagosMesActual.reduce((sum, p) => sum + Number(p.monto || 0), 0)
        const totalMesAnterior = pagosMesAnterior.reduce((sum, p) => sum + Number(p.monto || 0), 0)
        
        let porcentaje = 0
        if (totalMesAnterior > 0) {
          porcentaje = ((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100
        } else if (totalMesActual > 0) {
          porcentaje = 100 
        }

        const ultimos6Meses = Array.from({length: 6}, (_, i) => {
          const d = new Date(anioActual, mesActual - i, 1)
          return {
            mesStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
            nombre: new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(d).toUpperCase(),
            ingresos: 0
          }
        }).reverse()

        todosLosPagos.forEach(p => {
          const f = new Date(p.fecha)
          const mesPagoStr = `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}`
          const index = ultimos6Meses.findIndex(m => m.mesStr === mesPagoStr)
          if (index !== -1) {
            ultimos6Meses[index].ingresos += Number(p.monto)
          }
        })

        usuarios.forEach((u: any) => {
          if (u.rol === "admin") return

          let flex: any = {}
          try { flex = typeof u.datos_flexibles === 'string' ? JSON.parse(u.datos_flexibles) : (u.datos_flexibles || {}) } catch (e) {}

          if (flex.pausado === true || flex.estado_suscripcion === "pausado") {
            pausadasCount++
            return 
          }

          const pagosHistorialTotal = todosLosPagos.filter(p => p.alumno_id === u.id || (u.titular_id && p.alumno_id === u.titular_id))
          
          let diaVencimiento = flex.dia_vencimiento ? parseInt(flex.dia_vencimiento) : 10
          if (u.titular_id) {
            const tutor = usuarios.find((t: any) => t.id === u.titular_id)
            if (tutor?.datos_flexibles) {
              const tutorFlex = typeof tutor.datos_flexibles === 'string' ? JSON.parse(tutor.datos_flexibles) : tutor.datos_flexibles
              if (tutorFlex?.dia_vencimiento) diaVencimiento = parseInt(tutorFlex.dia_vencimiento)
            }
          }

          const tienePagoEsteMes = pagosHistorialTotal.some((p: any) => {
            const f = new Date(p.fecha)
            return p.concepto_categoria === 'CUOTA' && f.getMonth() === mesActual && f.getFullYear() === anioActual
          })

          let estaAlDia = false
          if (pagosHistorialTotal.length === 0) estaAlDia = false
          else if (tienePagoEsteMes) estaAlDia = true
          else estaAlDia = diaActual <= diaVencimiento

          if (estaAlDia) {
            alDiaCount++
          } else {
            enMoraCount++
            morososList.push({
              id: u.id,
              nombre: u.nombre,
              telefono: u.telefono,
              detalle: pagosHistorialTotal.length === 0 
                ? "Ingreso Nuevo • Pendiente" 
                : `Vencido el ${diaVencimiento}`
            })
          }
        })

        setMetricas({
          recaudacionMes: totalMesActual,
          recaudacionAnterior: totalMesAnterior,
          crecimientoPorcentaje: Math.round(porcentaje),
          dineroEnCalle: enMoraCount * promedioCuota, // AHORA MULTIPLICA POR LA TARIFA REAL
          totalAlumnasActivas: usuarios.filter(usr => usr.rol !== "admin").length,
          alumnasAlDia: alDiaCount,
          alumnasEnMora: enMoraCount,
          alumnasPausadas: pausadasCount,
          listaDeudores: morososList,
          ultimosPagos: pagosMesActual.slice(0, 5),
          graficoEvolucion: ultimos6Meses
        })

      } catch (error) {
        console.error("Error al sincronizar el tablero:", error)
      } finally {
        setCargando(false)
      }
    }

    cargarDashboardYDB()
  }, [supabase, hoyStr])

  const handleAgregarTarea = async (e: React.FormEvent) => {
    e.preventDefault(); if (!nuevaTarea.texto.trim()) return
    setModalTareaVisible(false)
    const { data, error } = await supabase.from('tareas').insert([{ texto: nuevaTarea.texto, fecha: nuevaTarea.fecha, etiqueta: nuevaTarea.etiqueta, completada: false }]).select().single()
    if (!error && data) setTareas(prev => [...prev, data])
    setNuevaTarea({ texto: "", fecha: hoyStr, etiqueta: "Administrativo" })
  }
  const toggleTarea = async (id: string) => {
    const tarea = tareas.find(t => t.id === id); if (!tarea) return
    const nuevoEstado = !tarea.completada
    setTareas(tareas.map(t => t.id === id ? { ...t, completada: nuevoEstado } : t))
    await supabase.from('tareas').update({ completada: nuevoEstado }).eq('id', id)
  }
  const eliminarTarea = async (id: string) => {
    setTareas(tareas.filter(t => t.id !== id))
    await supabase.from('tareas').delete().eq('id', id)
  }
  const iniciarPosponer = (id: string) => {
    setTareaIdPosponer(id); const mañana = new Date(); mañana.setDate(mañana.getDate() + 1)
    setFechaPosponer(`${mañana.getFullYear()}-${String(mañana.getMonth() + 1).padStart(2, '0')}-${String(mañana.getDate()).padStart(2, '0')}`)
    setModalPosponerVisible(true)
  }
  const confirmarPosponer = async (e: React.FormEvent) => {
    e.preventDefault(); if (!tareaIdPosponer || !fechaPosponer) return
    setTareas(tareas.map(t => t.id === tareaIdPosponer ? { ...t, fecha: fechaPosponer } : t))
    setModalPosponerVisible(false); await supabase.from('tareas').update({ fecha: fechaPosponer }).eq('id', tareaIdPosponer)
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
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Métricas y desempeño mensual de tu academia.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/finanzas"><Button variant="outline" className="h-11 border-emerald-600 text-emerald-600 font-bold px-6 shadow-sm"><Wallet className="h-4 w-4 mr-2" /> Ir a Tesorería</Button></Link>
          <Link href="/admin/alumnos"><Button className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-md"><PlusCircle className="h-4 w-4 mr-2" /> Registrar Cobro</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><DollarSign className="h-6 w-6" /></div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ingresos Mes</p>
                <p className="text-2xl font-black text-slate-900">${metricas.recaudacionMes.toLocaleString('es-AR')}</p>
              </div>
            </div>
            <div className={`mt-4 text-xs font-bold flex items-center gap-1 ${metricas.crecimientoPorcentaje >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {metricas.crecimientoPorcentaje >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {metricas.crecimientoPorcentaje > 0 ? '+' : ''}{metricas.crecimientoPorcentaje}% vs. mes pasado
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Users className="h-6 w-6" /></div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Matrícula Activa</p>
                <p className="text-2xl font-black text-slate-900">{metricas.totalAlumnasActivas}</p>
              </div>
            </div>
            <div className="mt-4 text-xs font-bold flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
              <PauseCircle className="h-3.5 w-3.5" /> {metricas.alumnasPausadas} {metricas.alumnasPausadas === 1 ? 'cuenta pausada' : 'cuentas pausadas'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><UserCheck className="h-6 w-6" /></div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Al día</p>
              <p className="text-2xl font-black text-slate-900">{metricas.alumnasAlDia}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 shadow-sm bg-red-50/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 text-red-600 p-3 rounded-xl"><UserMinus className="h-6 w-6" /></div>
              <div>
                <p className="text-red-800/70 text-xs font-bold uppercase tracking-wider">Morosas</p>
                <p className="text-2xl font-black text-red-700">{metricas.alumnasEnMora}</p>
              </div>
            </div>
            <div className="mt-4 text-[11px] font-black uppercase tracking-widest text-red-600/70 border-t border-red-200/50 pt-2">
              Dinero en la calle: <span className="text-red-700 font-black">${metricas.dineroEnCalle.toLocaleString('es-AR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-2 space-y-6">
          
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" /> Evolución de Ingresos (6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-8 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricas.graficoEvolucion} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                    tickFormatter={(value) => `$${value >= 1000 ? (value/1000) + 'k' : value}`} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, 'Ingresos']}
                  />
                  <Bar dataKey="ingresos" radius={[6, 6, 0, 0]}>
                    {metricas.graficoEvolucion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === metricas.graficoEvolucion.length - 1 ? '#10b981' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between bg-amber-50/30 rounded-t-xl">
              <div className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle className="text-lg font-black text-slate-800">Mi Agenda Diaria</CardTitle>
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
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card className="border-red-200 shadow-lg shadow-red-900/5 bg-white">
            <CardHeader className="p-5 border-b border-red-100 bg-red-50/50 rounded-t-xl">
              <div className="flex items-center gap-2 text-red-700"><AlertCircle className="h-5 w-5" /><CardTitle className="text-base font-black uppercase tracking-tight">Cobranza de Cuotas</CardTitle></div>
              <p className="text-xs text-red-600/70 font-medium mt-1">Avisos automáticos a morosas.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {metricas.listaDeudores.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center"><UserCheck className="h-8 w-8 text-emerald-400 mb-3" />¡Todo al día!</div>
                ) : (
                  metricas.listaDeudores.map((alumno) => {
                    const tL = alumno.telefono ? String(alumno.telefono).replace(/\D/g, '') : ""
                    const msg = `Hola ${alumno.nombre.split(' ')[0]}, te escribimos de administración. Te recordamos que se encuentra pendiente el pago de tu cuota. ¡Avisanos cuando puedas regularizarlo! Gracias.`
                    return (
                      <div key={alumno.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex-1 min-w-0 pr-4"><p className="font-bold text-slate-900 text-sm truncate uppercase">{alumno.nombre}</p><p className="text-[11px] font-bold text-red-500 truncate mt-0.5">{alumno.detalle}</p></div>
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

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase text-slate-800 flex items-center gap-2"><Receipt className="h-4 w-4 text-slate-400" /> Últimos Cobros</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {metricas.ultimosPagos.map((p, idx) => (
                  <div key={idx} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">{p.beneficiario?.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.beneficiario}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400 mt-0.5">{new Date(p.fecha).toLocaleDateString('es-AR')}</p>
                      </div>
                    </div>
                    <div className="text-right"><span className="font-black text-sm text-emerald-600">+ ${Number(p.monto).toLocaleString('es-AR')}</span></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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