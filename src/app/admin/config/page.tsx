"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { 
  Settings, CreditCard, Clock, Plus, Pencil, Trash2, Save, X, 
  AlertCircle, Building2, UploadCloud, Loader2, Image as ImageIcon, 
  Megaphone, CalendarDays 
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ConfiguracionAdminPage() {
  const supabase = createClient()
  const modeloNegocio = "mensual" 
  const esMensual = modeloNegocio === "mensual"

  const [pestaña, setPestaña] = useState<'institucional' | 'cartelera' | 'tarifas' | 'reglas'>('institucional')
  const [academiaId, setAcademiaId] = useState<string | null>(null)
  
  const [infoAcademia, setInfoAcademia] = useState({
    nombre_largo: "",
    nombre_corto: "",
    siglas: "",
    admin_nombre: "",
    logo_url: "",
    firma_url: "",
    eventos_cartelera: [] as any[]
  })
  
  const [cargandoInfo, setCargandoInfo] = useState(true)
  const [guardandoTextos, setGuardandoTextos] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [subiendoFirma, setSubiendoFirma] = useState(false)

  const [nuevoEvento, setNuevoEvento] = useState({ titulo: "", descripcion: "" })
  const [archivoEvento, setArchivoEvento] = useState<File | null>(null)
  const [publicandoEvento, setPublicandoEvento] = useState(false)
  const [borrandoEventoId, setBorrandoEventoId] = useState<string | null>(null)

  // NUEVO ESTADO DE TARIFAS (Vacío al inicio)
  const [tarifas, setTarifas] = useState<any[]>([])
  const [reglas, setReglas] = useState({ horasCancelacion: 5, pideAptoFisico: true })
  
  const [modalTarifa, setModalTarifa] = useState(false)
  const [tarifaEditando, setTarifaEditando] = useState<any>(null)
  const [guardandoTarifa, setGuardandoTarifa] = useState(false)

  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const { data, error } = await supabase.from('academias').select('*').limit(1).single()
        
        if (data) {
          setAcademiaId(data.id)
          setInfoAcademia({
            nombre_largo: data.nombre || "",
            nombre_corto: data.nombre_corto || data.nombre || "",
            siglas: data.siglas || "",
            admin_nombre: data.admin_nombre || "Administración",
            logo_url: data.logo_url || "",
            firma_url: data.firma_url || "",
            eventos_cartelera: data.eventos_cartelera || []
          })

          // CARGAR TARIFAS DESDE SUPABASE
          const { data: dataTarifas } = await supabase.from('tarifas').select('*').eq('academia_id', data.id).order('precio', { ascending: true })
          if (dataTarifas) setTarifas(dataTarifas)
        }
      } catch (error) {
        console.error("Error al cargar la configuración.")
      } finally {
        setCargandoInfo(false)
      }
    }
    cargarConfiguracion()
  }, [supabase])

  const handleSubirImagen = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo' | 'firma') => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !academiaId) return
      
      if (tipo === 'logo') setSubiendoLogo(true)
      else setSubiendoFirma(true)

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${tipo}_oficial_${Date.now()}.${fileExt}`
      const filePath = `institucional/${academiaId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const campoAActualizar = tipo === 'logo' ? { logo_url: publicUrl } : { firma_url: publicUrl }
      const { error: updateError } = await supabase.from('academias').update(campoAActualizar).eq('id', academiaId)
      if (updateError) throw updateError

      setInfoAcademia(prev => ({ ...prev, ...campoAActualizar }))
      toast.success(`Imagen de ${tipo} actualizada.`)

    } catch (error: any) {
      toast.error("Error al subir el archivo.")
    } finally {
      setSubiendoLogo(false); setSubiendoFirma(false);
    }
  }

  const handleGuardarTextosInstitucionales = async () => {
    if (!academiaId) return
    setGuardandoTextos(true)
    try {
      const { error } = await supabase.from('academias').update({
        nombre: infoAcademia.nombre_largo,
        nombre_corto: infoAcademia.nombre_corto,
        siglas: infoAcademia.siglas,
        admin_nombre: infoAcademia.admin_nombre,
      }).eq('id', academiaId)

      if (error) throw error
      toast.success("Textos institucionales guardados con éxito.")
    } catch (error: any) {
      toast.error("Error al guardar textos.")
    } finally {
      setGuardandoTextos(false)
    }
  }

  const handlePublicarEvento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || !nuevoEvento.titulo) return
    
    setPublicandoEvento(true)
    try {
      let imagenUrl = ""
      
      if (archivoEvento) {
        const fileExt = archivoEvento.name.split('.').pop()
        const nombreLimpio = archivoEvento.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `institucional/${academiaId}/avisos/${Date.now()}-${nombreLimpio}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, archivoEvento)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        imagenUrl = data.publicUrl
      }

      const eventoFinal = {
        id: `ev-${Date.now()}`,
        titulo: nuevoEvento.titulo,
        descripcion: nuevoEvento.descripcion,
        imagen_url: imagenUrl,
        fecha: new Date().toISOString()
      }

      const nuevaLista = [eventoFinal, ...(infoAcademia.eventos_cartelera || [])]
      const { error: updateError } = await supabase.from('academias').update({ eventos_cartelera: nuevaLista }).eq('id', academiaId)
      if (updateError) throw updateError

      setInfoAcademia(prev => ({ ...prev, eventos_cartelera: nuevaLista }))
      setNuevoEvento({ titulo: "", descripcion: "" })
      setArchivoEvento(null)
      toast.success("¡Evento publicado!")

    } catch (error: any) {
      toast.error("Error al publicar evento.")
    } finally {
      setPublicandoEvento(false)
    }
  }

  const handleBorrarEvento = async (idAviso: string, urlImagen: string) => {
    if (!academiaId) return
    if (!confirm("¿Eliminar este aviso de la cartelera?")) return
    
    setBorrandoEventoId(idAviso)
    try {
      if (urlImagen) {
        const filePath = urlImagen.split('/avatars/')[1]
        if (filePath) await supabase.storage.from('avatars').remove([filePath])
      }

      const nuevaLista = (infoAcademia.eventos_cartelera || []).filter((ev: any) => ev.id !== idAviso)
      const { error } = await supabase.from('academias').update({ eventos_cartelera: nuevaLista }).eq('id', academiaId)
      if (error) throw error

      setInfoAcademia(prev => ({ ...prev, eventos_cartelera: nuevaLista }))
      toast.success("Aviso eliminado.")
    } catch (error: any) {
      toast.error("Error al borrar aviso.")
    } finally {
      setBorrandoEventoId(null)
    }
  }

  // --- LÓGICA DE TARIFAS CONECTADA A SUPABASE ---
  const abrirModalNueva = () => { 
    setTarifaEditando({ id: null, nombre: "", precio: "", tipo: esMensual ? "mensual" : "creditos", creditos: "" })
    setModalTarifa(true) 
  }
  
  const abrirModalEditar = (tarifa: any) => { 
    setTarifaEditando({ ...tarifa })
    setModalTarifa(true) 
  }

  const guardarTarifa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId) return
    setGuardandoTarifa(true)

    try {
      if (tarifaEditando.id) {
        // ACTUALIZAR TARIFA EXISTENTE
        const { error } = await supabase.from('tarifas').update({
          nombre: tarifaEditando.nombre,
          precio: Number(tarifaEditando.precio),
          creditos: tarifaEditando.creditos ? Number(tarifaEditando.creditos) : null
        }).eq('id', tarifaEditando.id)
        
        if (error) throw error
        setTarifas(tarifas.map(t => t.id === tarifaEditando.id ? { ...t, ...tarifaEditando, precio: Number(tarifaEditando.precio) } : t))
        toast.success("Tarifa actualizada.")
      } else {
        // CREAR NUEVA TARIFA
        const { data, error } = await supabase.from('tarifas').insert({
          academia_id: academiaId,
          nombre: tarifaEditando.nombre,
          precio: Number(tarifaEditando.precio),
          tipo: esMensual ? 'mensual' : 'creditos',
          creditos: esMensual ? null : Number(tarifaEditando.creditos)
        }).select().single()
        
        if (error) throw error
        if (data) setTarifas([...tarifas, data])
        toast.success("Nueva tarifa creada.")
      }
      setModalTarifa(false)
    } catch (error: any) {
      toast.error("Error al guardar tarifa.")
    } finally {
      setGuardandoTarifa(false)
    }
  }

  const borrarTarifa = async () => {
    if (!tarifaEditando?.id) return
    if (!confirm("¿Eliminar definitivamente esta tarifa?")) return
    
    setGuardandoTarifa(true)
    try {
      const { error } = await supabase.from('tarifas').delete().eq('id', tarifaEditando.id)
      if (error) throw error
      
      setTarifas(tarifas.filter(t => t.id !== tarifaEditando.id))
      toast.success("Tarifa eliminada.")
      setModalTarifa(false)
    } catch (error: any) {
      toast.error("Error al eliminar tarifa.")
    } finally {
      setGuardandoTarifa(false)
    }
  }

  if (cargandoInfo) return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-5xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" /> Configuración Global
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Gestión de identidad, tarifas y reglas operativas del sistema.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestaña('institucional')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'institucional' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Building2 className="h-4 w-4" /> Institucional
        </button>
        <button onClick={() => setPestaña('cartelera')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'cartelera' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Megaphone className="h-4 w-4" /> Cartelera Digital
        </button>
        <button onClick={() => setPestaña('tarifas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'tarifas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <CreditCard className="h-4 w-4" /> Tarifas
        </button>
        <button onClick={() => setPestaña('reglas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'reglas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <AlertCircle className="h-4 w-4" /> Reglas Operativas
        </button>
      </div>

      <div className="pt-2">

        {/* PESTAÑA INSTITUCIONAL */}
        {pestaña === 'institucional' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card flex flex-col">
              <div className="px-6 py-5 border-b border-border bg-secondary/10 flex justify-between items-center">
                <h2 className="font-black text-foreground uppercase tracking-tight">Identidad y Recibos PDF</h2>
                <Button onClick={handleGuardarTextosInstitucionales} disabled={guardandoTextos} size="sm" className="font-bold uppercase tracking-widest text-xs">
                  {guardandoTextos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar Textos
                </Button>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Legal Completo</label>
                      <input type="text" value={infoAcademia.nombre_largo} onChange={e => setInfoAcademia({...infoAcademia, nombre_largo: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Corto (PDF)</label>
                        <input type="text" value={infoAcademia.nombre_corto} onChange={e => setInfoAcademia({...infoAcademia, nombre_corto: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Siglas (Ej: APP)</label>
                        <input type="text" value={infoAcademia.siglas} onChange={e => setInfoAcademia({...infoAcademia, siglas: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Firma a nombre de:</label>
                      <input type="text" value={infoAcademia.admin_nombre} onChange={e => setInfoAcademia({...infoAcademia, admin_nombre: e.target.value})} placeholder="Ej: Lic. Florencia Admin" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
                    </div>
                  </div>

                  <div className="space-y-6 md:border-l md:border-border md:pl-8">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Logo Oficial</label>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/20 shrink-0">
                          {subiendoLogo ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : infoAcademia.logo_url ? <img src={infoAcademia.logo_url} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground opacity-30" />}
                        </div>
                        <div>
                          <input type="file" id="upload-logo" className="hidden" accept="image/*" onChange={(e) => handleSubirImagen(e, 'logo')} />
                          <Button variant="outline" size="sm" disabled={subiendoLogo} onClick={() => document.getElementById('upload-logo')?.click()} className="font-bold text-xs h-8">
                            <UploadCloud className="h-3 w-3 mr-2" /> Cambiar Logo
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border border-dashed">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Firma del Recibo</label>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/20 shrink-0 p-1">
                          {subiendoFirma ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : infoAcademia.firma_url ? <img src={infoAcademia.firma_url} className="h-full w-full object-contain mix-blend-multiply" /> : <p className="text-[8px] uppercase font-bold text-muted-foreground text-center">Sin Firma</p>}
                        </div>
                        <div>
                          <input type="file" id="upload-firma" className="hidden" accept="image/*" onChange={(e) => handleSubirImagen(e, 'firma')} />
                          <Button variant="outline" size="sm" disabled={subiendoFirma} onClick={() => document.getElementById('upload-firma')?.click()} className="font-bold text-xs h-8">
                            <UploadCloud className="h-3 w-3 mr-2" /> Subir Firma
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PESTAÑA CARTELERA */}
        {pestaña === 'cartelera' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2">
            <div className="space-y-6">
              <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card border-amber-500/30">
                <div className="px-6 py-5 border-b border-border bg-amber-500/10">
                  <h2 className="font-black text-amber-700 dark:text-amber-500 uppercase tracking-tight flex items-center gap-2">
                    <Plus className="h-5 w-5" /> Publicar Nuevo Aviso
                  </h2>
                </div>
                <form onSubmit={handlePublicarEvento} className="p-6 space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título del Aviso</label>
                    <input required type="text" value={nuevoEvento.titulo} onChange={e => setNuevoEvento({...nuevoEvento, titulo: e.target.value})} placeholder="Ej: ¡Torneo de Invierno!" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm font-bold outline-none focus:border-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalles del Evento</label>
                    <textarea value={nuevoEvento.descripcion} onChange={e => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})} placeholder="Escribí fechas, lugares o información importante..." className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:border-amber-500 resize-none min-h-[100px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Flyer / Imagen (Opcional)</label>
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" onClick={() => document.getElementById('upload-aviso-nuevo')?.click()} className="font-bold text-xs h-10 border-dashed">
                        <UploadCloud className="h-4 w-4 mr-2" /> {archivoEvento ? "Cambiar Archivo" : "Seleccionar Imagen"}
                      </Button>
                      <input type="file" id="upload-aviso-nuevo" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) setArchivoEvento(e.target.files[0])
                      }} />
                      {archivoEvento && <span className="text-xs font-bold text-emerald-600">Imagen lista ✓</span>}
                    </div>
                  </div>
                  <Button type="submit" disabled={publicandoEvento || !nuevoEvento.titulo} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest h-12 shadow-md">
                    {publicandoEvento ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publicar en Cartelera"}
                  </Button>
                </form>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Avisos Publicados ({infoAcademia.eventos_cartelera?.length || 0})
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {(!infoAcademia.eventos_cartelera || infoAcademia.eventos_cartelera.length === 0) ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-3xl bg-secondary/10">
                    <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Cartelera Vacía</p>
                  </div>
                ) : (
                  infoAcademia.eventos_cartelera.map((evento: any) => (
                    <Card key={evento.id} className="border-border shadow-sm rounded-2xl overflow-hidden bg-card flex flex-col group transition-all hover:border-primary/30">
                      {evento.imagen_url && (
                        <div className="w-full h-32 bg-secondary/20 border-b border-border overflow-hidden">
                          <img src={evento.imagen_url} alt={evento.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <CardContent className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-black text-foreground text-sm uppercase tracking-tight">{evento.titulo}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{evento.descripcion}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleBorrarEvento(evento.id, evento.imagen_url)} disabled={borrandoEventoId === evento.id} className="h-8 w-8 text-muted-foreground hover:bg-destructive hover:text-white shrink-0 rounded-full">
                            {borrandoEventoId === evento.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-4">
                          Publicado el {new Date(evento.fecha).toLocaleDateString('es-AR')}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA TARIFAS */}
        {pestaña === 'tarifas' && (
          <div className="animate-in slide-in-from-bottom-2">
            <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card">
              <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/10">
                <h2 className="font-black text-foreground uppercase tracking-tight">Catálogo de Pases</h2>
                <Button onClick={abrirModalNueva} size="sm" className="font-bold">
                  <Plus className="h-4 w-4 mr-1" /> Nueva Tarifa
                </Button>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {tarifas.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm italic">Aún no configuraste ninguna tarifa en el sistema.</p>
                      <Button onClick={abrirModalNueva} variant="link" className="mt-2 font-bold text-primary">Crear mi primera tarifa</Button>
                    </div>
                  ) : (
                    tarifas.map(tarifa => (
                      <div key={tarifa.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/5 transition-colors">
                        <div>
                          <h3 className="font-black text-lg uppercase text-foreground">{tarifa.nombre}</h3>
                          <p className="text-xs text-muted-foreground font-medium mt-1">
                            {tarifa.tipo === 'mensual' ? 'Renovación automática cada mes' : `Otorga ${tarifa.creditos} créditos para reservas`}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Precio Final</p>
                            <p className="text-2xl font-black text-emerald-600">${Number(tarifa.precio).toLocaleString('es-AR')}</p>
                          </div>
                          <Button onClick={() => abrirModalEditar(tarifa)} variant="outline" size="icon" className="border-border hover:bg-secondary text-foreground shrink-0">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PESTAÑA REGLAS */}
        {pestaña === 'reglas' && (
          <div className="max-w-2xl animate-in slide-in-from-bottom-2">
            <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card">
              <div className="px-6 py-5 border-b border-border bg-secondary/10">
                <h2 className="font-black text-foreground uppercase tracking-tight">Reglas del Estudio</h2>
              </div>
              <CardContent className="p-6 space-y-6">
                {!esMensual && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Límite de Cancelación</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="number" value={reglas.horasCancelacion} onChange={e => setReglas({...reglas, horasCancelacion: Number(e.target.value)})} className="w-20 bg-background border border-border rounded-xl h-10 px-3 text-center font-bold outline-none focus:border-primary" />
                      <span className="text-sm text-muted-foreground font-medium">horas antes</span>
                    </div>
                    <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">Si cancela con menos tiempo, no se devuelve el crédito.</p>
                  </div>
                )}
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold flex items-center gap-2"><AlertCircle className="h-4 w-4 text-primary" /> Apto Físico Obligatorio</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={reglas.pideAptoFisico} onChange={e => setReglas({...reglas, pideAptoFisico: e.target.checked})} />
                      <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">El sistema le recordará subir su certificado médico anual.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      {/* MODAL EDICIÓN TARIFA */}
      {modalTarifa && tarifaEditando && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-xl rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 flex justify-between items-center border-b border-border bg-secondary/10">
              <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {tarifaEditando.id ? 'Editar Tarifa' : 'Nueva Tarifa'}
              </h3>
              <button onClick={() => setModalTarifa(false)} className="hover:bg-secondary p-1 rounded-full"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={guardarTarifa} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nombre del Pase / Cuota</label>
                <input required placeholder="Ej: Cuota Individual" value={tarifaEditando.nombre} onChange={e => setTarifaEditando({...tarifaEditando, nombre: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Precio en pesos ($)</label>
                <input type="number" required placeholder="Ej: 15000" value={tarifaEditando.precio} onChange={e => setTarifaEditando({...tarifaEditando, precio: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 text-lg font-bold focus:border-primary outline-none" />
              </div>

              {!esMensual && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Créditos</label>
                  <input type="number" required value={tarifaEditando.creditos} onChange={e => setTarifaEditando({...tarifaEditando, creditos: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 font-bold focus:border-primary outline-none" />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                {tarifaEditando.id && (
                  <Button type="button" variant="outline" onClick={borrarTarifa} disabled={guardandoTarifa} className="border-destructive text-destructive hover:bg-destructive hover:text-white px-4 h-12 rounded-xl">
                    {guardandoTarifa ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                  </Button>
                )}
                <Button type="submit" disabled={guardandoTarifa} className="flex-1 font-black uppercase tracking-widest h-12 rounded-xl">
                  {guardandoTarifa ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Tarifa"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}