"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Megaphone, Plus, Loader2, UploadCloud, DollarSign, ExternalLink, Trash2, CheckCircle2, MessageCircle, Receipt, FileText, Eye, EyeOff, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

import VisorReciboPDF from "@/components/admin/VisorReciboPDF"

export default function AdminSponsorsPage() {
  const supabase = createClient()
  
  const [sponsors, setSponsors] = useState<any[]>([])
  const [historialPagos, setHistorialPagos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState<'directorio' | 'historial'>('directorio')
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalCobro, setModalCobro] = useState<any>(null)
  
  const [reciboVisualizado, setReciboVisualizado] = useState<any | null>(null)
  const [academiaOficial, setAcademiaOficial] = useState<any>({
    nombre_largo: "MI ACADEMIA", nombre_corto: "MI ACADEMIA",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=Lume&backgroundColor=ffffff",
    admin_nombre: "Administración", firma_url: ""
  })
  
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
          siglas: resAca.data.siglas || "APP",
          logo_url: resAca.data.logo_url || "https://api.dicebear.com/7.x/shapes/svg?seed=Lume&backgroundColor=ffffff",
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
    setNuevoSponsor({
      nombre: sponsor.nombre || "",
      telefono: sponsor.telefono || "",
      link: flex.link || "",
      cuota_mensual: flex.cuota_mensual?.toString() || "",
      logo_url: flex.logo_url || ""
    })
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
        const payloadFlex = {
          ...sponsorEditando.datos_flexibles,
          link: nuevoSponsor.link,
          cuota_mensual: Number(nuevoSponsor.cuota_mensual),
          logo_url: logoFinal,
        }

        const { error } = await supabase.from('usuarios').update({
          nombre: nuevoSponsor.nombre,
          telefono: nuevoSponsor.telefono,
          datos_flexibles: payloadFlex
        }).eq('id', sponsorEditando.id)
        
        if (error) throw error
        toast.success("¡Patrocinador actualizado con éxito!")

      } else {
        const nuevoId = uuidv4()
        const payload = {
          id: nuevoId,
          nombre: nuevoSponsor.nombre,
          email: `sponsor_${Date.now()}@sistema.com`,
          telefono: nuevoSponsor.telefono,
          rol: 'sponsor',
          activa: true,
          datos_flexibles: {
            link: nuevoSponsor.link,
            cuota_mensual: Number(nuevoSponsor.cuota_mensual),
            logo_url: logoFinal,
            etiquetas: ["sponsor"],
            mostrar_app: true
          }
        }

        const { error } = await supabase.from('usuarios').insert(payload)
        if (error) throw error
        toast.success("¡Patrocinador agregado a la plataforma!")
      }
      
      setModalAbierto(false)
      setSponsorEditando(null)
      setNuevoSponsor({ nombre: "", telefono: "", link: "", cuota_mensual: "", logo_url: "" })
      setArchivoLogo(null)
      cargarSponsorsYPagos()
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleRegistrarCobro = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const nroRecibo = `SPON-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
      
      const { error } = await supabase.from('pagos').insert({
        alumno_id: modalCobro.id, 
        nro_recibo: nroRecibo,
        concepto_categoria: 'SPONSOR',
        concepto_detalle: `Publicidad App - ${modalCobro.nombre}`,
        monto: Number(modalCobro.monto_a_cobrar),
        beneficiario: modalCobro.nombre,
        estado: 'aprobado',
        fecha: new Date().toISOString()
      })
      
      if (error) throw error
      toast.success("¡Ingreso registrado! Ya se sumó a tu Caja.")
      setModalCobro(null)
      cargarSponsorsYPagos()
    } catch (error: any) {
      toast.error("Error al registrar el cobro.")
    } finally {
      setGuardando(false)
    }
  }

  const toggleVisibilidadSponsor = async (sponsor: any) => {
    try {
      const flex = typeof sponsor.datos_flexibles === 'string' ? JSON.parse(sponsor.datos_flexibles) : (sponsor.datos_flexibles || {})
      const nuevoEstado = !flex.mostrar_app
      const payloadFlex = { ...flex, mostrar_app: nuevoEstado }
      const { error } = await supabase.from('usuarios').update({ datos_flexibles: payloadFlex }).eq('id', sponsor.id)
      if (error) throw error
      
      toast.success(nuevoEstado ? "Publicidad Activada en la App" : "Publicidad Ocultada en la App")
      cargarSponsorsYPagos()
    } catch (error) {
      toast.error("Error al cambiar visibilidad.")
    }
  }

  const handleEliminarSponsor = (id: string) => {
    toast("¿Archivar a este sponsor?", {
      description: "Ya no se mostrará ni generará deuda.",
      action: {
        label: "Sí, Archivar",
        onClick: async () => {
          try {
            const { error } = await supabase.from('usuarios').update({ activa: false }).eq('id', id)
            if (error) throw error
            toast.success("Patrocinador archivado correctamente.")
            cargarSponsorsYPagos()
          } catch (error) {
            toast.error("Error al archivar.")
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-5xl mx-auto">
      {/* HEADER BAR */}
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

      {/* TABS */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestañaActiva('directorio')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'directorio' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
          <Megaphone className="h-4 w-4" /> Marcas Activas ({sponsors.length})
        </button>
        <button onClick={() => setPestañaActiva('historial')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'historial' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
          <Receipt className="h-4 w-4" /> Historial de Cobros
        </button>
      </div>

      {cargando ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-900" /></div>
      ) : (
        <>
          {/* TABLA EJECUTIVA CON BOTONES DE ICONO */}
          {pestañaActiva === 'directorio' && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden overflow-x-auto animate-in slide-in-from-bottom-2">
              {sponsors.length === 0 ? (
                <div className="py-12 text-center border-dashed p-8">
                  <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Aún no hay patrocinadores cargados en la plataforma.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Marca / Patrocinador</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Acuerdo Mensual</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Contacto</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-500">Estado</th>
                      <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">App</th>
                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sponsors.map((sponsor) => {
                      const flex = typeof sponsor.datos_flexibles === 'string' ? JSON.parse(sponsor.datos_flexibles) : (sponsor.datos_flexibles || {})
                      
                      const tienePagoEsteMes = historialPagos.some((p: any) => {
                        const f = new Date(p.fecha)
                        return p.alumno_id === sponsor.id && f.getMonth() === mesActual && f.getFullYear() === anioActual
                      })
                      
                      const telLimpio = sponsor.telefono ? sponsor.telefono.replace(/\D/g, '') : ""
                      const msgWpp = `Hola, te escribimos de administración. Te recordamos que está pendiente el pago del patrocinio de este mes en la app. ¡Avisanos! Gracias.`
                      const seMuestra = flex.mostrar_app !== false

                      return (
                        <tr key={sponsor.id} className={`hover:bg-slate-50/80 transition-colors ${!seMuestra && 'opacity-60 grayscale'}`}>
                          
                          {/* COLUMNA 1: LOGO Y NOMBRE */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-16 rounded-lg border bg-slate-50 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner">
                                {flex.logo_url ? (
                                  <img src={flex.logo_url} alt={sponsor.nombre} className="h-full object-contain mix-blend-multiply" />
                                ) : (
                                  <span className="font-black text-slate-300 text-[10px] uppercase tracking-widest">{sponsor.nombre.substring(0,3)}</span>
                                )}
                              </div>
                              <span className="font-black text-slate-900 uppercase tracking-tight text-sm">{sponsor.nombre}</span>
                            </div>
                          </td>

                          {/* COLUMNA 2: ACUERDO MENSUAL */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 text-sm">${Number(flex.cuota_mensual || 0).toLocaleString('es-AR')}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Por mes</span>
                          </td>

                          {/* COLUMNA 3: TELÉFONO */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {sponsor.telefono ? (
                              <span className="font-medium text-slate-600 text-sm">{sponsor.telefono}</span>
                            ) : (
                              <span className="text-xs italic text-slate-400">Sin Registrar</span>
                            )}
                          </td>

                          {/* COLUMNA 4: ESTADO DE PAGO */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tienePagoEsteMes ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Al día</span>
                            ) : (
                              <span className="bg-red-100 text-red-800 text-[10px] font-black uppercase px-2 py-0.5 rounded inline-flex items-center gap-1 animate-pulse">Pendiente</span>
                            )}
                          </td>

                          {/* COLUMNA 5: VISIBILIDAD (EL OJO INTERACTIVO SOLO ICONO) */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button 
                              onClick={() => toggleVisibilidadSponsor(sponsor)}
                              className={`h-8 w-8 inline-flex items-center justify-center rounded-xl border transition-colors ${seMuestra ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-red-500 hover:bg-slate-50'}`}
                              title={seMuestra ? "Ocultar patrocinador en la app de alumnos" : "Mostrar patrocinador en la app de alumnos"}
                            >
                              {seMuestra ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                          </td>

                          {/* COLUMNA 6: ACCIONES COHESIVAS SOLO ICONO */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Cobrar */}
                              <Button 
                                onClick={() => setModalCobro({ id: sponsor.id, nombre: sponsor.nombre, monto_a_cobrar: flex.cuota_mensual })} 
                                variant="outline"
                                size="icon" 
                                className="h-8 w-8 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors" 
                                disabled={tienePagoEsteMes}
                                title="Registrar Cobro"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                              
                              {/* Avisar WhatsApp */}
                              {telLimpio ? (
                                <a href={`https://wa.me/${telLimpio}?text=${encodeURIComponent(msgWpp)}`} target="_blank" rel="noopener noreferrer" title="Avisar por WhatsApp">
                                  <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl transition-colors">
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                </a>
                              ) : (
                                <Button variant="outline" size="icon" disabled className="h-8 w-8 border-slate-100 text-slate-300 rounded-xl" title="Sin número registrado">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Editar */}
                              <Button 
                                onClick={() => abrirModalEditar(sponsor)} 
                                variant="outline"
                                size="icon" 
                                className="h-8 w-8 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl transition-colors"
                                title="Editar Sponsor"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>

                              {/* Eliminar */}
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleEliminarSponsor(sponsor.id)} 
                                className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors"
                                title="Eliminar Sponsor"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB HISTORIAL */}
          {pestañaActiva === 'historial' && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-in slide-in-from-bottom-2">
              <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">Recibos de Publicidad emitidos</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {historialPagos.length === 0 ? (
                  <p className="p-12 text-center text-slate-500 text-sm italic">No hay registros de cobros a patrocinadores.</p>
                ) : (
                  historialPagos.map((pago) => (
                    <div key={pago.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900 uppercase text-sm">{pago.beneficiario}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(pago.fecha).toLocaleDateString('es-AR')} • Recibo: {pago.nro_recibo}</p>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-3 sm:pt-0">
                        <span className="font-black text-lg text-emerald-600">+ ${Number(pago.monto).toLocaleString('es-AR')}</span>
                        <Button variant="outline" size="sm" onClick={() => setReciboVisualizado(pago)} className="h-8 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs">
                          <FileText className="h-4 w-4 mr-1" /> PDF
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL NUEVO/EDITAR SPONSOR */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b bg-slate-50">
              <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">
                {sponsorEditando ? "Editar Patrocinador" : "Nuevo Patrocinador"}
              </h3>
            </div>
            <form onSubmit={handleGuardarSponsor} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nombre de la Marca</label>
                <input required value={nuevoSponsor.nombre} onChange={e => setNuevoSponsor({...nuevoSponsor, nombre: e.target.value})} className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Teléfono (WhatsApp)</label>
                  <input value={nuevoSponsor.telefono} onChange={e => setNuevoSponsor({...nuevoSponsor, telefono: e.target.value})} className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Cuota Mensual ($)</label>
                  <input required type="number" value={nuevoSponsor.cuota_mensual} onChange={e => setNuevoSponsor({...nuevoSponsor, cuota_mensual: e.target.value})} className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900 font-bold text-emerald-600" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Link / Instagram (Opcional)</label>
                <input value={nuevoSponsor.link} onChange={e => setNuevoSponsor({...nuevoSponsor, link: e.target.value})} placeholder="https://instagram.com/..." className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900" />
              </div>
              <div className="space-y-1 pt-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Logo del Sponsor</label>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => document.getElementById('logo-sponsor')?.click()} className="border-dashed font-bold hover:bg-slate-100">
                    <UploadCloud className="h-4 w-4 mr-2" /> Subir Logo
                  </Button>
                  <input type="file" id="logo-sponsor" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files) setArchivoLogo(e.target.files[0]) }} />
                  {archivoLogo ? (
                    <span className="text-xs font-bold text-emerald-600">Logo listo para guardar ✓</span>
                  ) : sponsorEditando?.logo_url ? (
                    <span className="text-xs font-bold text-slate-500">Ya tiene un logo cargado</span>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="ghost" onClick={() => setModalAbierto(false)} className="flex-1 font-bold">Cancelar</Button>
                <Button type="submit" disabled={guardando} className="flex-1 bg-slate-900 hover:bg-slate-800 font-bold text-white">
                  {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Marca"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR COBRO */}
      {modalCobro && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 border-b bg-emerald-50 text-center">
              <h3 className="font-black text-xl text-emerald-900 uppercase tracking-tight">Ingreso de Publicidad</h3>
              <p className="text-emerald-700 font-medium text-sm mt-1">{modalCobro.nombre}</p>
            </div>
            <form onSubmit={handleRegistrarCobro} className="p-6 space-y-4">
              <div className="space-y-1 text-center">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Monto a Ingresar en Caja</label>
                <input required type="number" value={modalCobro.monto_a_cobrar} onChange={e => setModalCobro({...modalCobro, monto_a_cobrar: e.target.value})} className="w-full border-2 border-emerald-200 rounded-xl h-14 px-3 outline-none focus:border-emerald-500 text-center text-3xl font-black text-slate-900" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setModalCobro(null)} className="flex-1 font-bold">Cancelar</Button>
                <Button type="submit" disabled={guardando} className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
                  {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Pago"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISOR DE RECIBO PDF */}
      {reciboVisualizado && (
        <VisorReciboPDF recibo={reciboVisualizado} academia={academiaOficial} onClose={() => setReciboVisualizado(null)} />
      )}
    </div>
  )
}