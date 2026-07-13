"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Megaphone, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

import VisorReciboPDF from "@/components/admin/VisorReciboPDF"
import SponsorsTable from "./componentes/SponsorsTable"
import HistorialCobros from "./componentes/HistorialCobros"
import ModalSponsor from "./componentes/ModalSponsor"
import ModalCobro from "./componentes/ModalCobro"

export default function AdminSponsorsPage() {
  const supabase = createClient()
  
  const [sponsors, setSponsors] = useState<any[]>([])
  const [historialPagos, setHistorialPagos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState<'directorio' | 'historial'>('directorio')
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalCobro, setModalCobro] = useState<any>(null)
  const [reciboVisualizado, setReciboVisualizado] = useState<any | null>(null)
  
  const [academiaOficial, setAcademiaOficial] = useState<any>(null)
  const [nuevoSponsor, setNuevoSponsor] = useState({ nombre: "", telefono: "", link: "", cuota_mensual: "", logo_url: "" })
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [sponsorEditando, setSponsorEditando] = useState<any>(null)

  const hoy = new Date()
  const mesActual = hoy.getMonth()
  const anioActual = hoy.getFullYear()

  const cargarSponsorsYPagos = async () => {
    try {
      setCargando(true)
      const [resSponsors, resPagos, resAca] = await Promise.all([
        supabase.from('usuarios').select('*').eq('rol', 'sponsor').eq('activa', true),
        supabase.from('pagos').select('*').eq('concepto_categoria', 'SPONSOR').order('fecha', { ascending: false }),
        supabase.from('academias').select('*').limit(1).single()
      ])
      if (resSponsors.error) throw resSponsors.error
      if (resPagos.error) throw resPagos.error
      
      setSponsors(resSponsors.data || [])
      setHistorialPagos(resPagos.data || [])

      if (resAca.data) {
        setAcademiaOficial({
          nombre_largo: resAca.data.nombre || "MI ACADEMIA",
          nombre_corto: resAca.data.nombre_corto || resAca.data.nombre || "MI ACADEMIA",
          logo_url: resAca.data.logo_url || "",
          firma_url: resAca.data.firma_url || "",
          admin_nombre: resAca.data.admin_nombre || "Administración"
        })
      }
    } catch (error) {
      toast.error("Error al cargar datos.")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarSponsorsYPagos()
  }, [])

  const abrirModalNuevo = () => {
    setSponsorEditando(null)
    setNuevoSponsor({ nombre: "", telefono: "", link: "", cuota_mensual: "", logo_url: "" })
    setArchivoLogo(null)
    setModalAbierto(true)
  }

  const abrirModalEditar = (sponsor: any) => {
    const flex = typeof sponsor.datos_flexibles === 'string' ? JSON.parse(sponsor.datos_flexibles) : (sponsor.datos_flexibles || {})
    setSponsorEditando({ id: sponsor.id, datos_flexibles: flex, logo_url: flex.logo_url })
    setNuevoSponsor({ nombre: sponsor.nombre || "", telefono: sponsor.telefono || "", link: flex.link || "", cuota_mensual: flex.cuota_mensual?.toString() || "", logo_url: flex.logo_url || "" })
    setArchivoLogo(null)
    setModalAbierto(true)
  }

  const handleGuardarSponsor = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      let logoFinal = sponsorEditando?.logo_url || ""
      if (archivoLogo) {
        const fileExt = archivoLogo.name.split('.').pop()
        const filePath = `sponsors/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, archivoLogo, { upsert: true })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        logoFinal = data.publicUrl
      }

      if (sponsorEditando) {
        const payloadFlex = { ...sponsorEditando.datos_flexibles, link: nuevoSponsor.link, cuota_mensual: Number(nuevoSponsor.cuota_mensual), logo_url: logoFinal }
        const { error } = await supabase.from('usuarios').update({ nombre: nuevoSponsor.nombre, telefono: nuevoSponsor.telefono, datos_flexibles: payloadFlex }).eq('id', sponsorEditando.id)
        if (error) throw error
        toast.success("¡Patrocinador actualizado!")
      } else {
        const payload = { id: uuidv4(), nombre: nuevoSponsor.nombre, email: `sponsor_${Date.now()}@sistema.com`, telefono: nuevoSponsor.telefono, rol: 'sponsor', activa: true, datos_flexibles: { link: nuevoSponsor.link, cuota_mensual: Number(nuevoSponsor.cuota_mensual), logo_url: logoFinal, etiquetas: ["sponsor"], mostrar_app: true } }
        const { error } = await supabase.from('usuarios').insert(payload)
        if (error) throw error
        toast.success("¡Patrocinador agregado!")
      }
      setModalAbierto(false)
      cargarSponsorsYPagos()
    } catch (error: any) { toast.error(error.message) } finally { setGuardando(false) }
  }

  const generarNroReciboSponsor = async () => {
    const { data } = await supabase
      .from('pagos')
      .select('nro_recibo')
      .ilike('nro_recibo', 'SPON-%')

    if (!data || data.length === 0) {
      return `SPON-00001`
    }

    let maxNum = 0
    data.forEach(p => {
      const partes = p.nro_recibo.split('SPON-')
      if (partes.length > 1) { 
        const num = parseInt(partes[1], 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      }
    })

    const siguienteNum = maxNum + 1
    return `SPON-${String(siguienteNum).padStart(5, '0')}`
  }

  const handleRegistrarCobro = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const nroReciboCorrelativo = await generarNroReciboSponsor()
      
      // 1. Insertamos en el historial contable de recibos emitidos
      const { error: errorPago } = await supabase.from('pagos').insert({
        alumno_id: modalCobro.id, 
        nro_recibo: nroReciboCorrelativo,
        concepto_categoria: 'SPONSOR',
        concepto_detalle: modalCobro.concepto || 'Patrocinio Publicitario', 
        monto: Number(modalCobro.monto_a_cobrar),
        beneficiario: modalCobro.nombre,
        estado: 'aprobado',
        fecha: new Date().toISOString()
      })
      if (errorPago) throw errorPago

      // 2. SUMA EN FINANZAS
      const { error: errorCaja } = await supabase.from('movimientos_caja').insert({
        tipo: 'ingreso',
        monto: Number(modalCobro.monto_a_cobrar),
        descripcion: `Patrocinio: ${modalCobro.nombre} - ${modalCobro.concepto || 'Publicidad'} (Recibo ${nroReciboCorrelativo})`,
        metodo: 'Transferencia',
        fecha: new Date().toISOString()
      })
      if (errorCaja) throw errorCaja
      
      toast.success(`¡Cobro registrado e impactado en Finanzas! Recibo: ${nroReciboCorrelativo}`)
      setModalCobro(null)
      cargarSponsorsYPagos()
    } catch (error: any) {
      toast.error("Error al registrar el cobro en el flujo financiero.")
    } finally {
      setGuardando(false)
    }
  }

  const toggleVisibilidadSponsor = async (sponsor: any) => {
    try {
      const flex = typeof sponsor.datos_flexibles === 'string' ? JSON.parse(sponsor.datos_flexibles) : (sponsor.datos_flexibles || {})
      const nuevoEstado = !flex.mostrar_app
      const { error } = await supabase.from('usuarios').update({ datos_flexibles: { ...flex, mostrar_app: nuevoEstado } }).eq('id', sponsor.id)
      if (error) throw error
      toast.success(nuevoEstado ? "Publicidad Activada" : "Publicidad Ocultada")
      cargarSponsorsYPagos()
    } catch (error) { toast.error("Error de visibilidad.") }
  }

  const handleEliminarSponsor = (id: string) => {
    toast("¿Archivar a este sponsor?", {
      action: {
        label: "Sí, Archivar",
        onClick: async () => {
          await supabase.from('usuarios').update({ activa: false }).eq('id', id)
          toast.success("Patrocinador archivado.")
          cargarSponsorsYPagos()
        }
      }
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-slate-900" /> Patrocinadores
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Gestión de marcas publicitarias e ingresos recurrentes del club.</p>
        </div>
        <Button onClick={abrirModalNuevo} className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-md rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Patrocinador
        </Button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestañaActiva('directorio')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestañaActiva === 'directorio' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Marcas Activas ({sponsors.length})</button>
        <button onClick={() => setPestañaActiva('historial')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestañaActiva === 'historial' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Historial de Cobros</button>
      </div>

      {cargando ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-900" /></div>
      ) : (
        <>
          {pestañaActiva === 'directorio' && (
            <SponsorsTable sponsors={sponsors} historialPagos={historialPagos} mesActual={mesActual} anioActual={anioActual} toggleVisibilidadSponsor={toggleVisibilidadSponsor} setModalCobro={setModalCobro} abrirModalEditar={abrirModalEditar} handleEliminarSponsor={handleEliminarSponsor} />
          )}
          {pestañaActiva === 'historial' && (
            <HistorialCobros historialPagos={historialPagos} setReciboVisualizado={setReciboVisualizado} />
          )}
        </>
      )}

      <ModalSponsor modalAbierto={modalAbierto} setModalAbierto={setModalAbierto} sponsorEditando={sponsorEditando} nuevoSponsor={nuevoSponsor} setNuevoSponsor={setNuevoSponsor} archivoLogo={archivoLogo} setArchivoLogo={setArchivoLogo} handleGuardarSponsor={handleGuardarSponsor} guardando={guardando} />
      <ModalCobro modalCobro={modalCobro} setModalCobro={setModalCobro} handleRegistrarCobro={handleRegistrarCobro} guardando={guardando} />

      {reciboVisualizado && (
        <VisorReciboPDF recibo={reciboVisualizado} academia={academiaOficial} onClose={() => setReciboVisualizado(null)} />
      )}
    </div>
  )
}