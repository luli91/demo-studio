"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Wallet, Trash2, TrendingUp, TrendingDown, Plus, Minus, AlertCircle, Building2, UserMinus, X, CheckSquare, Upload, Calendar, Printer, Loader2, BarChart3, Clock, ReceiptText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  
  // ACA ESTÁ LA VARIABLE NUEVA QUE ARREGLA EL ERROR
  const [valorCuotaPromedio, setValorCuotaPromedio] = useState<number>(0)

  const cargarCajaReal = async () => {
    try {
      setCargando(true)
      
      // TRAEMOS TODO DE LA NUBE, INCLUIDAS LAS TARIFAS
      const [resPagos, resUsuarios, resMovCaja, resTarifas] = await Promise.all([
        supabase.from('pagos').select('*').order('fecha', { ascending: false }),
        supabase.from('usuarios').select('id, nombre, telefono, datos_flexibles, titular_id, rol').eq('activa', true),
        supabase.from('movimientos_caja').select('*').order('fecha', { ascending: false }),
        supabase.from('tarifas').select('precio').eq('tipo', 'mensual') 
      ])

      // LE ENSEÑAMOS AL SISTEMA A CALCULAR EL PROMEDIO
      const tarifasGuardadas = resTarifas.data || []
      let promedio = 0
      if (tarifasGuardadas.length > 0) {
        const suma = tarifasGuardadas.reduce((acc, curr) => acc + Number(curr.precio), 0)
        promedio = suma / tarifasGuardadas.length
      }
      setValorCuotaPromedio(promedio)

      const ingresosMapeados = (resPagos.data || []).map(p => ({
        id: p.id,
        tipo: "ingreso",
        fecha: p.fecha,
        descripcion: `${p.concepto_categoria} - Recibo para: ${p.beneficiario}`,
        monto: p.monto,
        metodo: "Sistema Central",
        comprobante_url: null
      }))

      const movsCajaReales = resMovCaja.data || []
      
      const combinados = [...ingresosMapeados, ...movsCajaReales].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )
      setMovimientos(combinados)

      // CÁLCULO DE DEUDORES
      const usu = resUsuarios.data || []
      const pag = resPagos.data || []
      const morososList: any[] = []
      const [anioSel, mesSel] = mesSeleccionado.split('-')
      
      usu.forEach((u: any) => {
        if (u.rol === "admin") return 
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
    const yyyyMm = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`
    return yyyyMm === mesSeleccionado
  })

  const totalIngresos = movimientosFiltrados.filter(m => m.tipo === 'ingreso').reduce((acc, curr) => acc + Number(curr.monto), 0)
  const totalEgresos = movimientosFiltrados.filter(m => m.tipo === 'egreso').reduce((acc, curr) => acc + Number(curr.monto), 0)
  const resultadoNeto = totalIngresos - totalEgresos
  
  // ACA USAMOS LA VARIABLE PARA CALCULAR LA DEUDA DE LA CALLE
  const dineroEnCalle = deudoresDelMes.length * valorCuotaPromedio

  const agregarMovimiento = async (nuevoMovimiento: any) => {
    const { error } = await supabase.from('movimientos_caja').insert({
      tipo: nuevoMovimiento.tipo,
      monto: nuevoMovimiento.monto,
      descripcion: nuevoMovimiento.descripcion,
      metodo: nuevoMovimiento.metodo,
      fecha: nuevoMovimiento.fecha,
      comprobante_url: nuevoMovimiento.comprobante_url || null
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" /> Tesorería
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
            <Plus className="h-4 w-4 mr-2" /> Ingreso
          </Button>
          <Button onClick={() => { setTipoMovimiento('egreso'); setModalNuevoMovimiento(true) }} variant="outline" className="flex-1 sm:flex-none border-destructive text-destructive hover:bg-destructive hover:text-white font-bold h-11 rounded-xl px-5">
            <Minus className="h-4 w-4 mr-2" /> Gasto
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border print:hidden">
        <button onClick={() => setPestañaActiva('resumen')} className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors whitespace-nowrap ${pestañaActiva === 'resumen' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Flujo y Proyección</button>
        {modeloNegocio === 'mensual' && <button onClick={() => setPestañaActiva('deudas')} className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors whitespace-nowrap ${pestañaActiva === 'deudas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Por Cobrar</button>}
        <button onClick={() => setPestañaActiva('proveedores')} className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors whitespace-nowrap ${pestañaActiva === 'proveedores' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Checklist de Gastos Fijos</button>
      </div>

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
          alGuardar={(mov) => { agregarMovimiento(mov); setModalNuevoMovimiento(false) }} 
        />
      )}
    </div>
  )
}

// ============================================================================
// 1: FLUJO DE CAJA Y PROYECCIÓN
// ============================================================================
function TabFlujoCaja({ movimientos, ingresos, egresos, neto, dineroEnCalle }: { movimientos: any[], ingresos: number, egresos: number, neto: number, dineroEnCalle: number }) {
  const dataGrafico = [
    { name: 'Percibido (Caja Real)', Ingresos: ingresos, Gastos: egresos },
    { name: 'Proyectado (Total Esperado)', Ingresos: ingresos + dineroEnCalle, Gastos: egresos },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <Card className="border-border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-2 mb-2 text-emerald-600"><TrendingUp className="h-4 w-4" /><p className="font-black uppercase tracking-widest text-[10px]">Ingresado (Banco)</p></div><p className="text-2xl font-black">${ingresos.toLocaleString('es-AR')}</p></CardContent></Card>
        <Card className="border-amber-200 shadow-sm bg-amber-50/30"><CardContent className="p-5"><div className="flex items-center gap-2 mb-2 text-amber-600"><Clock className="h-4 w-4" /><p className="font-black uppercase tracking-widest text-[10px]">Por Cobrar (Morosos)</p></div><p className="text-2xl font-black text-amber-700">${dineroEnCalle.toLocaleString('es-AR')}</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-2 mb-2 text-destructive"><TrendingDown className="h-4 w-4" /><p className="font-black uppercase tracking-widest text-[10px]">Total Gastos</p></div><p className="text-2xl font-black">${egresos.toLocaleString('es-AR')}</p></CardContent></Card>
        <Card className={`border-none shadow-md text-white ${neto >= 0 ? 'bg-primary' : 'bg-destructive'}`}><CardContent className="p-5 relative overflow-hidden"><div className="absolute right-0 top-0 opacity-10"><Wallet className="h-24 w-24 -mt-2 -mr-2" /></div><p className="font-black uppercase tracking-widest text-[10px] opacity-80 mb-2">Neto Actual</p><p className="text-3xl font-black">${neto.toLocaleString('es-AR')}</p></CardContent></Card>
      </div>

      <Card className="border-border shadow-sm overflow-hidden print:hidden">
        <CardHeader className="p-5 border-b border-border bg-secondary/10">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Realidad vs Proyección Mensual</CardTitle>
        </CardHeader>
        <CardContent className="p-6 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} tickFormatter={(value) => `$${value >= 1000 ? (value/1000) + 'k' : value}`} />
              <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, 'Monto']} />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:w-full">
        <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/10 print:bg-transparent print:border-black print:pb-4">
          <h3 className="font-black text-sm uppercase tracking-widest print:text-black">Libro Diario</h3>
          <Button onClick={() => window.print()} variant="default" size="sm" className="gap-2 print:hidden"><Printer className="h-4 w-4" /> Imprimir</Button>
        </div>
        <div className="divide-y divide-border print:divide-black/20 max-h-[500px] overflow-y-auto">
          {movimientos.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground italic text-sm font-medium">No hay movimientos en la caja este mes.</p>
          ) : (
            movimientos.map((mov) => (
              <div key={mov.id} className="p-4 flex items-center justify-between hover:bg-secondary/5">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl print:hidden ${mov.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                    {mov.tipo === 'ingreso' ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground print:text-black">{mov.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 print:text-black/60">{new Date(mov.fecha).toLocaleDateString('es-AR')} • {mov.metodo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-black text-base print:text-black ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-foreground'}`}>
                    {mov.tipo === 'ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-AR')}
                  </p>
                  {mov.comprobante_url && (
                    <a href={mov.comprobante_url} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="outline" className="h-8 w-8 text-muted-foreground hover:text-primary"><ReceiptText className="h-4 w-4"/></Button>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 2: POR COBRAR
// ============================================================================
function TabDeudores({ deudores }: { deudores: any[] }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 print:hidden">
      <div className="bg-card rounded-2xl border border-destructive/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-destructive/5 flex items-center gap-2 text-destructive">
          <UserMinus className="h-6 w-6" />
          <h3 className="font-black text-lg uppercase tracking-tight">Cuentas por Cobrar ({deudores.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {deudores.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground italic font-medium">No hay deudas detectadas en el mes seleccionado.</p>
          ) : (
            deudores.map((deuda) => {
              const telLimpio = deuda.telefono ? deuda.telefono.replace(/\D/g, '') : "";
              const mensaje = `Hola ${deuda.nombre.split(' ')[0]}, te escribimos desde administración. Te recordamos que tenés una cuota pendiente. ¡Avisanos cuando realices el pago!`;
              const linkWhatsApp = `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`;
              return (
                <div key={deuda.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="font-bold text-foreground">{deuda.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-1">Tel: {deuda.telefono || "Sin teléfono"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {telLimpio ? (
                      <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold text-xs">Enviar WhatsApp</Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Sin celular</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 3: GASTOS FIJOS LEYENDO DESDE SUPABASE
// ============================================================================
function TabProveedores({ movimientosMes, onAgregarEgreso, mesSeleccionado }: { movimientosMes: any[], onAgregarEgreso: (mov: any) => void, mesSeleccionado: string }) {
  const supabase = createClient()
  const [modalNuevoGasto, setModalNuevoGasto] = useState(false)
  const [nuevoGasto, setNuevoGasto] = useState({ nombre: '', montoAprox: '', diaVencimiento: '10' })
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [provSeleccionado, setProvSeleccionado] = useState<any>(null)
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [subiendoPago, setSubiendoPago] = useState(false)

  const [proveedores, setProveedores] = useState<any[]>([])

  useEffect(() => {
    const cargarPlantillas = async () => {
      const { data } = await supabase.from('gastos_fijos').select('*').order('dia_vencimiento', { ascending: true })
      if (data) setProveedores(data)
    }
    cargarPlantillas()
  }, [supabase])

  const handleAgregarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('gastos_fijos').insert({
      nombre: nuevoGasto.nombre,
      monto_aprox: parseInt(nuevoGasto.montoAprox),
      dia_vencimiento: parseInt(nuevoGasto.diaVencimiento),
    }).select().single()

    if (data) {
      setProveedores([...proveedores, data])
      toast.success("Plantilla guardada en BD.")
    } else {
      toast.error("Error al guardar plantilla.")
    }

    setModalNuevoGasto(false)
    setNuevoGasto({ nombre: '', montoAprox: '', diaVencimiento: '10' })
  }

  const handleEliminar = async (id: string) => {
    if(confirm("¿Eliminar este gasto de la base de datos?")) {
      await supabase.from('gastos_fijos').delete().eq('id', id)
      setProveedores(proveedores.filter(p => p.id !== id))
    }
  }

  const handleConfirmarPagoFinal = async () => {
    if (!provSeleccionado) return
    setSubiendoPago(true)
    try {
      const [anio, mes] = mesSeleccionado.split('-')
      const fechaImputada = new Date(Number(anio), Number(mes) - 1, 15).toISOString()

      let urlComprobante = null
      if (comprobante) {
        const nombreLimpio = comprobante.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `caja/${Date.now()}-${nombreLimpio}` 
        await supabase.storage.from('documentos').upload(filePath, comprobante)
        urlComprobante = supabase.storage.from('documentos').getPublicUrl(filePath).data.publicUrl
      }

      onAgregarEgreso({ 
        tipo: 'egreso', 
        monto: provSeleccionado.monto_aprox, 
        descripcion: `Pago: ${provSeleccionado.nombre}`, 
        metodo: 'Transferencia', 
        fecha: fechaImputada,
        comprobante_url: urlComprobante
      })

      setModalConfirmar(false)
      setProvSeleccionado(null)
      setComprobante(null)
    } catch (e) {
      toast.error("Error al asentar pago.")
    } finally {
      setSubiendoPago(false)
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest">Checklist de Vencimientos</h3>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">Sincronizado con BD y Libro Diario.</p>
            </div>
          </div>
          <Button onClick={() => setModalNuevoGasto(true)} size="sm" className="font-bold rounded-xl"><Plus className="h-4 w-4 mr-1.5" /> Nueva Plantilla</Button>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {proveedores.length === 0 ? (
            <p className="p-8 col-span-2 text-center text-muted-foreground italic text-sm">No creaste ninguna plantilla de gasto fijo todavía.</p>
          ) : (
            proveedores.map((prov: any) => {
              const estaPagado = movimientosMes.some(m => m.tipo === 'egreso' && m.descripcion.includes(`Pago: ${prov.nombre}`))
              return (
                <div key={prov.id} className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${estaPagado ? 'bg-emerald-50/50 border-emerald-200 shadow-none opacity-80' : 'bg-background border-border shadow-sm'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-black uppercase tracking-tight ${estaPagado ? 'text-emerald-700' : 'text-foreground'}`}>{prov.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-1">Vence el día {prov.dia_vencimiento}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-black text-lg text-foreground opacity-70">~${prov.monto_aprox.toLocaleString('es-AR')}</p>
                      <button onClick={() => handleEliminar(prov.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded-md print:hidden"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border/50">
                    {estaPagado ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-100 px-4 py-2 rounded-lg w-full justify-center">
                        <CheckSquare className="h-5 w-5" /> Registrado en Caja
                      </div>
                    ) : (
                      <Button onClick={() => { setProvSeleccionado(prov); setModalConfirmar(true); }} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-widest rounded-lg">
                        Registrar Pago
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {modalConfirmar && provSeleccionado && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="mx-auto bg-amber-100 text-amber-600 w-14 h-14 rounded-full flex items-center justify-center mb-4"><Building2 className="h-7 w-7" /></div>
              <h2 className="text-xl font-black uppercase tracking-tight">¿Asentar Pago?</h2>
              <p className="text-xs text-muted-foreground mt-2 px-2">¿Querés registrar el pago de <strong>{provSeleccionado.nombre}</strong> por <strong>${provSeleccionado.monto_aprox.toLocaleString('es-AR')}</strong>?</p>
            </div>
            <div className="px-6 pb-6">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/20 transition-all">
                <div className="flex flex-col items-center text-center px-2">
                  <Upload className="w-5 h-5 mb-1 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {comprobante ? <span className="text-primary font-bold">{comprobante.name}</span> : <span>Adjuntar foto del ticket o PDF (Opcional)</span>}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setComprobante(e.target.files ? e.target.files[0] : null)} />
              </label>
            </div>
            <div className="p-4 bg-secondary/10 flex gap-2 border-t border-border">
              <Button onClick={() => { setModalConfirmar(false); setProvSeleccionado(null); setComprobante(null); }} variant="outline" className="flex-1" disabled={subiendoPago}>Cancelar</Button>
              <Button onClick={handleConfirmarPagoFinal} disabled={subiendoPago} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase text-xs">
                {subiendoPago ? <Loader2 className="h-4 w-4 animate-spin" /> : "Asentar Egreso"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalNuevoGasto && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 flex justify-between items-center bg-primary text-primary-foreground">
              <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-2"><Plus className="h-5 w-5" /> Plantilla BD</h3>
              <button onClick={() => setModalNuevoGasto(false)} className="hover:bg-black/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAgregarGasto} className="p-6 space-y-5">
              <div className="space-y-2"><label className="text-[10px] font-black">Proveedor / Servicio</label><input type="text" required value={nuevoGasto.nombre} onChange={e => setNuevoGasto({...nuevoGasto, nombre: e.target.value})} className="w-full bg-background border rounded-xl h-11 px-4 outline-none" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black">Monto Estimado ($)</label><input type="number" required value={nuevoGasto.montoAprox} onChange={e => setNuevoGasto({...nuevoGasto, montoAprox: e.target.value})} className="w-full bg-background border rounded-xl h-11 px-4 outline-none font-bold" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black">Día Vencimiento</label><input type="number" min="1" max="31" required value={nuevoGasto.diaVencimiento} onChange={e => setNuevoGasto({...nuevoGasto, diaVencimiento: e.target.value})} className="w-full bg-background border rounded-xl h-11 px-4 outline-none" /></div>
              <Button type="submit" className="w-full h-11 font-black rounded-xl">Guardar en Nube</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 4: MODAL DE NUEVO MOVIMIENTO
// ============================================================================
function ModalMovimiento({ tipo, mesSeleccionado, alCerrar, alGuardar }: { tipo: 'ingreso'|'egreso', mesSeleccionado: string, alCerrar: () => void, alGuardar: (mov: any) => void }) {
  const [formData, setFormData] = useState({ descripcion: '', monto: '', metodo: 'Mercado Pago' })
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.monto || !formData.descripcion) return
    setSubiendo(true)

    try {
      let urlComprobante = null
      if (comprobante) {
        const nombreLimpio = comprobante.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `caja/${Date.now()}-${nombreLimpio}` 
        await supabase.storage.from('documentos').upload(filePath, comprobante)
        urlComprobante = supabase.storage.from('documentos').getPublicUrl(filePath).data.publicUrl
      }

      const [anio, mes] = mesSeleccionado.split('-')
      const fechaImputada = new Date(Number(anio), Number(mes) - 1, 15).toISOString()
      
      alGuardar({
        tipo: tipo,
        monto: parseInt(formData.monto),
        descripcion: formData.descripcion,
        metodo: formData.metodo,
        fecha: fechaImputada,
        comprobante_url: urlComprobante
      })
    } catch (error) {
      toast.error("Error al subir archivo.")
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in print:hidden">
      <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className={`p-6 flex justify-between items-center ${tipo === 'ingreso' ? 'bg-emerald-600 text-white' : 'bg-destructive text-white'}`}>
          <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-2">
            {tipo === 'ingreso' ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />} Registrar {tipo}
          </h3>
          <button onClick={alCerrar} className="hover:bg-black/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Monto ($)</label>
            <input type="number" required value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary outline-none text-lg font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Concepto</label>
            <input type="text" required placeholder="Ej: Sponsor, Limpieza, Luz..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Método</label>
            <select value={formData.metodo} onChange={e => setFormData({...formData, metodo: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 outline-none">
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="Efectivo">Efectivo (Caja)</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          <div className="pt-2">
            <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/20 transition-all">
              <div className="flex flex-col items-center text-center px-2">
                <p className="text-[11px] text-muted-foreground font-medium">
                  {comprobante ? <span className="text-primary font-bold"><CheckSquare className="h-3 w-3 inline mr-1" />{comprobante.name}</span> : <span>Adjuntar comprobante (Opcional)</span>}
                </p>
              </div>
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setComprobante(e.target.files ? e.target.files[0] : null)} />
            </label>
          </div>
          <Button type="submit" disabled={subiendo} className={`w-full h-12 font-black uppercase tracking-widest mt-2 ${tipo === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'} text-white rounded-xl`}>
            {subiendo ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Movimiento"}
          </Button>
        </form>
      </div>
    </div>
  )
}