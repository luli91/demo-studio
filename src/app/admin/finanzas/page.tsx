"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Wallet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Importaciones locales de las pestañas estructuradas
import TabFlujoCaja from "./tabs/TabFlujoCaja"
import TabDeudores from "./tabs/TabDeudores"
import TabProveedores from "./tabs/TabProveedores"
import ModalMovimiento from "./tabs/ModalMovimiento"

export default function FinanzasDashboard() {
  const supabase = createClient()
  const modeloNegocio = "mensual" 
  
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

  const cargarCajaReal = async () => {
    try {
      setCargando(true)
      const [resPagos, resUsuarios, resMovCaja, resTarifas] = await Promise.all([
        supabase.from('pagos').select('*').order('fecha', { ascending: false }),
        supabase.from('usuarios').select('id, nombre, telefono, datos_flexibles, titular_id, rol').eq('activa', true),
        supabase.from('movimientos_caja').select('*').order('fecha', { ascending: false }),
        supabase.from('tarifas').select('precio').eq('tipo', 'mensual') 
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
          comprobante_url: null
        }
      })

      const combinados = [...ingresosMapeados, ...(resMovCaja.data || [])].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )
      setMovimientos(combinados)

      // Cálculo de morosos
      const usu = resUsuarios.data || []
      const pag = resPagos.data || []
      const morososList: any[] = []
      const [anioSel, mesSel] = mesSeleccionado.split('-')
      
      usu.forEach((u: any) => {
        if (u.rol === "admin" || u.rol === "profesor") return 
        let flex: any = {}
        try { flex = typeof u.datos_flexibles === 'string' ? JSON.parse(u.datos_flexibles) : (u.datos_flexibles || {}) } catch (e) {}
        if (flex.pausado === true) return

        const pagosHistorialTotal = pag.filter(p => p.alumno_id === u.id || (u.titular_id && p.alumno_id === u.titular_id))
        let diaVencimiento = flex.dia_vencimiento ? parseInt(flex.dia_vencimiento) : 10
        
        if (u.titular_id) {
          const tutor = usu.find((t: any) => t.id === u.titular_id)
          if (tutor?.datos_flexibles) {
            const tFlex = typeof tutor.datos_flexibles === 'string' ? JSON.parse(tutor.datos_flexibles) : tutor.datos_flexibles
            if (tFlex?.dia_vencimiento) diaVencimiento = parseInt(tFlex.dia_vencimiento)
          }
        }

        const tienePagoEsteMes = pagosHistorialTotal.some((p: any) => {
          const f = new Date(p.fecha)
          return p.concepto_categoria === 'CUOTA' && f.getMonth() === (Number(mesSel)-1) && f.getFullYear() === Number(anioSel)
        })

        const hoy = new Date()
        const mesActualReal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
        let estaAlDia = false
        
        if (pagosHistorialTotal.length === 0) estaAlDia = false
        else if (tienePagoEsteMes) estaAlDia = true
        else if (mesSeleccionado === mesActualReal) estaAlDia = hoy.getDate() <= diaVencimiento
        else if (mesSeleccionado > mesActualReal) estaAlDia = true 
        else estaAlDia = false 

        if (!estaAlDia) morososList.push(u)
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
    const f = new Date(m.fecha)
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}` === mesSeleccionado
  })

  // Los totales ahora dan exactos porque el mapeo ya le puso "egreso" a los sueldos
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
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" /> Finanzas
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Control de caja, proyecciones y egresos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={mesSeleccionado} 
            onChange={(e) => setMesSeleccionado(e.target.value)} 
            className="bg-secondary/20 border-2 border-border rounded-xl px-4 h-11 font-black uppercase tracking-widest text-sm outline-none shadow-sm focus:border-primary"
          >
            {opcionesMeses.map(mes => <option key={mes.value} value={mes.value}>{mes.label}</option>)}
          </select>
          <Button onClick={() => { setTipoMovimiento('ingreso'); setModalNuevoMovimiento(true) }} variant="outline" className="flex-1 sm:flex-none border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold h-11 rounded-xl px-5">
            Ingreso
          </Button>
          <Button onClick={() => { setTipoMovimiento('egreso'); setModalNuevoMovimiento(true) }} variant="outline" className="flex-1 sm:flex-none border-destructive text-destructive hover:bg-destructive hover:text-white font-bold h-11 rounded-xl px-5">
            Gasto
          </Button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border print:hidden">
        <button onClick={() => setPestañaActiva('resumen')} className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors whitespace-nowrap ${pestañaActiva === 'resumen' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Flujo y Proyección</button>
        {modeloNegocio === 'mensual' && <button onClick={() => setPestañaActiva('deudas')} className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors whitespace-nowrap ${pestañaActiva === 'deudas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Por Cobrar</button>}
        <button onClick={() => setPestañaActiva('proveedores')} className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors whitespace-nowrap ${pestañaActiva === 'proveedores' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Checklist de Gastos Fijos</button>
      </div>

      {/* RENDERS */}
      {cargando ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {pestañaActiva === 'resumen' && <TabFlujoCaja movimientos={movimientosFiltrados} ingresos={totalIngresos} egresos={totalEgresos} neto={resultadoNeto} dineroEnCalle={dineroEnCalle} />}
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
    </div>
  )
}