"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Settings, CreditCard, Building2, Megaphone, Loader2, Sparkles, Calendar, DollarSign, Users, MonitorSmartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import TabInstitucional from "./tabs/TabInstitucional"
import TabCartelera from "./tabs/TabCartelera"
import TabTarifas from "./tabs/TabTarifas"
import TabEventosEspeciales from "./tabs/TabEventosEspeciales"
import TabVidriera from "./tabs/TabVidriera"

const BUCKET_CARTELERA = 'cartelera';
const BUCKET_EVENTOS = 'eventos';

export default function ConfiguracionAdminPage() {
  const supabase = createClient()
  
  const [modeloNegocio, setModeloNegocio] = useState<string>("mensual") 
  const esMensual = modeloNegocio === "mensual"

  const [pestañaActiva, setPestañaActiva] = useState<'institucional' | 'cartelera' | 'tarifas' | 'eventos' | 'vidriera'>('institucional')
  const [academiaId, setAcademiaId] = useState<string | null>(null)
  const [origenWeb, setOrigenWeb] = useState("")
  
  const [infoAcademia, setInfoAcademia] = useState({
    nombre_largo: "", nombre_corto: "", siglas: "", slug: "", admin_nombre: "", logo_url: "", firma_url: "", eventos_cartelera: [] as any[],
    telefono: "",
    titulo_login: "", descripcion_login: "", imagen_login: "",
    titulo_registro: "", descripcion_registro: "", imagen_registro: ""
  })
  
  const [cargandoInfo, setCargandoInfo] = useState(true)
  const [guardandoTextos, setGuardandoTextos] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [subiendoFirma, setSubiendoFirma] = useState(false)

  const [nuevoEvento, setNuevoEvento] = useState({ titulo: "", descripcion: "" })
  const [archivoEvento, setArchivoEvento] = useState<File | null>(null)
  const [publicandoEvento, setPublicandoEvento] = useState(false)
  const [borrandoEventoId, setBorrandoEventoId] = useState<string | null>(null)
  const [archivoEventoEspecial, setArchivoEventoEspecial] = useState<File | null>(null);
  
  const [tarifas, setTarifas] = useState<any[]>([])
  const [guardandoTarifa, setGuardandoTarifa] = useState(false)
  const [modalTarifa, setModalTarifa] = useState(false)
  const [tarifaEditando, setTarifaEditando] = useState<any>(null)

  const [eventosProgramados, setEventosProgramados] = useState<any[]>([])
  const [modalNuevoEventoEspecial, setModalNuevoEventoEspecial] = useState(false)
  const [guardandoEventoEspecial, setGuardandoEventoEspecial] = useState(false)
  const [datosEventoEspecial, setDatosEventoEspecial] = useState({
    titulo: "", descripcion_evento: "", fecha: "", hora_inicio: "", precio: "", cupo_maximo: "30"
  })

  const cargarConfiguracionYEventos = async () => {
    try {
      const { data, error } = await supabase.from('academias').select('*').limit(1).single()
      if (data) {
        setAcademiaId(data.id)
        if (data.modelo_negocio) setModeloNegocio(data.modelo_negocio)
        
        setInfoAcademia({
          nombre_largo: data.nombre || "", 
          nombre_corto: data.nombre_corto || data.nombre || "", 
          siglas: data.siglas || "", 
          slug: data.slug || "", 
          admin_nombre: data.admin_nombre || "Administración", 
          logo_url: data.logo_url || "", 
          firma_url: data.firma_url || "", 
          eventos_cartelera: data.eventos_cartelera || [],
          telefono: data.telefono || "",
          titulo_login: data.titulo_login || "",
          descripcion_login: data.descripcion_login || "",
          imagen_login: data.imagen_login || "",
          titulo_registro: data.titulo_registro || "",        
          descripcion_registro: data.descripcion_registro || "", 
          imagen_registro: data.imagen_registro || ""
        })

        const [resTarifas, resEventos] = await Promise.all([
          supabase.from('tarifas').select('*').eq('academia_id', data.id).order('precio', { ascending: true }),
          supabase.from('clases_programadas').select('*').eq('es_evento', true).order('fecha', { ascending: true })
        ])

        if (resTarifas.data) setTarifas(resTarifas.data)
        if (resEventos.data) setEventosProgramados(resEventos.data)
      }
    } catch (error) {
      console.error("Error al cargar la configuración.")
    } finally {
      setCargandoInfo(false)
    }
  }

  useEffect(() => {
    setOrigenWeb(window.location.origin)
    cargarConfiguracionYEventos()
  }, [supabase])

  const handleSubirImagen = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo' | 'firma') => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !academiaId) return
      if (tipo === 'logo') setSubiendoLogo(true); else setSubiendoFirma(true)
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
      const slugLimpio = infoAcademia.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      
      const { error } = await supabase.from('academias').update({
        nombre: infoAcademia.nombre_largo, 
        nombre_corto: infoAcademia.nombre_corto, 
        siglas: infoAcademia.siglas, 
        slug: slugLimpio, 
        admin_nombre: infoAcademia.admin_nombre,
        telefono: infoAcademia.telefono 
      }).eq('id', academiaId)
      
      if (error) {
        if (error.code === '23505') throw new Error("Ese Identificador de Link ya está en uso por otra academia.")
        throw error
      }
      setInfoAcademia(prev => ({...prev, slug: slugLimpio}))
      toast.success("Configuración institucional guardada con éxito.")
    } catch (error: any) {
      toast.error(error.message || "Error al guardar textos.")
    } finally {
      setGuardandoTextos(false)
    }
  }

  const copiarLinkRegistro = () => {
    if (!infoAcademia.slug) { toast.error("Primero tenés que guardar un identificador de link."); return }
    const link = `${origenWeb}/registro?club=${infoAcademia.slug}`
    navigator.clipboard.writeText(link)
    toast.success("¡Link de registro copiado al portapapeles!")
  }

  const copiarLinkLogin = () => {
    if (!infoAcademia.slug) { toast.error("Falta identificador de link."); return }
    const link = `${origenWeb}/login?club=${infoAcademia.slug}`
    navigator.clipboard.writeText(link)
    toast.success("¡Link de login copiado al portapapeles!")
  }

  const handlePublicarEvento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || !nuevoEvento.titulo) return
    setPublicandoEvento(true)
    try {
      let imagenUrl = ""
      if (archivoEvento) {
        const filePath = `avisos/${academiaId}/${Date.now()}-${archivoEvento.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const { error: uploadError } = await supabase.storage.from(BUCKET_CARTELERA).upload(filePath, archivoEvento)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from(BUCKET_CARTELERA).getPublicUrl(filePath)
        imagenUrl = data.publicUrl
      }
      const eventoFinal = { id: `ev-${Date.now()}`, titulo: nuevoEvento.titulo, descripcion: nuevoEvento.descripcion, imagen_url: imagenUrl, fecha: new Date().toISOString() }
      const nuevaLista = [eventoFinal, ...(infoAcademia.eventos_cartelera || [])]
      await supabase.from('academias').update({ eventos_cartelera: nuevaLista }).eq('id', academiaId)
      setInfoAcademia(prev => ({ ...prev, eventos_cartelera: nuevaLista }))
      setNuevoEvento({ titulo: "", descripcion: "" })
      setArchivoEvento(null)
      toast.success("Aviso publicado.")
    } catch (error) { toast.error("Error.") } finally { setPublicandoEvento(false) }
  }

  const handleBorrarEvento = (idAviso: string, urlImagen: string) => {
    if (!academiaId) return
    toast("¿Eliminar este aviso de la cartelera?", {
      action: {
        label: "Sí, Eliminar",
        onClick: async () => {
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
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

  const abrirModalNueva = () => { setTarifaEditando({ id: null, nombre: "", precio: "", tipo: esMensual ? "mensual" : "creditos", creditos: "" }); setModalTarifa(true) }
  const abrirModalEditar = (tarifa: any) => { setTarifaEditando({ ...tarifa }); setModalTarifa(true) }
  
  const guardarTarifa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId) return
    setGuardandoTarifa(true)
    try {
      if (tarifaEditando.id) {
        const { error } = await supabase.from('tarifas').update({ nombre: tarifaEditando.nombre, precio: Number(tarifaEditando.precio), creditos: tarifaEditando.creditos ? Number(tarifaEditando.creditos) : null }).eq('id', tarifaEditando.id)
        if (error) throw error
        setTarifas(tarifas.map(t => t.id === tarifaEditando.id ? { ...t, ...tarifaEditando, precio: Number(tarifaEditando.precio) } : t))
        toast.success("Tarifa actualizada.")
      } else {
        const { data, error } = await supabase.from('tarifas').insert({ academia_id: academiaId, nombre: tarifaEditando.nombre, precio: Number(tarifaEditando.precio), tipo: esMensual ? 'mensual' : 'creditos', creditos: esMensual ? null : Number(tarifaEditando.creditos) }).select().single()
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
  
  const borrarTarifa = () => {
    if (!tarifaEditando?.id) return
    toast("¿Eliminar definitivamente esta tarifa?", {
      action: {
        label: "Sí, Eliminar",
        onClick: async () => {
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
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

  const handleCrearEventoEspecial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId) return
    setGuardandoEventoEspecial(true)
    try {
      let imagenUrl = "";
      if (archivoEventoEspecial) {
        const fileName = `${Date.now()}-${Math.random()}.png`;
        const filePath = `eventos/${academiaId}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET_EVENTOS).upload(filePath, archivoEventoEspecial);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(BUCKET_EVENTOS).getPublicUrl(filePath);
        imagenUrl = data.publicUrl;
      }

      await supabase.from('clases_programadas').insert({
        academia_id: academiaId,
        titulo: datosEventoEspecial.titulo,
        descripcion_evento: datosEventoEspecial.descripcion_evento,
        fecha: datosEventoEspecial.fecha,
        hora_inicio: datosEventoEspecial.hora_inicio + ":00",
        precio: Number(datosEventoEspecial.precio),
        cupo_maximo: Number(datosEventoEspecial.cupo_maximo),
        es_evento: true,
        costo_creditos: 0,
        imagen_url: imagenUrl
      })

      toast.success("Evento publicado.")
      setDatosEventoEspecial({ titulo: "", descripcion_evento: "", fecha: "", hora_inicio: "", precio: "", cupo_maximo: "30" })
      setArchivoEventoEspecial(null)
      cargarConfiguracionYEventos()
    } catch (error: any) { toast.error(error.message) } finally { setGuardandoEventoEspecial(false) }
  } 

  const handleBorrarEventoEspecial = (id: string) => {
    toast("¿Eliminar definitivamente este evento especial?", {
      description: "Se quitará de la grilla operativa y del visor de las alumnas.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          const { error } = await supabase.from('clases_programadas').delete().eq('id', id)
          if (error) toast.error("No se pudo eliminar.")
          else {
            toast.success("Evento eliminado.")
            cargarConfiguracionYEventos()
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} } 
    })
  }

  if (cargandoInfo) return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-5xl mx-auto">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" /> Configuración Global
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Gestión de identidad, tarifas y eventos de la academia.</p>
        </div>
      </div>

      {/* BOTONES DE PESTAÑAS */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestañaActiva('institucional')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'institucional' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Building2 className="h-4 w-4" /> Institucional
        </button>
        <button onClick={() => setPestañaActiva('vidriera')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'vidriera' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}>
          <MonitorSmartphone className="h-4 w-4" /> Diseño Vidriera
        </button>
        <button onClick={() => setPestañaActiva('cartelera')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'cartelera' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Megaphone className="h-4 w-4" /> Cartelera Digital
        </button>
        <button onClick={() => setPestañaActiva('eventos')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'eventos' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Sparkles className="h-4 w-4" /> Eventos Especiales
        </button>
        <button onClick={() => setPestañaActiva('tarifas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'tarifas' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}>
          <CreditCard className="h-4 w-4" /> Tarifas
        </button>
      </div>

      {/* RENDER DE COMPONENTES POR PESTAÑA */}
      <div className="pt-2">
        {pestañaActiva === 'institucional' && (
          <TabInstitucional 
            infoAcademia={infoAcademia} setInfoAcademia={setInfoAcademia}
            guardandoTextos={guardandoTextos} handleGuardarTextosInstitucionales={handleGuardarTextosInstitucionales}
            subiendoLogo={subiendoLogo} subiendoFirma={subiendoFirma}
            handleSubirImagen={handleSubirImagen} copiarLinkRegistro={copiarLinkRegistro} copiarLinkLogin={copiarLinkLogin} origenWeb={origenWeb}
          />
        )}

        {pestañaActiva === 'cartelera' && (
          <TabCartelera 
            nuevoEvento={nuevoEvento} setNuevoEvento={setNuevoEvento}
            archivoEvento={archivoEvento} setArchivoEvento={setArchivoEvento}
            handlePublicarEvento={handlePublicarEvento} publicandoEvento={publicandoEvento}
            infoAcademia={infoAcademia} handleBorrarEvento={handleBorrarEvento} borrandoEventoId={borrandoEventoId}
          />
        )}

        {pestañaActiva === 'eventos' && (
          <TabEventosEspeciales 
            eventosProgramados={eventosProgramados}
            setModalNuevoEventoEspecial={setModalNuevoEventoEspecial}
            handleBorrarEventoEspecial={handleBorrarEventoEspecial}
            datosEventoEspecial={datosEventoEspecial}
            setDatosEventoEspecial={setDatosEventoEspecial}
            archivoEventoEspecial={archivoEventoEspecial}   
            setArchivoEventoEspecial={setArchivoEventoEspecial} 
            handleCrearEventoEspecial={handleCrearEventoEspecial} 
            guardandoEventoEspecial={guardandoEventoEspecial}   
          />
        )}

        
        {pestañaActiva === 'vidriera' && (
          <TabVidriera 
            infoAcademia={infoAcademia} setInfoAcademia={setInfoAcademia} 
            academiaId={academiaId} recargarDatos={cargarConfiguracionYEventos} 
          />
        )}

        {pestañaActiva === 'tarifas' && (
          <TabTarifas 
            tarifas={tarifas} esMensual={esMensual}
            abrirModalNueva={abrirModalNueva} abrirModalEditar={abrirModalEditar}
            modalTarifa={modalTarifa} setModalTarifa={setModalTarifa}
            tarifaEditando={tarifaEditando} setTarifaEditando={setTarifaEditando}
            guardarTarifa={guardarTarifa} borrarTarifa={borrarTarifa} guardandoTarifa={guardandoTarifa}
          />
        )}
      </div>

      {/* MODAL NUEVO EVENTO OPERATIVO */}
      {modalNuevoEventoEspecial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b bg-slate-50">
              <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Crear Evento Comercial
              </h3>
            </div>
            <form onSubmit={handleCrearEventoEspecial} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Título del Evento / Muestra</label>
                <input required value={datosEventoEspecial.titulo} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, titulo: e.target.value})} placeholder="Muestra de fin de año 2026" className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900 font-medium" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Descripción para Alumnas</label>
                <textarea value={datosEventoEspecial.descripcion_evento} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, descripcion_evento: e.target.value})} placeholder="Detalles de entradas, ubicación, etc..." className="w-full border rounded-xl p-3 h-20 outline-none focus:border-slate-900 font-medium resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Fecha</label>
                  <input required type="date" value={datosEventoEspecial.fecha} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, fecha: e.target.value})} className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Hora de Inicio</label>
                  <input required type="time" value={datosEventoEspecial.hora_inicio} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, hora_inicio: e.target.value})} className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Precio Entrada ($)</label>
                  <input required type="number" value={datosEventoEspecial.precio} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, precio: e.target.value})} placeholder="2500" className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900 font-bold text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><Users className="h-3 w-3" /> Cupo Máximo</label>
                  <input required type="number" value={datosEventoEspecial.cupo_maximo} onChange={e => setDatosEventoEspecial({...datosEventoEspecial, cupo_maximo: e.target.value})} className="w-full border rounded-xl h-11 px-3 outline-none focus:border-slate-900 font-bold" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="ghost" onClick={() => setModalNuevoEventoEspecial(false)} className="flex-1 font-bold">Cancelar</Button>
                <Button type="submit" disabled={guardandoEventoEspecial} className="flex-1 bg-slate-900 hover:bg-slate-800 font-bold text-white">
                  {guardandoEventoEspecial ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publicar Evento"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}