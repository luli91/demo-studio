"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Wallet, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

import TabFlujoCaja from "./tabs/TabFlujoCaja"
import TabDeudores from "./tabs/TabDeudores"
import TabProveedores from "./tabs/TabProveedores"
import ModalMovimiento from "./tabs/ModalMovimiento"
import VisorReciboPDF from "@/components/admin/VisorReciboPDF"

export default function FinanzasDashboard() {
  const supabase = createClient()
  
  const [modeloNegocio, setModeloNegocio] = useState<string>("mensual") 
  
  const generarMeses = () => {
    const meses = []
    const actual = new Date()
    for (let i = -12; i <= 12; i++) {
      const d = new Date(actual.getFullYear(), actual.getMonth() + i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(d)
      meses.push({ value, label })
    }
    return meses
  }
  
  const opcionesMeses = generarMeses()
  const [mesSeleccionado, setMesSeleccionado] = useState(opcionesMeses[12].value)
  const [pestañaActiva, setPestañaActiva] = useState('resumen')
  const [modalNuevoMovimiento, setModalNuevoMovimiento] = useState(false)
  const [tipoMovimiento, setTipoMovimiento] = useState<'ingreso' | 'egreso'>('ingreso')
  const [cargando, setCargando] = useState(true)

  const [movimientos, setMovimientos] = useState<any[]>([])
  const [deudoresDelMes, setDeudoresDelMes] = useState<any[]>([])
  const [valorCuotaPromedio, setValorCuotaPromedio] = useState<number>(0)
  
  const [reciboVisualizado, setReciboVisualizado] = useState<any | null>(null)
  const [academiaOficial, setAcademiaOficial] = useState<any>({
    nombre_largo: "MI ACADEMIA", nombre_corto: "MI ACADEMIA",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=Lume&backgroundColor=ffffff",
    admin_nombre: "Administración", firma_url: ""
  })

  const cargarCajaReal = async () => {
    try {
      setCargando(true)

      const { data: aca } = await supabase.from('academias').select('*').limit(1).single()
      const modeloActivo = aca?.modelo_negocio || "mensual"
      setModeloNegocio(modeloActivo)

      if (aca) {
        setAcademiaOficial({
          nombre_largo: aca.nombre || "MI ACADEMIA",
          nombre_corto: aca.nombre_corto || aca.nombre || "MI ACADEMIA",
          siglas: aca.siglas || "APP",
          logo_url: aca.logo_url || "https://api.dicebear.com/7.x/shapes/svg?seed=Lume&backgroundColor=ffffff",
          firma_url: aca.firma_url || "",
          admin_nombre: aca.admin_nombre || "Administración"
        })
      }

      const [resPagos, resUsuarios, resMovCaja, resTarifas] = await Promise.all([
        supabase.from('pagos').select('*').order('fecha', { ascending: false }),
        supabase.from('usuarios').select('*').eq('rol', 'alumno'),
        supabase.from('movimientos_caja').select('*').order('fecha', { ascending: false }),
        supabase.from('tarifas').select('precio').eq('tipo', modeloActivo)
      ])

      const tarifasGuardadas = resTarifas.data || []
      let promedio = 0
      if (tarifasGuardadas.length > 0) {
        const suma = tarifasGuardadas.reduce((acc, curr) => acc + Number(curr.precio), 0)
        promedio = suma / tarifasGuardadas.length
      }
      setValorCuotaPromedio(promedio)

      const ingresosMapeados = (resPagos.data || []).map(p => {
        const esEgreso = ['HONORARIOS', 'ADELANTO_SUELDO', 'GASTO'].includes(p.concepto_categoria)
        return {
          id: p.id, 
          tipo: esEgreso ? "egreso" : "ingreso", 
          fecha: p.fecha, 
          descripcion: `${p.concepto_categoria} - Para: ${p.beneficiario || 'Sistema'}`, 
          monto: p.monto, 
          metodo: p.concepto_detalle || "Sistema Central", 
          comprobante_url: null,
          nro_recibo: p.nro_recibo || `REC-${p.id.substring(0, 5)}`,
          concepto_categoria: p.concepto_categoria,
          concepto_detalle: p.concepto_detalle || "",
          beneficiario: p.beneficiario || "Cliente"
        }
      })

      const cajaMapeada = (resMovCaja.data || []).map(m => ({
        id: m.id,
        tipo: m.tipo,
        fecha: m.fecha,
        descripcion: m.descripcion,
        monto: m.monto,
        metodo: m.metodo || "Caja Manual",
        comprobante_url: m.comprobante_url || null,
        nro_recibo: `CAJA-${String(m.id).substring(0, 5)}`,
        concepto_categoria: m.tipo === 'ingreso' ? 'INGRESO EXTRA' : 'GASTO',
        concepto_detalle: m.descripcion,
        beneficiario: m.tipo === 'ingreso' ? 'Academia' : 'Proveedor / Staff'
      }))

      const combinados = [...ingresosMapeados, ...cajaMapeada].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )
      setMovimientos(combinados)

      // CÁLCULO DE MOROSOS DE FINANZAS (CON PERÍODO DE GRACIA)
      const usu = resUsuarios.data || []
      const pag = resPagos.data || []
      const morososList: any[] = []
      const [anioSel, mesSel] = mesSeleccionado.split('-')
      
      const hoy = new Date()
      const diaActual = hoy.getDate()
      const mesActual = hoy.getMonth()
      const anioActual = hoy.getFullYear()
      const mesActualReal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`

      usu.forEach((u: any) => {
        if (u.activa === false) return

        let flex: any = {}
        try { flex = typeof u.datos_flexibles === 'string' ? JSON.parse(u.datos_flexibles) : (u.datos_flexibles || {}) } catch (e) {}
        
        if (u.role_campo_alternativo === 'profesor' || flex.role_campo_alternativo === 'profesor' || flex.rol === 'profesor') return
        if (flex.pausado === true || flex.estado_suscripcion === "pausado") return

        let diaVencimiento = flex.dia_vencimiento ? parseInt(flex.dia_vencimiento) : 10
        let telefonoContacto = u.telefono
        
        if (u.titular_id) {
          const tutor = usu.find((t: any) => t.id === u.titular_id)
          if (tutor) {
            const tFlex = typeof tutor.datos_flexibles === 'string' ? JSON.parse(tutor.datos_flexibles) : (tutor.datos_flexibles || {})
            if (tFlex?.dia_vencimiento) diaVencimiento = parseInt(tFlex.dia_vencimiento)
            if (!telefonoContacto && tutor.telefono) telefonoContacto = tutor.telefono
          }
        }

        const pagosPropios = pag.filter((p: any) => {
          if (p.alumno_id === u.id) return true
          return p.beneficiario && p.beneficiario.includes(u.nombre) 
        })

        const tienePagoMesSeleccionado = pagosPropios.some((p: any) => {
          if (p.concepto_categoria !== 'CUOTA') return false
          const esDelMesSeleccionado = p.concepto_detalle?.includes(`Mes ${Number(mesSel)}`)
          if (esDelMesSeleccionado) return true
          
          if (!p.concepto_detalle?.includes("Mes")) {
            const f = new Date(p.fecha)
            return f.getMonth() === (Number(mesSel)-1) && f.getFullYear() === Number(anioSel)
          }
          return false
        })

        let estaAlDia = false

        if (mesSeleccionado === mesActualReal) {
          // ESTAMOS MIRANDO EL MES EN CURSO: APLICAMOS PERÍODO DE GRACIA
          const mesPasado = hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1
          const anioMesPasado = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear()
          
          const tienePagoMesAnterior = pagosPropios.some((p: any) => {
            if (p.concepto_categoria !== 'CUOTA') return false
            const esDelMesAnteriorExacto = p.concepto_detalle?.includes(`Mes ${mesPasado + 1}`)
            if (esDelMesAnteriorExacto) return true
            if (!p.concepto_detalle?.includes("Mes")) {
              const f = new Date(p.fecha)
              return f.getMonth() === mesPasado && f.getFullYear() === anioMesPasado
            }
            return false
          })

          if (pagosPropios.length === 0) {
            estaAlDia = false
          } else if (tienePagoMesSeleccionado) {
            estaAlDia = true
          } else if (!tienePagoMesAnterior) {
            estaAlDia = false
          } else {
            estaAlDia = diaActual <= diaVencimiento
          }

        } else if (mesSeleccionado > mesActualReal) {
          // MESES FUTUROS: No son morosos
          estaAlDia = true
        } else {
          // MESES PASADOS: Si no pagaste, debés
          estaAlDia = tienePagoMesSeleccionado
        }

        if (!estaAlDia) {
          let estadoStr = pagosPropios.length === 0 ? "Ingreso Nuevo • Pendiente" : `Vencido (Debe el mes seleccionado)`
          morososList.push({
            id: u.id, nombre: u.nombre, telefono: telefonoContacto, detalle: estadoStr
          })
        }
      })
      setDeudoresDelMes(morososList)

    } catch (e: any) {
      toast.error("Error al sincronizar caja: " + e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarCajaReal()
  }, [mesSeleccionado])

  const movimientosFiltrados = movimientos.filter(m => {
    if (!m.fecha) return false
    return m.fecha.substring(0, 7) === mesSeleccionado
  })

  const totalIngresos = movimientosFiltrados.filter(m => m.tipo === 'ingreso').reduce((acc, curr) => acc + Number(curr.monto), 0)
  const totalEgresos = movimientosFiltrados.filter(m => m.tipo === 'egreso').reduce((acc, curr) => acc + Number(curr.monto), 0)
  const resultadoNeto = totalIngresos - totalEgresos
  const dineroEnCalle = deudoresDelMes.length * valorCuotaPromedio

  const agregarMovimiento = async (nuevoMovimiento: any) => {
    const { error } = await supabase.from('movimientos_caja').insert({
      tipo: nuevoMovimiento.tipo, monto: nuevoMovimiento.monto, descripcion: nuevoMovimiento.descripcion, metodo: nuevoMovimiento.metodo, fecha: nuevoMovimiento.fecha, comprobante_url: nuevoMovimiento.comprobante_url || null
    })
    if (error) {
      toast.error("Error al guardar en la nube.")
    } else {
      toast.success(nuevoMovimiento.tipo === 'egreso' ? "Gasto guardado en BD." : "Ingreso extra guardado.")
      cargarCajaReal()
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-6xl mx-auto relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <Link href="/admin/dashboard"><Button variant="ghost" className="mb-2 -ml-4 text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard</Button></Link>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" /> Finanzas
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Control de caja, proyecciones y egresos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={mesSeleccionado} 
            onChange={(e) => setMesSeleccionado(e.target.value)} 
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 font-black uppercase tracking-widest text-slate-700 text-sm outline-none shadow-sm focus:border-emerald-500 cursor-pointer"
          >
            {opcionesMeses.map(mes => <option key={mes.value} value={mes.value}>{mes.label}</option>)}
          </select>
          <Button onClick={() => { setTipoMovimiento('ingreso'); setModalNuevoMovimiento(true) }} className="flex-1 sm:flex-none bg-emerald-600 text-white hover:bg-emerald-700 font-bold h-11 rounded-xl px-5 shadow-sm">
            + Ingreso
          </Button>
          <Button onClick={() => { setTipoMovimiento('egreso'); setModalNuevoMovimiento(true) }} className="flex-1 sm:flex-none bg-slate-900 text-white hover:bg-slate-800 font-bold h-11 rounded-xl px-5 shadow-sm">
            - Gasto
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 print:hidden">
        <button onClick={() => setPestañaActiva('resumen')} className={`px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-xl transition-colors whitespace-nowrap ${pestañaActiva === 'resumen' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Flujo y Proyección</button>
        {modeloNegocio === 'mensual' && <button onClick={() => setPestañaActiva('deudas')} className={`px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-xl transition-colors whitespace-nowrap ${pestañaActiva === 'deudas' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Por Cobrar</button>}
        <button onClick={() => setPestañaActiva('proveedores')} className={`px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-xl transition-colors whitespace-nowrap ${pestañaActiva === 'proveedores' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Gastos Fijos</button>
      </div>

      {cargando ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <>
          {pestañaActiva === 'resumen' && <TabFlujoCaja movimientos={movimientosFiltrados} ingresos={totalIngresos} egresos={totalEgresos} neto={resultadoNeto} dineroEnCalle={dineroEnCalle} onVerRecibo={setReciboVisualizado} />}
          {pestañaActiva === 'deudas' && <TabDeudores deudores={deudoresDelMes} />}
          {pestañaActiva === 'proveedores' && <TabProveedores movimientosMes={movimientosFiltrados} onAgregarEgreso={agregarMovimiento} mesSeleccionado={mesSeleccionado} />}
        </>
      )}

      {modalNuevoMovimiento && (
        <ModalMovimiento 
          tipo={tipoMovimiento} 
          mesSeleccionado={mesSeleccionado}
          alCerrar={() => setModalNuevoMovimiento(false)} 
          alGuardar={(mov: any) => { agregarMovimiento(mov); setModalNuevoMovimiento(false) }} 
        />
      )}

      {reciboVisualizado && (
        <VisorReciboPDF recibo={reciboVisualizado} academia={academiaOficial} onClose={() => setReciboVisualizado(null)} />
      )}
    </div>
  )
}