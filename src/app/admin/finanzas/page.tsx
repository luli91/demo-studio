"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Wallet, Trash2, TrendingUp, TrendingDown, Plus, Minus, AlertCircle, Building2, UserMinus, X, CheckSquare, Upload, Calendar, Printer, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function FinanzasDashboard() {
  const supabase = createClient()
  const modeloNegocio = "mensual" 
  
  const [pestañaActiva, setPestañaActiva] = useState('resumen')
  const [modalNuevoMovimiento, setModalNuevoMovimiento] = useState(false)
  const [tipoMovimiento, setTipoMovimiento] = useState<'ingreso' | 'egreso'>('ingreso')
  const [cargando, setCargando] = useState(true)

  // Movimientos unificados (Ingresos de Supabase + Egresos locales)
  const [movimientos, setMovimientos] = useState<any[]>([])

  const cargarCajaReal = async () => {
    try {
      setCargando(true)
      // 1. Traemos todos los pagos registrados por secretaría en Supabase
      const { data: ingresosReal, error } = await supabase
        .from('pagos')
        .select('*')
        .order('fecha', { ascending: false })

      if (error) throw error

      // 2. Mapeamos los pagos a la estructura del Libro Diario
      const ingresosMapeados = (ingresosReal || []).map(p => ({
        id: p.id,
        tipo: "ingreso",
        fecha: p.fecha,
        descripcion: `${p.concepto_categoria} - Recibo para: ${p.beneficiario}`,
        monto: p.monto,
        metodo: "Caja / Sistema"
      }))

      // 3. Cargamos los egresos guardados localmente
      const guardados = localStorage.getItem('lume_egresos_manuales')
      const egresosLocales = guardados ? JSON.parse(guardados) : []

      // Combinamos ambos y ordenamos por fecha más reciente
      const combinados = [...ingresosMapeados, ...egresosLocales].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )

      setMovimientos(combinados)
    } catch (e: any) {
      toast.error("Error al sincronizar caja: " + e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarCajaReal()
  }, [])

  const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((acc, curr) => acc + Number(curr.monto), 0)
  const totalEgresos = movimientos.filter(m => m.tipo === 'egreso').reduce((acc, curr) => acc + Number(curr.monto), 0)
  const resultadoNeto = totalIngresos - totalEgresos

  const agregarMovimiento = async (nuevoMovimiento: any) => {
    if (nuevoMovimiento.tipo === 'egreso') {
      // Guardamos el egreso localmente para no interferir con la tabla estricta de pagos
      const guardados = localStorage.getItem('lume_egresos_manuales')
      const actuales = guardados ? JSON.parse(guardados) : []
      const nuevos = [nuevoMovimiento, ...actuales]
      localStorage.setItem('lume_egresos_manuales', JSON.stringify(nuevos))
      toast.success("Gasto registrado en el libro diario.")
      cargarCajaReal()
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-6xl mx-auto relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic">Tesorería Integral</h1>
          <p className="text-muted-foreground mt-1 font-medium">Caja, gastos fijos y facturación en tiempo real.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button onClick={() => { setTipoMovimiento('egreso'); setModalNuevoMovimiento(true) }} variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white font-bold h-11 rounded-xl">
            <Minus className="h-4 w-4 mr-2" /> Gasto
          </Button>
          <p className="text-xs text-muted-foreground self-center hidden md:block">Los ingresos se registran desde el Directorio de Alumnos.</p>
        </div>
      </div>

      {/* MENÚ DE PESTAÑAS */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border print:hidden">
        <button onClick={() => setPestañaActiva('resumen')} className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors whitespace-nowrap ${pestañaActiva === 'resumen' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          Flujo de Caja
        </button>
        {modeloNegocio === 'mensual' && (
          <button onClick={() => setPestañaActiva('deudas')} className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors whitespace-nowrap ${pestañaActiva === 'deudas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            Deudores
          </button>
        )}
        <button onClick={() => setPestañaActiva('proveedores')} className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors whitespace-nowrap ${pestañaActiva === 'proveedores' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          Gastos Fijos
        </button>
      </div>

      {cargando ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {pestañaActiva === 'resumen' && (
            <TabFlujoCaja movimientos={movimientos} ingresos={totalIngresos} egresos={totalEgresos} neto={resultadoNeto} />
          )}
          
          {pestañaActiva === 'deudas' && (
            <TabDeudores />
          )}

          {pestañaActiva === 'proveedores' && (
            <TabProveedores onAgregarEgreso={agregarMovimiento} />
          )}
        </>
      )}

      {modalNuevoMovimiento && (
        <ModalMovimiento 
          tipo={tipoMovimiento} 
          alCerrar={() => setModalNuevoMovimiento(false)} 
          alGuardar={(mov) => { agregarMovimiento(mov); setModalNuevoMovimiento(false) }} 
        />
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTE 1: FLUJO DE CAJA
// ============================================================================
function TabFlujoCaja({ movimientos, ingresos, egresos, neto }: { movimientos: any[], ingresos: number, egresos: number, neto: number }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <Card className="border-border shadow-sm bg-card"><CardContent className="p-6"><div className="flex items-center gap-2 mb-4 text-emerald-600"><TrendingUp className="h-5 w-5" /><p className="font-black uppercase tracking-widest text-xs">Total Ingresos</p></div><p className="text-3xl font-black text-foreground">${ingresos.toLocaleString('es-AR')}</p></CardContent></Card>
        <Card className="border-border shadow-sm bg-card"><CardContent className="p-6"><div className="flex items-center gap-2 mb-4 text-destructive"><TrendingDown className="h-5 w-5" /><p className="font-black uppercase tracking-widest text-xs">Total Gastos</p></div><p className="text-3xl font-black text-foreground">${egresos.toLocaleString('es-AR')}</p></CardContent></Card>
        <Card className={`border-none shadow-md text-white ${neto >= 0 ? 'bg-primary' : 'bg-destructive'}`}><CardContent className="p-6 relative overflow-hidden"><div className="absolute right-0 top-0 opacity-10"><Wallet className="h-32 w-32 -mt-4 -mr-4" /></div><p className="font-black uppercase tracking-widest text-xs opacity-80 mb-2">Resultado del Mes</p><p className="text-5xl font-black">${neto.toLocaleString('es-AR')}</p></CardContent></Card>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:w-full">
        <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/10 print:bg-transparent print:border-black print:pb-4">
          <h3 className="font-black text-lg uppercase tracking-tight print:text-black">Libro Diario de Movimientos</h3>
          <Button onClick={() => window.print()} variant="default" className="gap-2 print:hidden"><Printer className="h-4 w-4" /> Imprimir PDF</Button>
        </div>
        
        <div className="divide-y divide-border print:divide-black/20">
          {movimientos.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground italic text-sm">No hay movimientos registrados en este período.</p>
          ) : (
            movimientos.map((mov) => (
              <div key={mov.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl print:hidden ${mov.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                    {mov.tipo === 'ingreso' ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground print:text-black">{mov.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 print:text-black/60">{new Date(mov.fecha).toLocaleDateString('es-AR')} • {mov.metodo}</p>
                  </div>
                </div>
                <p className={`font-black text-base print:text-black ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-foreground'}`}>
                  {mov.tipo === 'ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-AR')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// (Los sub-componentes TabDeudores, TabProveedores y ModalMovimiento quedan exactamente iguales a como los tenías)

// ============================================================================
// SUB-COMPONENTE 2: DEUDORES (WhatsApp Dinámico)
// ============================================================================
function TabDeudores() {
  const deudores = [
    { id: 1, nombre: "Martina López", concepto: "Cuota Junio - Acrobacia", monto: 18000, diasAtraso: 5, telefono: "5491122334455" },
    { id: 2, nombre: "Julieta Ramírez", concepto: "Cuota Junio - Futsal", monto: 15000, diasAtraso: 2, telefono: "5491198765432" },
  ]

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 print:hidden">
      <div className="bg-card rounded-2xl border border-destructive/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-destructive/5 flex items-center gap-2 text-destructive">
          <UserMinus className="h-6 w-6" />
          <h3 className="font-black text-lg uppercase tracking-tight">Seguimiento de Morosos</h3>
        </div>
        <div className="divide-y divide-border">
          {deudores.map((deuda) => {
            // ACÁ SE ARMA EL LINK DINÁMICO CON EL TELÉFONO DE LA CHICA
            const mensaje = `Hola ${deuda.nombre.split(' ')[0]}, nos comunicamos desde la administración. Te recordamos el pago de ${deuda.concepto} por $${deuda.monto}. ¡Avisanos cuando lo abones!`;
            const linkWhatsApp = `https://wa.me/${deuda.telefono}?text=${encodeURIComponent(mensaje)}`;

            return (
              <div key={deuda.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">{deuda.nombre}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Atraso de {deuda.diasAtraso} días</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-black text-destructive text-lg">${deuda.monto.toLocaleString('es-AR')}</p>
                  <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold">Enviar WhatsApp</Button>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTE 3: PROVEEDORES Y GASTOS FIJOS (Con Mes en PDF)
// ============================================================================
function TabProveedores({ onAgregarEgreso }: { onAgregarEgreso: (mov: any) => void }) {
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
  const [modalNuevoGasto, setModalNuevoGasto] = useState(false)
  const [nuevoGasto, setNuevoGasto] = useState({ nombre: '', montoAprox: '', diaVencimiento: '10' })

  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [provSeleccionado, setProvSeleccionado] = useState<any>(null)
  const [comprobante, setComprobante] = useState<File | null>(null)

  const [proveedores, setProveedores] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const guardado = localStorage.getItem('lume_gastos_fijos')
      if (guardado) return JSON.parse(guardado)
    }
    return [
      { id: 1, nombre: "Edesur (Luz)", diaVencimiento: 12, montoAprox: 45000, pagado: false, mes: opcionesMeses[12].value },
      { id: 2, nombre: "Alquiler Local", diaVencimiento: 5, montoAprox: 250000, pagado: true, mes: opcionesMeses[12].value },
    ]
  })

  useEffect(() => {
    localStorage.setItem('lume_gastos_fijos', JSON.stringify(proveedores))
  }, [proveedores])

  const proveedoresDelMes = proveedores.filter(p => p.mes === mesSeleccionado)
  // Obtenemos el nombre del mes seleccionado para mostrarlo en el PDF
  const nombreMesPDF = opcionesMeses.find(m => m.value === mesSeleccionado)?.label

  const handleAgregarGasto = (e: React.FormEvent) => {
    e.preventDefault()
    const prov = {
      id: Date.now(),
      nombre: nuevoGasto.nombre,
      montoAprox: parseInt(nuevoGasto.montoAprox),
      diaVencimiento: parseInt(nuevoGasto.diaVencimiento),
      pagado: false,
      mes: mesSeleccionado
    }
    setProveedores([...proveedores, prov])
    setModalNuevoGasto(false)
    setNuevoGasto({ nombre: '', montoAprox: '', diaVencimiento: '10' })
  }

  const handleEliminar = (id: number) => {
    if(confirm("¿Estás segura de eliminar este gasto fijo?")) {
      setProveedores(proveedores.filter(p => p.id !== id))
    }
  }

  const handlePreparaPago = (prov: any) => {
    setProvSeleccionado(prov)
    setModalConfirmar(true)
  }

  const handleConfirmarPagoFinal = () => {
    if (!provSeleccionado) return
    setProveedores(proveedores.map(p => p.id === provSeleccionado.id ? { ...p, pagado: true } : p))
    onAgregarEgreso({ 
      id: Date.now(), 
      tipo: 'egreso', 
      monto: provSeleccionado.montoAprox, 
      descripcion: `Pago: ${provSeleccionado.nombre}`, 
      metodo: 'Transferencia', 
      fecha: new Date().toISOString()
    })
    setModalConfirmar(false)
    setProvSeleccionado(null)
    setComprobante(null)
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none">
        
        {/* ENCABEZADO */}
        <div className="p-6 border-b border-border bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:bg-transparent">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight">Control Mensual</h3>
              {/* MAGIA: Este texto solo aparece en la hoja impresa */}
              <p className="hidden print:block text-sm font-bold text-muted-foreground capitalize">
                Período: {nombreMesPDF}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="bg-background border border-border rounded-xl px-3 py-2 font-bold text-sm outline-none capitalize">
              {opcionesMeses.map(mes => <option key={mes.value} value={mes.value}>{mes.label}</option>)}
            </select>
            <Button onClick={() => setModalNuevoGasto(true)} className="font-bold"><Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Agregar</span></Button>
            <Button onClick={() => window.print()} variant="outline" className="font-bold"><Printer className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Imprimir</span></Button>
          </div>
        </div>
        
        {/* LISTA GASTOS */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
          {proveedoresDelMes.map((prov: any) => (
            <div key={prov.id} className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${prov.pagado ? 'bg-emerald-50/50 border-emerald-200 shadow-none' : 'bg-background border-border shadow-sm print:border-gray-300'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={`font-black uppercase tracking-tight ${prov.pagado ? 'text-emerald-700' : 'text-foreground'}`}>{prov.nombre}</p>
                  <p className="text-xs text-muted-foreground mt-1">Vence el día {prov.diaVencimiento}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-black text-lg text-foreground opacity-70">~${prov.montoAprox.toLocaleString('es-AR')}</p>
                  <button onClick={() => handleEliminar(prov.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded-md print:hidden"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/50">
                {prov.pagado ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-100 px-4 py-2 rounded-lg w-full justify-center print:border print:border-emerald-500 print:bg-transparent">
                    <CheckSquare className="h-5 w-5" /> Pagado
                  </div>
                ) : (
                  <Button onClick={() => handlePreparaPago(prov)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-widest print:hidden">
                    Pagar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CONFIRMAR */}
      {modalConfirmar && provSeleccionado && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in print:hidden">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="mx-auto bg-amber-100 text-amber-600 w-14 h-14 rounded-full flex items-center justify-center mb-4"><Building2 className="h-7 w-7" /></div>
              <h2 className="text-xl font-black uppercase tracking-tight">¿Confirmar Pago?</h2>
              <p className="text-xs text-muted-foreground mt-2 px-2">¿Marcar pagado <strong>{provSeleccionado.nombre}</strong> por <strong>${provSeleccionado.montoAprox.toLocaleString('es-AR')}</strong>?</p>
            </div>
            <div className="px-6 pb-6">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/20">
                <div className="flex flex-col items-center text-center px-2">
                  <Upload className="w-5 h-5 mb-1 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground font-medium">{comprobante ? <span className="text-primary font-bold">{comprobante.name}</span> : <span>Adjuntar foto del ticket (Opcional)</span>}</p>
                </div>
                <input type="file" className="hidden" onChange={(e) => setComprobante(e.target.files ? e.target.files[0] : null)} />
              </label>
            </div>
            <div className="p-4 bg-secondary/10 flex gap-2 border-t border-border">
              <Button onClick={() => { setModalConfirmar(false); setProvSeleccionado(null); }} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={handleConfirmarPagoFinal} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase text-xs">Sí, Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO GASTO */}
      {modalNuevoGasto && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in print:hidden">
          <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 flex justify-between items-center bg-primary text-primary-foreground">
              <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-2"><Plus className="h-5 w-5" /> Nuevo Gasto Fijo</h3>
              <button onClick={() => setModalNuevoGasto(false)} className="hover:bg-black/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAgregarGasto} className="p-6 space-y-5">
              <div className="space-y-2"><label className="text-[10px] font-black">Proveedor</label><input type="text" required value={nuevoGasto.nombre} onChange={e => setNuevoGasto({...nuevoGasto, nombre: e.target.value})} className="w-full bg-background border rounded-xl h-11 px-4 outline-none" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black">Monto ($)</label><input type="number" required value={nuevoGasto.montoAprox} onChange={e => setNuevoGasto({...nuevoGasto, montoAprox: e.target.value})} className="w-full bg-background border rounded-xl h-11 px-4 outline-none font-bold" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black">Vencimiento</label><input type="number" min="1" max="31" required value={nuevoGasto.diaVencimiento} onChange={e => setNuevoGasto({...nuevoGasto, diaVencimiento: e.target.value})} className="w-full bg-background border rounded-xl h-11 px-4 outline-none" /></div>
              <Button type="submit" className="w-full h-11 font-black">Guardar Gasto Fijo</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTE 4: MODAL DE NUEVO MOVIMIENTO (Aislado para evitar lag)
// ============================================================================
function ModalMovimiento({ tipo, alCerrar, alGuardar }: { tipo: 'ingreso'|'egreso', alCerrar: () => void, alGuardar: (mov: any) => void }) {
  // Al estar este estado aislado acá, cuando tipeás NO recarga la página entera, solo este cuadradito.
  const [formData, setFormData] = useState({ descripcion: '', monto: '', metodo: 'Mercado Pago' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.monto || !formData.descripcion) return
    const nuevoMovimiento = {
      id: Date.now(),
      tipo: tipo,
      monto: parseInt(formData.monto),
      descripcion: formData.descripcion,
      metodo: formData.metodo,
      fecha: new Date().toISOString()
    }
    alGuardar(nuevoMovimiento)
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
            <input type="text" required value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Método</label>
            <select value={formData.metodo} onChange={e => setFormData({...formData, metodo: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 outline-none">
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="Efectivo">Efectivo (Caja)</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          <Button type="submit" className={`w-full h-12 font-black uppercase tracking-widest mt-4 ${tipo === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'} text-white`}>Guardar</Button>
        </form>
      </div>
    </div>
  )
}