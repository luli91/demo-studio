"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Loader2, PlusCircle, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import TarjetasMetricas from "./secciones/TarjetasMetricas"
import GraficoEvolucion from "./secciones/GraficoEvolucion"
import AgendaDiaria from "./secciones/AgendaDiaria"
import AlertasYPagos from "./secciones/AlertasYPagos"

export default function AdminDashboardMainPage() {
  const supabase = createClient()
  
  const [metricas, setMetricas] = useState({
    recaudacionMes: 0, recaudacionAnterior: 0, crecimientoPorcentaje: 0,
    dineroEnCalle: 0, totalAlumnasActivas: 0, alumnasAlDia: 0,
    alumnasEnMora: 0, alumnasPausadas: 0, listaDeudores: [] as any[],
    ultimosPagos: [] as any[], graficoEvolucion: [] as any[]
  })
  
  const [cargando, setCargando] = useState(true)
  const [tareas, setTareas] = useState<any[]>([])

  const hoy = new Date()
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  useEffect(() => {
    const cargarDashboardYDB = async () => {
      try {
        const [resPagos, resUsuarios, resTareas, resTarifas] = await Promise.all([
          supabase.from("pagos").select("monto, fecha, beneficiario, concepto_categoria, alumno_id").order("fecha", { ascending: false }),
          supabase.from("usuarios").select("*").eq("rol", "alumno"),
          supabase.from("tareas").select("*"),
          supabase.from("tarifas").select("precio").eq("tipo", "mensual")
        ])
        
        const usuarios = resUsuarios.data || []
        const todosLosPagos = resPagos.data || []
        const tarifasBD = resTarifas.data || []
        if (resTareas.data) setTareas(resTareas.data)

        let promedioCuota = 0
        if (tarifasBD.length > 0) {
          const suma = tarifasBD.reduce((acc, curr) => acc + Number(curr.precio), 0)
          promedioCuota = suma / tarifasBD.length
        }

        let alDiaCount = 0; let enMoraCount = 0; let pausadasCount = 0; let alumnasActivas = 0;
        const morososList: any[] = []
        const diaActual = hoy.getDate(); const mesActual = hoy.getMonth(); const anioActual = hoy.getFullYear()
        const mesPasado = mesActual === 0 ? 11 : mesActual - 1
        const anioMesPasado = mesActual === 0 ? anioActual - 1 : anioActual

        // CATEGORÍAS DE EGRESOS A EXCLUIR DE INGRESOS
        const categoriasEgreso = ['HONORARIOS', 'ADELANTO_SUELDO', 'GASTO']

        const pagosMesActual = todosLosPagos.filter((p: any) => {
          const f = new Date(p.fecha)
          return f.getMonth() === mesActual && f.getFullYear() === anioActual
        })
        const pagosMesAnterior = todosLosPagos.filter((p: any) => {
          const f = new Date(p.fecha)
          return f.getMonth() === mesPasado && f.getFullYear() === anioMesPasado
        })

        // SUMAMOS SOLO LOS QUE NO SON EGRESOS (Ingresos reales)
        const totalMesActual = pagosMesActual.reduce((sum, p) => {
          if (categoriasEgreso.includes(p.concepto_categoria)) return sum // No suma si es egreso
          return sum + Number(p.monto || 0)
        }, 0)
        
        const totalMesAnterior = pagosMesAnterior.reduce((sum, p) => {
          if (categoriasEgreso.includes(p.concepto_categoria)) return sum
          return sum + Number(p.monto || 0)
        }, 0)
        
        let porcentaje = 0
        if (totalMesAnterior > 0) porcentaje = ((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100
        else if (totalMesActual > 0) porcentaje = 100 

        const ultimos6Meses = Array.from({length: 6}, (_, i) => {
          const d = new Date(anioActual, mesActual - i, 1)
          return { mesStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, nombre: new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(d).toUpperCase(), ingresos: 0 }
        }).reverse()

        todosLosPagos.forEach(p => {
          if (categoriasEgreso.includes(p.concepto_categoria)) return // No suma al gráfico si es egreso
          const f = new Date(p.fecha)
          const mesPagoStr = `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}`
          const index = ultimos6Meses.findIndex(m => m.mesStr === mesPagoStr)
          if (index !== -1) ultimos6Meses[index].ingresos += Number(p.monto)
        })

        usuarios.forEach((u: any) => {
          if (u.activa === false) return; 

          let flex: any = {}
          try { flex = typeof u.datos_flexibles === 'string' ? JSON.parse(u.datos_flexibles) : (u.datos_flexibles || {}) } catch (e) {}

          if (u.role_campo_alternativo === 'profesor' || flex.role_campo_alternativo === 'profesor' || flex.rol === 'profesor') return;

          alumnasActivas++; 

          if (flex.pausado === true || flex.estado_suscripcion === "pausado") {
            pausadasCount++
            return 
          }

          let diaVencimiento = flex.dia_vencimiento ? parseInt(flex.dia_vencimiento) : 10
          let telefonoContacto = u.telefono

          if (u.titular_id) {
            const tutor = usuarios.find((t: any) => t.id === u.titular_id)
            if (tutor) {
              const tFlex = typeof tutor.datos_flexibles === 'string' ? JSON.parse(tutor.datos_flexibles) : (tutor.datos_flexibles || {})
              if (tFlex?.dia_vencimiento) diaVencimiento = parseInt(tFlex.dia_vencimiento)
              if (!telefonoContacto && tutor.telefono) telefonoContacto = tutor.telefono
            }
          }

          const pagosPropios = todosLosPagos.filter((p: any) => {
            if (p.alumno_id === u.id) return true
            return p.beneficiario && p.beneficiario.includes(u.nombre)
          })

          const tienePagoEsteMes = pagosPropios.some((p: any) => {
            const f = new Date(p.fecha)
            return p.concepto_categoria === 'CUOTA' && f.getMonth() === mesActual && f.getFullYear() === anioActual
          })

          const tienePagoMesAnterior = pagosPropios.some((p: any) => {
            const f = new Date(p.fecha)
            return p.concepto_categoria === 'CUOTA' && f.getMonth() === mesPasado && f.getFullYear() === anioMesPasado
          })

          let estadoCalculado = 'deuda'
          if (pagosPropios.length === 0) {
            estadoCalculado = 'deuda'
          } else if (tienePagoEsteMes) {
            estadoCalculado = 'al_dia'
          } else if (!tienePagoMesAnterior) {
            estadoCalculado = 'deuda'
          } else {
            estadoCalculado = diaActual <= diaVencimiento ? 'al_dia' : 'deuda'
          }

          if (estadoCalculado === 'al_dia') {
            alDiaCount++
          } else {
            enMoraCount++
            let estadoStr = pagosPropios.length === 0 ? "Ingreso Nuevo • Pendiente" : `Vencido el ${diaVencimiento}`
            morososList.push({
              id: u.id, nombre: u.nombre, telefono: telefonoContacto, detalle: estadoStr
            })
          }
        })

        // FILTRAMOS LOS ÚLTIMOS COBROS PARA QUE SOLO SEAN INGRESOS REALES (no adelantos de sueldo)
        const ingresosRecientes = pagosMesActual.filter(p => !categoriasEgreso.includes(p.concepto_categoria))

        setMetricas({
          recaudacionMes: totalMesActual, recaudacionAnterior: totalMesAnterior, crecimientoPorcentaje: Math.round(porcentaje),
          dineroEnCalle: enMoraCount * promedioCuota, totalAlumnasActivas: alumnasActivas,
          alumnasAlDia: alDiaCount, alumnasEnMora: enMoraCount, alumnasPausadas: pausadasCount,
          listaDeudores: morososList, ultimosPagos: ingresosRecientes.slice(0, 5), graficoEvolucion: ultimos6Meses
        })
      } catch (error) {
        console.error("Error al sincronizar el tablero:", error)
      } finally {
        setCargando(false)
      }
    }

    cargarDashboardYDB()
  }, [supabase, hoyStr])

  if (cargando) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6 animate-in fade-in pb-12 max-w-[1600px] mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Métricas y desempeño mensual de tu academia.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/finanzas"><Button variant="outline" className="h-11 border-emerald-600 text-emerald-600 font-bold px-6 shadow-sm"><Wallet className="h-4 w-4 mr-2" /> Ir a Finanzas</Button></Link>
          <Link href="/admin/alumnos"><Button className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-md"><PlusCircle className="h-4 w-4 mr-2" /> Registrar Cobro</Button></Link>
        </div>
      </div>
      <TarjetasMetricas metricas={metricas} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <GraficoEvolucion datosGrafico={metricas.graficoEvolucion} />
          <AgendaDiaria tareas={tareas} setTareas={setTareas} hoyStr={hoyStr} />
        </div>
        <AlertasYPagos deudores={metricas.listaDeudores} ultimosPagos={metricas.ultimosPagos} />
      </div>
    </div>
  )
}