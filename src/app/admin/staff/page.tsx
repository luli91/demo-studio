"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { ArrowLeft, Users, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import TabStaffDirectorio from "./tabs/TabStaffDirectorio"
import TabStaffLiquidacion from "./tabs/TabStaffLiquidacion"
import TabStaffHistorial from "./tabs/TabStaffHistorial"
import TabStaffDetalle from "./tabs/TabStaffDetalle"
import ConvertirStaffModal from "@/components/admin/ConvertirStaffModal"

export default function AdminStaffPage() {
  const supabase = createClient()
  const [isMounted, setIsMounted] = useState(false) 
  const [cargando, setCargando] = useState(true)
  const [vistaActiva, setVistaActiva] = useState<'directorio' | 'liquidacion' | 'historial' | 'detalle'>('directorio')
  
  const [profeSeleccionado, setProfeSeleccionado] = useState<any | null>(null)
  const [filtro, setFiltro] = useState("")
  
  const [modalNuevoStaff, setModalNuevoStaff] = useState(false)
  const [modalLiquidar, setModalLiquidar] = useState<{abierto: boolean, empleado: any | null, montoSugerido: number}>({abierto: false, empleado: null, montoSugerido: 0})
  const [modalAdelanto, setModalAdelanto] = useState<{abierto: boolean, empleado: any | null}>({abierto: false, empleado: null})

  const [staff, setStaff] = useState<any[]>([])
  const [historialPagos, setHistorialPagos] = useState<any[]>([])

  const hoy = new Date()

  const cargarDatos = async () => {
    try {
      const { data: dataProfes, error: errProfes } = await supabase.from('usuarios').select('*').eq('role_campo_alternativo', 'profesor') 
      if (errProfes) {
        const { data: retry } = await supabase.from('usuarios').select('*').eq('rol', 'profesor')
        if (retry) mapearYSetear(retry)
      } else if (dataProfes) {
        mapearYSetear(dataProfes)
      }

      const { data: dataPagos } = await supabase.from('pagos').select('*').in('concepto_categoria', ['HONORARIOS', 'ADELANTO_SUELDO']).order('fecha', {ascending: false})
      if (dataPagos) setHistorialPagos(dataPagos)
    } catch (error: any) {
      console.error(error)
    } finally { setCargando(false) }
  }

  const mapearYSetear = (lista: any[]) => {
    const mapeados = lista.map(p => {
      let flex: any = {}
      try { flex = typeof p.datos_flexibles === 'string' ? JSON.parse(p.datos_flexibles) : (p.datos_flexibles || {}) } catch(e){}
      return { id: p.id, nombre: p.nombre, especialidad: flex.especialidad || "Profesor/a", tipoPago: flex.tipoPago || 'por_clase', valor: flex.valor_clase || 5000, telefono: p.telefono || "No especificado", datos_flexibles: flex, clases: [] }
    })
    setStaff(mapeados)
    if (profeSeleccionado) setProfeSeleccionado(mapeados.find(p => p.id === profeSeleccionado.id))
  }

  useEffect(() => { setIsMounted(true); cargarDatos() }, [])

  if (!isMounted) return null

  // --- CONTROLADORES OPERATIVOS CENTRALES ---
  const handleUpdateSueldo = async (id: string, tipo: string, monto: number) => {
    const objetivo = staff.find(p => p.id === id)
    if (!objetivo) return
    const nuevoFlex = { ...objetivo.datos_flexibles, tipoPago: tipo, valor_clase: monto }
    await supabase.from('usuarios').update({ datos_flexibles: nuevoFlex }).eq('id', id)
    toast.success("Haber base actualizado correctamente.")
    cargarDatos()
  }

  // --- GESTIÓN DE LEGAJO ---
  const handleRegistrarArchivoHistorial = async (id: string, nuevoArchivo: any) => {
    try {
      const objetivo = staff.find(p => p.id === id)
      if (!objetivo) return

      const nuevoFlex = { ...objetivo.datos_flexibles }
      
      // 1. Guardamos el archivo al inicio de la lista
      if (!nuevoFlex.archivos_historial) nuevoFlex.archivos_historial = []
      nuevoFlex.archivos_historial = [nuevoArchivo, ...nuevoFlex.archivos_historial]

      // 2. Activamos el Checkbox legal correspondiente de forma automática
      if (!nuevoFlex.documentos_legales) nuevoFlex.documentos_legales = {}
      if (['monotributo', 'seguro', 'rcp'].includes(nuevoArchivo.tipo)) {
        nuevoFlex.documentos_legales[nuevoArchivo.tipo] = true
      }

      const { error } = await supabase.from('usuarios').update({ datos_flexibles: nuevoFlex }).eq('id', id)
      if (error) throw error

      toast.success("Archivo guardado en el legajo digital.")
      cargarDatos()
    } catch (e: any) {
      toast.error("Error al impactar en la base de datos: " + e.message)
    }
  }

  // NUEVO: BORRADO DE ARCHIVOS DE LEGAJO DESDE EL ADMIN
  const handleBorrarDocumentoLegajo = async (idProfe: string, docId: string, docUrl: string | undefined, tipoDoc: string) => {
    toast("¿Eliminar este documento?", {
      description: "Se borrará de forma permanente de la nube y del legajo del profesor.",
      action: {
        label: "Sí, Borrar",
        onClick: async () => {
          try {
            const objetivo = staff.find(p => p.id === idProfe)
            if (!objetivo) return

            // 1. Borrar archivo físico de Supabase Storage
            if (docUrl) {
              const fileName = docUrl.split('/').pop()
              if (fileName) {
                await supabase.storage.from('legajos').remove([fileName])
              }
            }

            // 2. Quitarlo del historial
            const nuevoFlex = { ...objetivo.datos_flexibles }
            if (nuevoFlex.archivos_historial) {
              nuevoFlex.archivos_historial = nuevoFlex.archivos_historial.filter((d: any) => d.id !== docId)
            }

            // 3. Inteligencia: Si ya no quedan documentos de ese tipo, destildamos la casilla legal
            const quedanDeEsteTipo = (nuevoFlex.archivos_historial || []).some((d: any) => d.tipo === tipoDoc)
            if (!quedanDeEsteTipo && nuevoFlex.documentos_legales) {
              nuevoFlex.documentos_legales[tipoDoc] = false
            }

            // 4. Actualizar Base de Datos
            const { error } = await supabase.from('usuarios').update({ datos_flexibles: nuevoFlex }).eq('id', idProfe)
            if (error) throw error

            toast.success("Documento eliminado del legajo.")
            cargarDatos()
          } catch (error: any) {
            toast.error("Error al borrar el documento: " + error.message)
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

  const handleAgregarEtiqueta = async (val: string) => {
    if (!val.trim() || !profeSeleccionado) return
    const tagLimpio = val.toUpperCase().trim()
    const objetivo = staff.find(p => p.id === profeSeleccionado.id)
    if (!objetivo) return

    const nuevoFlex = { ...objetivo.datos_flexibles }
    if (!nuevoFlex.etiquetas_asignadas) nuevoFlex.etiquetas_asignadas = []
    
    if (!nuevoFlex.etiquetas_asignadas.includes(tagLimpio)) {
      nuevoFlex.etiquetas_asignadas.push(tagLimpio)
      await supabase.from('usuarios').update({ datos_flexibles: nuevoFlex }).eq('id', profeSeleccionado.id)
      toast.success("Grupo asignado con éxito.")
      cargarDatos()
    }
  }

  const handleRemoverEtiqueta = async (val: string) => {
    if (!profeSeleccionado) return
    const objetivo = staff.find(p => p.id === profeSeleccionado.id)
    if (!objetivo) return

    const nuevoFlex = { ...objetivo.datos_flexibles }
    if (nuevoFlex.etiquetas_asignadas) {
      nuevoFlex.etiquetas_asignadas = nuevoFlex.etiquetas_asignadas.filter((t: string) => t !== val)
      await supabase.from('usuarios').update({ datos_flexibles: nuevoFlex }).eq('id', profeSeleccionado.id)
      toast.success("Grupo revocado.")
      cargarDatos()
    }
  }

  const handleRemoverStaff = (id: string, nombre: string) => {
    toast(`¿Desvincular a ${nombre}?`, {
      description: "Retornará al rol general de alumno.",
      action: {
        label: "Sí, desvincular",
        onClick: async () => {
          await supabase.from('usuarios').update({ rol: 'alumno' }).eq('id', id)
          toast.success("Desvinculación procesada exitosamente.")
          setVistaActiva('directorio')
          cargarDatos()
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

  const handleEliminarPago = (idPago: number) => {
    toast("¿Eliminar este registro financiero?", {
      description: "Se borrará del historial del profesor y el saldo volverá a tu caja en Finanzas. Esta acción no se puede deshacer.",
      action: {
        label: "Sí, Anular Pago",
        onClick: async () => {
          try {
            const { error } = await supabase.from('pagos').delete().eq('id', idPago)
            if (error) throw error
            toast.success("Liquidación anulada. El dinero ha vuelto a la caja.")
            cargarDatos() 
          } catch (e: any) {
            toast.error("Error al anular: " + e.message)
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

  const ejecutarAdelanto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const monto = parseInt(formData.get('montoFinal') as string)
    const obs = formData.get('observaciones') as string
    await supabase.from('pagos').insert({ alumno_id: modalAdelanto.empleado.id, nro_recibo: `ADE-${Date.now().toString().slice(-5)}`, concepto_categoria: 'ADELANTO_SUELDO', concepto_detalle: obs || "Adelanto de Sueldo", monto, beneficiario: modalAdelanto.empleado.nombre, estado: 'aprobado', fecha: new Date().toISOString() })
    setModalAdelanto({ abierto: false, empleado: null })
    toast.success("Adelanto asentado."); cargarDatos()
  }

  const ejecutarLiquidacion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const monto = parseInt(formData.get('montoFinal') as string)
    const obs = formData.get('observaciones') as string
    await supabase.from('pagos').insert({ alumno_id: modalLiquidar.empleado.id, nro_recibo: `HON-${Date.now().toString().slice(-5)}`, concepto_categoria: 'HONORARIOS', concepto_detalle: obs || "Liquidación Mensual", monto, beneficiario: modalLiquidar.empleado.nombre, estado: 'aprobado', fecha: new Date().toISOString() })
    setModalLiquidar({ abierto: false, empleado: null, montoSugerido: 0 })
    toast.success("Honorarios liquidados."); cargarDatos()
  }

  if (cargando) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {vistaActiva === 'detalle' ? (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setVistaActiva('directorio')} className="font-bold"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Button>
          <TabStaffDetalle 
            profe={profeSeleccionado} 
            historialPagos={historialPagos} 
            onRemoverStaff={handleRemoverStaff} 
            onUpdateSueldo={handleUpdateSueldo} 
            onAgregarEtiqueta={handleAgregarEtiqueta} 
            onRemoverEtiqueta={handleRemoverEtiqueta} 
            onRegistrarArchivoHistorial={handleRegistrarArchivoHistorial}
            onBorrarDocumento={handleBorrarDocumentoLegajo} 
            onEliminarPago={handleEliminarPago}
            onAbrirAdelanto={(p: any) => setModalAdelanto({ abierto: true, empleado: p })} 
            hoy={hoy} 
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3"><Users className="h-8 w-8 text-primary" /> Staff & Honorarios</h1>
              <p className="text-muted-foreground mt-1 font-medium">Gestión integral del personal de la academia.</p>
            </div>
            <Button onClick={() => setModalNuevoStaff(true)} className="bg-primary font-bold h-11 rounded-xl"><Plus className="h-4 w-4 mr-2" /> Agregar al Staff</Button>
          </div>
          <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
            <button onClick={() => setVistaActiva('directorio')} className={`px-4 py-2 font-bold uppercase text-xs rounded-t-lg ${vistaActiva === 'directorio' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Directorio</button>
            <button onClick={() => setVistaActiva('liquidacion')} className={`px-4 py-2 font-bold uppercase text-xs rounded-t-lg ${vistaActiva === 'liquidacion' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Liquidación Pendiente</button>
            <button onClick={() => setVistaActiva('historial')} className={`px-4 py-2 font-bold uppercase text-xs rounded-t-lg ${vistaActiva === 'historial' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Historial</button>
          </div>
          {vistaActiva === 'directorio' && <TabStaffDirectorio staff={staff} filtro={filtro} setFiltro={setFiltro} onVerDetalle={(p: any) => { setProfeSeleccionado(p); setVistaActiva('detalle') }} />}
          {vistaActiva === 'liquidacion' && <TabStaffLiquidacion staff={staff} historialPagos={historialPagos} onAbrirLiquidacion={(e: any, m: number) => setModalLiquidar({ abierto: true, empleado: e, montoSugerido: m })} />}
          {vistaActiva === 'historial' && <TabStaffHistorial historialPagos={historialPagos} onEliminarPago={handleEliminarPago} />}
        </>
      )}

      {/* MODALES */}
      {modalLiquidar.abierto && modalLiquidar.empleado && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-sm overflow-hidden">
            <div className="bg-primary p-5 text-center text-primary-foreground font-black uppercase">Emitir Recibo</div>
            <form onSubmit={ejecutarLiquidacion} className="p-6 space-y-4">
              <Input name="montoFinal" type="number" required defaultValue={modalLiquidar.montoSugerido} className="h-12 font-black text-lg text-center" />
              <Input name="observaciones" type="text" placeholder="Concepto (Opcional)" className="h-11" />
              <div className="flex gap-2"><Button type="button" onClick={() => setModalLiquidar({ abierto: false, empleado: null, montoSugerido: 0 })} variant="outline" className="flex-1">Cancelar</Button><Button type="submit" className="flex-1 bg-emerald-600 text-white">Confirmar Pago</Button></div>
            </form>
          </div>
        </div>
      )}

      {modalAdelanto.abierto && modalAdelanto.empleado && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-sm overflow-hidden">
            <div className="bg-amber-500 p-5 text-center text-white font-black uppercase">Registrar Adelanto</div>
            <form onSubmit={ejecutarAdelanto} className="p-6 space-y-4">
              <Input name="montoFinal" type="number" required placeholder="Monto del Adelanto" className="h-12 font-black text-lg text-center" />
              <Input name="observaciones" type="text" placeholder="Motivo o Detalle" className="h-11" />
              <div className="flex gap-2"><Button type="button" onClick={() => setModalAdelanto({ abierto: false, empleado: null })} variant="outline" className="flex-1">Cancelar</Button><Button type="submit" className="flex-1 bg-amber-600 text-white">Entregar Plata</Button></div>
            </form>
          </div>
        </div>
      )}

      <ConvertirStaffModal abierto={modalNuevoStaff} onClose={() => setModalNuevoStaff(false)} onConvertido={() => { setModalNuevoStaff(false); cargarDatos() }} />
    </div>
  )
}