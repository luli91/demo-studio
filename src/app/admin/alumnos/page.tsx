"use client"

import { useState, useEffect } from "react"
import { 
  Search, Plus, User, Phone, MapPin, AlertCircle, 
  ArrowLeft, ShieldAlert, CheckCircle2, X, CreditCard, Activity,
  ReceiptText, Banknote, Send, FileText, UploadCloud, Download, Wallet, Users, Camera, Printer, Share2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

// ========================================================
// 🎭 DICCIONARIO SAAS UNIVERSAL
// ========================================================
const DICCIONARIO = {
  mensual: {
    pluralSujeros: "Alumnos",
    singularSujero: "Alumno",
    identificadorPago: "Cuota Mensual",
    estadoActivo: "Membresía Activa"
  },
  reservas: {
    pluralSujeros: "Alumnas",
    singularSujero: "Alumna",
    identificadorPago: "Packs / Créditos",
    estadoActivo: "Créditos Disponibles"
  }
}

export default function AdminAlumnosPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [vistaActiva, setVistaActiva] = useState<'directorio' | 'detalle'>('directorio')
  const [pestañaDetalle, setPestañaDetalle] = useState<'perfil' | 'finanzas' | 'asistencias'>('perfil')
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any | null>(null)
  
  const [filtro, setFiltro] = useState("")
  const [modalPreRegistro, setModalPreRegistro] = useState(false)
  
  // Estado para el Modal de Cobro (Soporta Familias)
  const [modalCobro, setModalCobro] = useState<{abierto: boolean, familia: any[]}>({abierto: false, familia: []})
  const [alumnosAPagar, setAlumnosAPagar] = useState<string[]>([])

  // Estado para el concepto del recibo y el visor de recibos
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<string>("CUOTA")
  const [reciboVisualizado, setReciboVisualizado] = useState<any | null>(null)

  // ⚠️ SIMULADOR DE NEGOCIO: Cambiá entre 'reservas' (Packs) y 'mensual' (Sueldo Fijo)
  const modeloNegocio: string = "mensual" 
  const textos = DICCIONARIO[modeloNegocio as keyof typeof DICCIONARIO]

  // CONFIGURACIÓN DINÁMICA DE LA ACADEMIA (Logo y Firma)
  const academia = {
    nombre_largo: "CLUB SOCIAL CULTURAL DEPORTIVO Y BIBLIOTECA",
    nombre_corto: "C. S. C. D. y B.\nPEDRO LOZANO",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=Lozano&backgroundColor=ffffff", // Reemplazar por URL del logo real
    admin_nombre: "Cynthia L. Medina", // Tu firma
    siglas: "PL",
    fundacion: "1939"
  }

  // BASE DE DATOS SIMULADA
  const [alumnos, setAlumnos] = useState<any[]>([])

  useEffect(() => {
    setIsMounted(true)
    const guardado = localStorage.getItem('lume_admin_alumnos_v8')
    
    if (guardado) {
      setAlumnos(JSON.parse(guardado))
    } else {
      setAlumnos([
        { 
          id: "alu-1", nombre: "Martina", apellido: "Gómez", email: "marti@email.com", telefono: "5491133445566", 
          contacto_urgencia: "11-2222-3333 (Padre)", direccion: "Palermo, CABA",
          creditos: 8, estado_cuota: "al_dia", ultima_asistencia: "2026-06-03", pagos: [],
          entrena: true, grupo_familiar_id: "fam-1", avatar_url: null,
          documentos: [
            { id: 1, nombre: "Apto_Fisico_2026.pdf", fecha: "2026-02-15" }
          ],
          asistencias: [
            { id: 1, fecha: "2026-06-03", nivel: "Pole Sport", horario: "19:00:00" },
            { id: 2, fecha: "2026-05-28", nivel: "Elongación", horario: "20:30:00" }
          ]
        },
        { 
          id: "alu-hijo1", nombre: "Mateo", apellido: "Gómez", email: "marti@email.com", telefono: "5491133445566", 
          contacto_urgencia: "11-2222-3333", direccion: "Palermo, CABA",
          creditos: 0, estado_cuota: "deudor", ultima_asistencia: "Sin registros", pagos: [],
          entrena: true, grupo_familiar_id: "fam-1", avatar_url: null,
          documentos: [], asistencias: []
        },
        { 
          id: "alu-2", nombre: "Sofía", apellido: "Rodríguez", email: "sofi@email.com", telefono: "5491144556677", 
          contacto_urgencia: "", direccion: "Belgrano, CABA",
          creditos: 0, estado_cuota: "deudor", ultima_asistencia: "Sin registros", pagos: [],
          entrena: true, grupo_familiar_id: "fam-2", avatar_url: null,
          documentos: [], asistencias: []
        },
        { 
          id: "alu-padre", nombre: "Carlos", apellido: "Pérez", email: "carlos@email.com", telefono: "54911888888", 
          entrena: false, grupo_familiar_id: "fam-3", pagos: []
        }
      ])
    }
  }, [])

  useEffect(() => {
    if (isMounted && alumnos.length > 0) {
      localStorage.setItem('lume_admin_alumnos_v8', JSON.stringify(alumnos))
      if (alumnoSeleccionado) setAlumnoSeleccionado(alumnos.find(a => a.id === alumnoSeleccionado.id))
    }
  }, [alumnos, isMounted])

  if (!isMounted) return null

  // --- LÓGICA DE REGISTRO Y ARCHIVOS ---
  const preRegistrarAlumno = (nuevo: any) => { 
    setAlumnos([nuevo, ...alumnos]) 
    toast.success("Ficha creada correctamente.")
  }

  const simularSubidaArchivo = () => {
    const nuevoDoc = { id: Date.now(), nombre: `Documento_Adjunto_${Math.floor(Math.random() * 100)}.pdf`, fecha: new Date().toISOString().split('T')[0] }
    setAlumnos(alumnos.map(a => a.id === alumnoSeleccionado.id ? { ...a, documentos: [nuevoDoc, ...(a.documentos || [])] } : a))
    toast.success("Archivo subido al legajo con éxito.")
  }

  // --- SUBIR FOTO MOCK ADMIN ---
  const handleCambiarFotoAdmin = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const fileUrl = URL.createObjectURL(file)
    
    const alumnosActualizados = alumnos.map(a => {
      if (a.id === alumnoSeleccionado.id) {
        return { ...a, avatar_url: fileUrl }
      }
      return a
    })
    
    setAlumnos(alumnosActualizados)
    setAlumnoSeleccionado({ ...alumnoSeleccionado, avatar_url: fileUrl })
    toast.success("Foto de perfil actualizada en el legajo.")
  }

  // --- LÓGICA DE COBRO MULTICUENTA ---
  const abrirModalCobro = () => {
    const familia = alumnos.filter(a => a.grupo_familiar_id === alumnoSeleccionado.grupo_familiar_id && a.entrena === true)
    const listaFamiliar = familia.length > 0 ? familia : [alumnoSeleccionado]
    
    setModalCobro({ abierto: true, familia: listaFamiliar })
    setAlumnosAPagar([alumnoSeleccionado.id])
    setConceptoSeleccionado("CUOTA")
  }

  const toggleCheckAlumno = (id: string) => {
    if (alumnosAPagar.includes(id)) {
      setAlumnosAPagar(alumnosAPagar.filter(a => a !== id))
    } else {
      setAlumnosAPagar([...alumnosAPagar, id])
    }
  }

  const ejecutarCobro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (alumnosAPagar.length === 0) return toast.error("Seleccioná al menos un alumno para cobrarle.")

    const formData = new FormData(e.currentTarget)
    const montoTotal = parseInt(formData.get('monto') as string)
    const observaciones = formData.get('observaciones') as string
    const creditosASumar = modeloNegocio === 'reservas' ? parseInt(formData.get('creditos') as string) : 0
    
    // Nombres exactos de los tildados para el PDF
    const nombresBeneficiarios = alumnos.filter(a => alumnosAPagar.includes(a.id)).map(a => `${a.nombre} ${a.apellido}`).join(" / ")
    const nroReciboAleatorio = String(Math.floor(Math.random() * 99999)).padStart(5, '0') // Simulador de autoincremental
    
    const nuevoPago = { 
        id: Date.now(), 
        monto: montoTotal, 
        concepto_categoria: conceptoSeleccionado, // CUOTA, FICHAJE, etc.
        concepto_detalle: observaciones || conceptoSeleccionado,
        fecha: new Date().toISOString(),
        beneficiario: nombresBeneficiarios,
        nro_recibo: `0001-${nroReciboAleatorio}`,
        metodo: 'Efectivo' 
    }

    setAlumnos(alumnos.map(a => {
      if (alumnosAPagar.includes(a.id)) {
        return { ...a, creditos: a.creditos + creditosASumar, estado_cuota: 'al_dia', pagos: [nuevoPago, ...(a.pagos || [])] }
      }
      return a
    }))

    const cajaGuardada = localStorage.getItem('lume_movimientos')
    const movimientosCaja = cajaGuardada ? JSON.parse(cajaGuardada) : []
    const movimientoFinanzas = {
      id: Date.now(), tipo: 'ingreso', monto: montoTotal,
      descripcion: `Cobro en lote (${alumnosAPagar.length} familiares) - Ref: ${alumnoSeleccionado.apellido}`,
      metodo: 'Transferencia/Efectivo', fecha: new Date().toISOString()
    }
    localStorage.setItem('lume_movimientos', JSON.stringify([movimientoFinanzas, ...movimientosCaja]))

    setModalCobro({abierto: false, familia: []})
    toast.success("¡Cobro familiar registrado con éxito y recibo emitido!")
  }

  const abrirDetalle = (alumno: any) => {
    setAlumnoSeleccionado(alumno)
    setPestañaDetalle('perfil')
    setVistaActiva('detalle')
  }

  const alumnosFiltrados = alumnos.filter(a => 
    a.entrena !== false && (
      `${a.nombre} ${a.apellido}`.toLowerCase().includes(filtro.toLowerCase()) || 
      (a.email && a.email.toLowerCase().includes(filtro.toLowerCase()))
    )
  )

  const formatearFechaCorta = (fechaIso: string) => {
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(fechaIso))
  }

  const manejarCompartir = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Recibo Electrónico',
        text: 'Te envío el comprobante de pago.',
        url: window.location.href
      }).catch(console.error);
    } else {
      toast.info("Compartir no soportado en esta PC. Probá desde el celular.");
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-6xl mx-auto">
      
      {/* ===================================================================================
          VISTA 1: DIRECTORIO DE ALUMNOS
      =================================================================================== */}
      {vistaActiva === 'directorio' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" /> Directorio de {textos.pluralSujeros}
              </h1>
              <p className="text-muted-foreground mt-1 font-medium">Búsqueda rápida y estados de cuenta.</p>
            </div>
            <Button onClick={() => setModalPreRegistro(true)} className="w-full sm:w-auto bg-primary font-bold h-11 rounded-xl shadow-md">
              <Send className="h-4 w-4 mr-2" /> Pre-inscribir
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={`Buscar ${textos.singularSujero.toLowerCase()} por nombre o email...`}
              className="pl-12 h-14 bg-card border-border rounded-2xl shadow-sm text-base font-medium"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-secondary/10 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Listado Activo ({alumnosFiltrados.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {alumnosFiltrados.length === 0 ? (
                <p className="p-12 text-center text-muted-foreground italic text-sm">No se encontraron resultados.</p>
              ) : (
                alumnosFiltrados.map((alumno) => {
                  const estaAlDia = alumno.estado_cuota === 'al_dia'

                  return (
                    <div key={alumno.id} onClick={() => abrirDetalle(alumno)} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        
                        {/* FOTO O INICIALES EN EL DIRECTORIO */}
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors overflow-hidden">
                          {alumno.avatar_url ? (
                            <img src={alumno.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            `${alumno.nombre.charAt(0)}${alumno.apellido.charAt(0)}`
                          )}
                        </div>

                        <div>
                          <p className="font-black text-base uppercase text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            {alumno.nombre} {alumno.apellido}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{alumno.email || "Menor asociado a tutor"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                        {modeloNegocio === 'mensual' ? (
                          <div className="text-left sm:text-right">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Estado de Cuota</p>
                            <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 ${estaAlDia ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${estaAlDia ? 'bg-emerald-500' : 'bg-destructive animate-pulse'}`}></span>
                              {estaAlDia ? 'Al Día' : 'Deuda / Vencido'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-left sm:text-right">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Clases Disponibles</p>
                            <div className="flex items-center justify-start sm:justify-end gap-2">
                              <p className="font-black text-2xl leading-none text-foreground">{alumno.creditos}</p>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Créditos</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* ===================================================================================
          VISTA 2: FICHA DETALLADA (CON 3 PESTAÑAS)
      =================================================================================== */}
      {vistaActiva === 'detalle' && alumnoSeleccionado && (
        <div className="space-y-6 animate-in slide-in-from-right-2">
          <Button variant="outline" onClick={() => setVistaActiva('directorio')} className="bg-card rounded-xl shadow-sm border-border">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Directorio
          </Button>

          <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
            <button onClick={() => setPestañaDetalle('perfil')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestañaDetalle === 'perfil' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              Perfil y Legajo
            </button>
            <button onClick={() => setPestañaDetalle('finanzas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestañaDetalle === 'finanzas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              Estado de Cuenta
            </button>
            <button onClick={() => setPestañaDetalle('asistencias')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestañaDetalle === 'asistencias' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              Historial Asistencias
            </button>
          </div>

          <div className="pt-4">
            
            {/* -------------------------------------------------------------
                PESTAÑA 1: PERFIL Y LEGAJO
            ------------------------------------------------------------- */}
            {pestañaDetalle === 'perfil' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm text-center relative">
                    
                    {/* AVATAR INTERACTIVO ADMIN */}
                    <div className="relative mx-auto w-28 h-28 mb-4 group cursor-pointer">
                      <div className="h-full w-full rounded-full bg-primary text-primary-foreground flex items-center justify-center text-5xl font-black shadow-lg shadow-primary/20 overflow-hidden border-4 border-background">
                        {alumnoSeleccionado.avatar_url ? (
                          <img src={alumnoSeleccionado.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          `${alumnoSeleccionado.nombre.charAt(0)}${alumnoSeleccionado.apellido.charAt(0)}`
                        )}
                      </div>
                      <label htmlFor={`upload-avatar-${alumnoSeleccionado.id}`} className="absolute bottom-0 right-0 bg-secondary text-foreground p-2 rounded-full border-2 border-background shadow-md hover:bg-primary hover:text-white transition-colors cursor-pointer z-10">
                        <Camera className="h-4 w-4" />
                        <input type="file" id={`upload-avatar-${alumnoSeleccionado.id}`} className="hidden" accept="image/*" onChange={handleCambiarFotoAdmin} />
                      </label>
                    </div>

                    <h2 className="text-2xl font-black text-foreground leading-none">{alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}</h2>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2">{alumnoSeleccionado.email}</p>
                    
                    <div className="mt-8 space-y-4 text-left">
                      <div className="flex items-center gap-3 text-sm font-medium">
                        <Phone className="h-4 w-4 text-muted-foreground" /> {alumnoSeleccionado.telefono}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium items-start">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> {alumnoSeleccionado.direccion || "Sin dirección cargada"}
                      </div>
                    </div>

                    <div className={`mt-6 p-4 rounded-2xl border-2 shadow-inner text-left ${alumnoSeleccionado.contacto_urgencia ? 'bg-destructive/5 border-destructive/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${alumnoSeleccionado.contacto_urgencia ? 'text-destructive' : 'text-amber-600'}`}>
                        {alumnoSeleccionado.contacto_urgencia ? <ShieldAlert className="h-4 w-4 animate-pulse" /> : <AlertCircle className="h-4 w-4" />}
                        Contacto de Emergencia
                      </p>
                      <p className={`font-black text-sm uppercase mt-1 ${alumnoSeleccionado.contacto_urgencia ? 'text-foreground' : 'text-amber-700 dark:text-amber-500'}`}>
                        {alumnoSeleccionado.contacto_urgencia || "⚠️ NO CARGADO"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  {/* Legajo Digital */}
                  <Card className="border-border shadow-sm bg-card rounded-[2.5rem] overflow-hidden">
                    <div className="p-5 border-b border-border bg-secondary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Legajo Digital</h3>
                      </div>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px] font-black">
                        {alumnoSeleccionado.documentos?.length || 0}
                      </span>
                    </div>
                    <CardContent className="p-5 space-y-4">
                      <div className="divide-y divide-border">
                        {(!alumnoSeleccionado.documentos || alumnoSeleccionado.documentos.length === 0) ? (
                          <p className="py-6 text-center text-muted-foreground text-xs italic">No hay archivos adjuntos en el legajo.</p>
                        ) : (
                          alumnoSeleccionado.documentos.map((doc: any) => (
                            <div key={doc.id} className="py-4 flex items-center justify-between group">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="p-3 bg-secondary rounded-xl shrink-0"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate">{doc.nombre}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{format(new Date(doc.fecha), "dd MMM yyyy", {locale:es})}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary rounded-full hover:bg-primary/10 transition-colors"><Download className="h-5 w-5" /></Button>
                            </div>
                          ))
                        )}
                      </div>
                      <Button onClick={simularSubidaArchivo} variant="outline" className="w-full border-dashed border-2 hover:bg-secondary h-14 rounded-xl text-muted-foreground font-bold text-xs uppercase tracking-widest">
                        <UploadCloud className="h-5 w-5 mr-2" /> Adjuntar Nuevo Archivo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                PESTAÑA 2: FINANZAS Y ESTADO DE CUENTA
            ------------------------------------------------------------- */}
            {pestañaDetalle === 'finanzas' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-1 lg:col-span-3 space-y-6">
                  
                  <Card className={`border-2 shadow-md bg-card rounded-[2.5rem] overflow-hidden ${alumnoSeleccionado.estado_cuota === 'al_dia' ? 'border-border' : 'border-destructive/40'}`}>
                    <div className={`p-6 border-b flex items-center gap-3 ${alumnoSeleccionado.estado_cuota === 'al_dia' ? 'bg-secondary/10 border-border' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                      <Wallet className="h-6 w-6" />
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Situación Financiera</h3>
                    </div>
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        
                        {modeloNegocio === 'reservas' ? (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Créditos Disponibles</p>
                            <div className="flex items-end gap-2">
                              <p className="text-7xl font-black text-primary leading-none">{alumnoSeleccionado.creditos}</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Membresía Mensual</p>
                            {alumnoSeleccionado.estado_cuota === 'al_dia' ? (
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                <p className="text-3xl font-black text-foreground uppercase tracking-tight">Al Día</p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <AlertCircle className="h-12 w-12 text-destructive animate-pulse" />
                                <p className="text-3xl font-black text-destructive uppercase tracking-tight">Vencida</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="w-full md:w-auto flex flex-col gap-2 min-w-[250px]">
                          <Button onClick={abrirModalCobro} className="bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest rounded-xl h-14 px-8 shadow-lg w-full">
                            {modeloNegocio === 'reservas' ? 'Acreditar Clases' : 'Registrar Pago / Cobrar'}
                          </Button>
                        </div>

                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm bg-card rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 border-b border-border bg-emerald-500/5 flex items-center gap-2">
                      <ReceiptText className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-black text-sm uppercase tracking-widest text-emerald-700 dark:text-emerald-500">Historial de Pagos</h3>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {(!alumnoSeleccionado.pagos || alumnoSeleccionado.pagos.length === 0) ? (
                          <p className="p-10 text-center text-muted-foreground italic text-sm">Aún no hay pagos registrados para esta alumna.</p>
                        ) : (
                          alumnoSeleccionado.pagos.map((pago: any) => (
                            <div key={pago.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/5 transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-2xl text-emerald-600 shrink-0">
                                  <Banknote className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                    {format(new Date(pago.fecha), "dd MMM yyyy", {locale: es})}
                                  </p>
                                  <p className="text-base font-bold text-foreground mt-1 uppercase">
                                    {pago.concepto_categoria} - {pago.concepto_detalle}
                                  </p>
                                </div>
                              </div>
                              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-2 shrink-0">
                                <div className="text-left sm:text-right">
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Importe Abonado</p>
                                  <p className="text-3xl font-black text-emerald-600">${pago.monto.toLocaleString('es-AR')}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setReciboVisualizado(pago)} className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto mt-2 sm:mt-0">
                                  <ReceiptText className="h-3 w-3 mr-1" /> Ver PDF
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                PESTAÑA 3: ASISTENCIAS
            ------------------------------------------------------------- */}
            {pestañaDetalle === 'asistencias' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-1 lg:col-span-3 space-y-6">
                  <Card className="border-border shadow-sm bg-card rounded-[2rem] overflow-hidden">
                    <div className="p-5 border-b border-border bg-secondary/10 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Historial de Clases</h3>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {(!alumnoSeleccionado.asistencias || alumnoSeleccionado.asistencias.length === 0) ? (
                          <p className="p-10 text-center text-muted-foreground italic text-sm">Aún no hay asistencias registradas.</p>
                        ) : (
                          alumnoSeleccionado.asistencias.sort((a:any, b:any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((asistencia: any) => (
                            <div key={asistencia.id} className="p-6 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-2xl text-primary shrink-0">
                                  <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="font-black text-base uppercase text-foreground">{asistencia.nivel}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {format(new Date(asistencia.fecha), "EEEE dd 'de' MMMM", {locale: es})} • {asistencia.horario.slice(0,5)} hs
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-full uppercase tracking-widest">
                                Presente
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ===================================================================================
          MODAL: PRE-REGISTRO DE ALUMNA
      =================================================================================== */}
      {modalPreRegistro && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md overflow-hidden">
            <div className="p-6 flex justify-between items-center bg-primary text-primary-foreground">
              <div>
                <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-2"><Send className="h-5 w-5"/> Pre-Inscripción</h3>
                <p className="text-xs font-medium opacity-80 mt-1">Alta de ficha y vinculación familiar.</p>
              </div>
              <button onClick={() => setModalPreRegistro(false)} className="hover:bg-black/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              preRegistrarAlumno({
                id: `alu-${Date.now()}`,
                nombre: formData.get('nombre'),
                apellido: formData.get('apellido'),
                email: formData.get('email'),
                email_tutor: formData.get('email_tutor'), 
                telefono: formData.get('telefono'),
                contacto_urgencia: formData.get('urgencia') || "",
                direccion: "",
                estado_cuota: "al_dia",
                creditos: modeloNegocio === 'reservas' ? (parseInt(formData.get('creditos') as string) || 0) : 0,
                ultima_asistencia: "Sin registros",
                pagos: [],
                documentos: [],
                asistencias: []
              });
              setModalPreRegistro(false);
            }} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre</label>
                  <input name="nombre" type="text" required className="w-full bg-background border border-border rounded-xl h-11 px-4 outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Apellido</label>
                  <input name="apellido" type="text" required className="w-full bg-background border border-border rounded-xl h-11 px-4 outline-none focus:border-primary" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">WhatsApp</label>
                <input name="telefono" type="text" required className="w-full bg-background border border-border rounded-xl h-11 px-4 outline-none focus:border-primary" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Email del Tutor (Obligatorio para vínculo)</label>
                <input name="email_tutor" type="email" required className="w-full bg-primary/5 border border-primary/30 rounded-xl h-11 px-4 outline-none focus:border-primary font-bold" placeholder="email@ejemplo.com" />
              </div>

              {modeloNegocio === 'reservas' && (
                <div className="space-y-1 pt-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Créditos / Clases Iniciales</label>
                  <input name="creditos" type="number" defaultValue="4" className="w-full bg-background border border-border rounded-xl h-11 px-4 outline-none font-bold focus:border-primary" />
                </div>
              )}
              
              <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest mt-4 shadow-md">Crear Ficha</Button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================================
          MODAL MAGICO: COBRO FAMILIAR EN LOTE
      =================================================================================== */}
      {modalCobro.abierto && alumnoSeleccionado && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-primary p-6 text-center text-primary-foreground shrink-0">
              <div className="mx-auto w-14 h-14 bg-background/20 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <Wallet className="h-7 w-7" />
              </div>
              <h3 className="font-black text-xl uppercase tracking-tighter">
                {modalCobro.familia.length > 1 ? "Cobro Grupo Familiar" : "Registrar Ingreso"}
              </h3>
            </div>
            
            <form onSubmit={ejecutarCobro} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              
              {/* LISTA DE CHECKBOXES SI HAY FAMILIA */}
              {modalCobro.familia.length > 1 && (
                <div className="space-y-2 border-b border-border pb-4">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Seleccionar a quién le imputás el pago:</label>
                  <div className="space-y-2 mt-2">
                    {modalCobro.familia.map(familiar => (
                      <div key={familiar.id} onClick={() => toggleCheckAlumno(familiar.id)} className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${alumnosAPagar.includes(familiar.id) ? 'bg-primary/10 border-primary' : 'bg-background border-border opacity-60'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${alumnosAPagar.includes(familiar.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                            {alumnosAPagar.includes(familiar.id) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className="font-bold text-sm uppercase">{familiar.nombre} {familiar.apellido}</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${familiar.estado_cuota === 'al_dia' ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                          {familiar.estado_cuota === 'al_dia' ? 'Al Día' : 'Deuda'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIPO DE CONCEPTO PARA EL PDF */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Concepto del Recibo</label>
                <div className="grid grid-cols-2 gap-2">
                  {['CUOTA', 'FICHAJE', 'INSCRIPCION', 'OTROS'].map(concepto => (
                    <div 
                      key={concepto} 
                      onClick={() => setConceptoSeleccionado(concepto)}
                      className={`p-2 border rounded-lg text-center cursor-pointer text-xs font-bold uppercase transition-colors ${conceptoSeleccionado === concepto ? 'bg-primary text-white border-primary' : 'bg-background hover:bg-secondary/50'}`}
                    >
                      {concepto}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Monto Total a cobrar ($)</label>
                <Input name="monto" type="number" required placeholder="Ej: 75000" className="h-14 rounded-2xl text-2xl font-black text-primary border-border focus-visible:ring-primary shadow-inner bg-secondary/20" />
              </div>

              {modeloNegocio === 'reservas' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Cantidad de clases a acreditar (por alumno)</label>
                  <Input name="creditos" type="number" required placeholder="Ej: 4 u 8 clases" className="h-12 rounded-xl border-primary bg-primary/5 font-bold" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Detalle / Aclaración / Medio (Mes, Torneo, Efectivo)</label>
                <Input name="observaciones" type="text" placeholder="Ej: Abril" className="h-12 rounded-xl border-border bg-background" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" onClick={() => setModalCobro({abierto:false, familia:[]})} variant="outline" className="flex-1 rounded-xl h-12 font-bold text-muted-foreground">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-black uppercase tracking-widest shadow-md">Emitir Recibo</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================================
          MODAL: VISOR DE RECIBO DIGITAL OFICIAL (ADMIN VISTA)
      =================================================================================== */}
      {reciboVisualizado && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-lg w-full relative">
            
            {/* Controles Flotantes para Exportar */}
            <div className="flex justify-end gap-2 mb-2">
              <Button variant="secondary" size="sm" onClick={() => {toast.success("Preparando PDF..."); setTimeout(()=>window.print(), 500)}} className="font-bold shadow-lg">
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
              <Button variant="secondary" size="sm" onClick={manejarCompartir} className="font-bold shadow-lg bg-blue-600 hover:bg-blue-700 text-white">
                <Share2 className="h-4 w-4 mr-2" /> Compartir
              </Button>
              <Button variant="destructive" size="icon" onClick={() => setReciboVisualizado(null)} className="shadow-lg"><X /></Button>
            </div>

            {/* RECIBO A IMPRIMIR */}
            <div className="bg-[#fdfdfc] text-black p-8 sm:p-10 rounded-xl shadow-2xl relative overflow-hidden select-none" style={{fontFamily: "'Courier New', Courier, monospace"}}>
              
              {/* Marca de Agua (Logo de Fondo) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                <img src={academia.logo_url} alt="watermark" className="w-[80%] h-[80%] object-contain grayscale" />
              </div>

              {/* ENCABEZADO */}
              <div className="flex justify-between items-start border-b-[3px] border-black/80 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  {/* Logo Arriba a la Izquierda */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-black flex items-center justify-center p-1 bg-white relative z-10 shrink-0 overflow-hidden">
                    <img src={academia.logo_url} className="w-full h-full object-cover" alt="Logo Academia" />
                  </div>
                  <div className="text-left max-w-[200px] sm:max-w-none">
                    <h2 className="text-lg sm:text-2xl font-black leading-none tracking-tight whitespace-pre-wrap" style={{fontFamily: "Arial, sans-serif"}}>{academia.nombre_corto}</h2>
                  </div>
                </div>
                
                <div className="text-right border-4 border-black p-2 sm:p-3 bg-white relative z-10 shrink-0">
                  <h2 className="text-xl sm:text-3xl font-black tracking-widest" style={{fontFamily: "Arial, sans-serif"}}>RECIBO X</h2>
                  <p className="text-[8px] sm:text-[10px] font-black mt-1 uppercase">Nº {reciboVisualizado.nro_recibo}</p>
                </div>
              </div>

              {/* CATEGORÍAS */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
                  {['CUOTA', 'FICHAJE', 'INSCRIPCION', 'OTROS'].map(cat => (
                    <div key={cat} className="border-2 border-black flex items-center bg-white relative z-10">
                      <div className="px-2 py-1 border-r-2 border-black">{cat}</div>
                      <div className="w-8 flex justify-center py-1 font-black text-lg">
                        {reciboVisualizado.concepto_categoria === cat ? 'X' : ''}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-lg font-bold flex items-end gap-2 whitespace-nowrap">
                  <span>Fecha:</span>
                  <span className="border-b-[2px] border-dashed border-black px-4 pb-1 text-xl font-medium tracking-widest text-blue-900/80" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                    {formatearFechaCorta(reciboVisualizado.fecha).replace(/\//g, ' / ')}
                  </span>
                </div>
              </div>

              {/* DATOS */}
              <div className="space-y-8 text-lg sm:text-xl font-bold mt-10 relative z-10">
                <div className="flex items-end gap-2">
                  <span className="w-24 sm:w-32 shrink-0">Socio:</span>
                  <span className="flex-1 border-b-[2px] border-dashed border-black pb-1 text-xl sm:text-2xl uppercase tracking-wider text-blue-900/80 line-clamp-1" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                    {reciboVisualizado.beneficiario}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="w-24 sm:w-32 shrink-0">Pesos:</span>
                  <span className="flex-1 border-b-[2px] border-dashed border-black pb-1 text-xl sm:text-2xl tracking-wider text-blue-900/80" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                    $ {reciboVisualizado.monto.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="w-24 sm:w-32 shrink-0">Concepto:</span>
                  <span className="flex-1 border-b-[2px] border-dashed border-black pb-1 text-xl sm:text-2xl uppercase tracking-wider text-blue-900/80 truncate" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                    {reciboVisualizado.concepto_detalle}
                  </span>
                </div>
              </div>

              {/* FIRMA Y SELLO DE ADMINISTRACIÓN */}
              <div className="mt-20 flex justify-between items-end relative z-10">
                <div className="opacity-60">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{fontFamily: "Arial, sans-serif"}}>SYSTEM LUME</p>
                </div>
                <div className="text-center w-48 sm:w-64 relative">
                  {/* Firma Virtual (Cursiva con el nombre) */}
                  <div className="absolute -top-10 left-0 w-full flex justify-center text-blue-900/80" style={{fontFamily: "'Bradley Hand', cursive, sans-serif", fontSize: "2.5rem", transform: "rotate(-5deg)"}}>
                    {academia.admin_nombre}
                  </div>
                  <div className="border-b-[2px] border-black mb-1 h-8"></div>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest" style={{fontFamily: "Arial, sans-serif"}}>{academia.admin_nombre}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5" style={{fontFamily: "Arial, sans-serif"}}>Administración</p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

    </div>
  )
}