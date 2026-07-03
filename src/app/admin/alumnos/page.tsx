"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"
import { Search } from "lucide-react"

import VisorReciboPDF from "@/components/admin/VisorReciboPDF"
import CobroModal from "@/components/admin/CobroModal"
import FichaAlumno from "@/components/admin/FichaAlumno"
import ListaDirectorio from "@/components/admin/ListaDirectorio"
import NuevoAlumnoModal from "@/components/admin/NuevoAlumnoModal"

const DICCIONARIO = {
  mensual: { pluralSujeros: "Alumnos", singularSujero: "Alumno" },
  reservas: { pluralSujeros: "Alumnas", singularSujero: "Alumna" }
}

export default function AdminAlumnosPage() {
  const supabase = createClient() 
  
  const [isMounted, setIsMounted] = useState(false)
  const [vistaActiva, setVistaActiva] = useState<'directorio' | 'detalle'>('directorio')
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any | null>(null)
  
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroEtiqueta, setFiltroEtiqueta] = useState("")
  const [alumnos, setAlumnos] = useState<any[]>([])

  const [academiaOficial, setAcademiaOficial] = useState<any>({
    nombre_largo: "MI ACADEMIA",
    nombre_corto: "MI ACADEMIA",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=Lume&backgroundColor=ffffff",
    admin_nombre: "Administración",
    firma_url: ""
  })

  const [modalCobro, setModalCobro] = useState<{abierto: boolean, familia: any[]}>({abierto: false, familia: []})
  const [reciboVisualizado, setReciboVisualizado] = useState<any | null>(null)
  const [modalPreRegistro, setModalPreRegistro] = useState(false)

  const modeloNegocio = "mensual" 
  const textos = DICCIONARIO[modeloNegocio as keyof typeof DICCIONARIO]

  const handleArchivarAlumno = async (id: string) => {
    try {
      const { error } = await supabase.from('usuarios').update({ activa: false }).eq('id', id)
      if (error) throw error
      toast.success("Ficha archivada. Ya no aparecerá en la lista activa.")
      setVistaActiva('directorio')
      cargarAlumnos()
    } catch (error: any) {
      toast.error("Error al archivar: " + error.message)
    }
  }

  const handleEliminarPreInscripcion = async (email: string) => {
    try {
      const { error } = await supabase.from('pre_inscripciones').delete().eq('email', email)
      if (error) throw error
      toast.success("Pre-inscripción eliminada correctamente.")
      setVistaActiva('directorio')
      cargarAlumnos()
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message)
    }
  }

  const cargarAlumnos = async () => {
    try {
      const { data: aca } = await supabase.from("academias").select("*").limit(1).single()
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

      const { data: dataOficial, error: errorOficial } = await supabase.from('usuarios').select('*').eq('rol', 'alumno')
      if (errorOficial) throw errorOficial

      const { data: dataPre, error: errorPre } = await supabase.from('pre_inscripciones').select('*')
      if (errorPre) throw errorPre

      const { data: dataPagos, error: errorPagos } = await supabase.from('pagos').select('*').order('fecha', { ascending: false })
      if (errorPagos) throw errorPagos

      const hoy = new Date()
      const diaActual = hoy.getDate()
      const mesActual = hoy.getMonth()
      const anioActual = hoy.getFullYear()

      const mesPasado = mesActual === 0 ? 11 : mesActual - 1
      const anioMesPasado = mesActual === 0 ? anioActual - 1 : anioActual

      const alumnasOficiales = (dataOficial || []).map((u: any) => {
        const flex = u.datos_flexibles || {}
        
        let diaVencimiento = flex.dia_vencimiento ? parseInt(flex.dia_vencimiento) : 10
        if (u.titular_id) {
          const tutor = (dataOficial || []).find((t: any) => t.id === u.titular_id)
          if (tutor?.datos_flexibles?.dia_vencimiento) {
            diaVencimiento = parseInt(tutor.datos_flexibles.dia_vencimiento)
          }
        }
        
        // REGLA HÍBRIDA (Nuevos pagos individuales + Viejos pagos grupales)
        const pagosPropios = (dataPagos || []).filter((p: any) => {
          if (p.alumno_id === u.id) return true // Nueva lógica: su propio ID
          return p.beneficiario && p.beneficiario.includes(u.nombre) // Lógica vieja (para no perder su historial)
        })
        
        const tienePagoEsteMes = pagosPropios.some((p: any) => {
          const f = new Date(p.fecha)
          return p.concepto_categoria === 'CUOTA' && f.getMonth() === mesActual && f.getFullYear() === anioActual
        })

        const tienePagoMesAnterior = pagosPropios.some((p: any) => {
          const f = new Date(p.fecha)
          return p.concepto_categoria === 'CUOTA' && f.getMonth() === mesPasado && f.getFullYear() === anioMesPasado
        })

        let estadoCalculado = 'deuda'
        
        if (pagosPropios.length === 0) {
          estadoCalculado = 'deuda'
        } else if (tienePagoEsteMes) {
          estadoCalculado = 'al_dia'
        } else if (!tienePagoMesAnterior) {
          estadoCalculado = 'deuda' // Debe el mes pasado, el periodo de gracia no lo salva
        } else {
          estadoCalculado = diaActual <= diaVencimiento ? 'al_dia' : 'deuda'
        }

        return {
          id: u.id,
          nombre: u.nombre,
          apellido: "",
          email: u.email || "Sin correo (Menor)",
          telefono: u.telefono,
          avatar_url: flex.avatar_url || null,
          titular_id: u.titular_id,
          estado_cuota: estadoCalculado, 
          creditos: flex.creditos_clases || 0,
          contacto_urgencia: flex.contacto_urgencia || "",
          documentos: flex.documentos || [],
          pagos: pagosPropios, // Ahora la ficha solo muestra SUS pagos
          asistencias: flex.asistencias || [],
          entrena: u.activa !== false,
          datos_flexibles: flex,
          es_preinscripcion: false 
        }
      })

      const alumnasPre = (dataPre || []).map((p: any) => ({
        id: `pre-${p.email}`, 
        nombre: p.nombre, apellido: "", email: p.email, telefono: p.telefono,
        avatar_url: null, estado_cuota: 'vencida', creditos: 0, contacto_urgencia: "",
        documentos: [], pagos: [], asistencias: [], entrena: true, datos_flexibles: {}, es_preinscripcion: true 
      }))
      
      const todasJuntas = [...alumnasOficiales, ...alumnasPre].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setAlumnos(todasJuntas)

    } catch (error: any) {
      toast.error("Error al cargar la base de datos: " + error.message)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    cargarAlumnos()
  }, [])

  useEffect(() => {
    if (isMounted && alumnos.length > 0 && alumnoSeleccionado) {
      setAlumnoSeleccionado(alumnos.find(a => a.id === alumnoSeleccionado.id))
    }
  }, [alumnos, isMounted])

  if (!isMounted) return null

  const simularSubidaArchivo = () => { cargarAlumnos() }
  const handleCambiarFotoAdmin = () => { cargarAlumnos() }

  // NUEVO SISTEMA DE COBROS: 1 PAGO POR CADA ALUMNO SELECCIONADO
  const handleCobrar = async (datos: any) => {
    if (datos.alumnosAPagar.length === 0) return toast.error("Seleccioná al menos un alumno.")
    
    try {
      const nroRecibo = `0001-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
      let fechaPago = new Date().toISOString()
      
      if (datos.concepto === "CUOTA" && datos.mesImputado) {
        const hoy = new Date()
        fechaPago = new Date(hoy.getFullYear(), Number(datos.mesImputado) - 1, 15).toISOString()
      }

      const montoPorAlumno = datos.monto / datos.alumnosAPagar.length

      for (const idAlumno of datos.alumnosAPagar) {
        const alumnoTarget = alumnos.find(a => a.id === idAlumno)
        const nombreBeneficiario = alumnoTarget ? alumnoTarget.nombre : "Alumno"

        const { error: errorPago } = await supabase.from('pagos').insert({
          alumno_id: idAlumno, 
          nro_recibo: nroRecibo,
          concepto_categoria: datos.concepto,
          concepto_detalle: datos.observaciones,
          monto: montoPorAlumno,
          beneficiario: nombreBeneficiario,
          estado: 'aprobado',
          fecha: fechaPago 
        })
        if (errorPago) throw errorPago

        const { data: usr } = await supabase.from('usuarios').select('datos_flexibles').eq('id', idAlumno).single()
        const flexActual = usr?.datos_flexibles || {}
        const mesActual = new Date().getMonth() + 1
        const esPagoDelMesCorriente = datos.mesImputado ? Number(datos.mesImputado) === mesActual : true

        const nuevoPayloadFlex = {
          ...flexActual,
          creditos_clases: (flexActual.creditos_clases || 0) + Number(datos.creditos || 0)
        }

        if (esPagoDelMesCorriente && datos.concepto === "CUOTA") {
          nuevoPayloadFlex.estado_cuota = 'al_dia'
        }

        await supabase.from('usuarios').update({ datos_flexibles: nuevoPayloadFlex }).eq('id', idAlumno)
      }

      setModalCobro({abierto: false, familia: []})
      toast.success("¡Cobro guardado! Pago imputado individualmente a cada alumno.")
      cargarAlumnos() 
    } catch (error: any) {
      toast.error("Error al procesar el cobro: " + error.message)
    }
  }

  const alumnosFiltrados = alumnos.filter(a => {
    const coincideTexto = `${a.nombre}`.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                          (a.email && a.email.toLowerCase().includes(filtroTexto.toLowerCase()))
    if (!coincideTexto) return false

    if (filtroEtiqueta !== '') {
      if (filtroEtiqueta === 'deudores') return a.estado_cuota !== 'al_dia' && !a.es_preinscripcion
      if (filtroEtiqueta === 'tutores') return a.entrena === false
      const tieneEtiqueta = a.datos_flexibles?.etiquetas?.includes(filtroEtiqueta)
      if (!tieneEtiqueta) return false
    }
    return true 
  }) 

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-4xl mx-auto">
      {vistaActiva === 'directorio' ? (
        <ListaDirectorio 
          alumnos={alumnosFiltrados} modeloNegocio={modeloNegocio} textos={textos}
          filtroTexto={filtroTexto} onFiltroTextoChange={setFiltroTexto}
          filtroEtiqueta={filtroEtiqueta} onFiltroEtiquetaChange={setFiltroEtiqueta}
          onAbrirDetalle={(al) => { setAlumnoSeleccionado(al); setVistaActiva('detalle'); }}
          onPreRegistro={() => setModalPreRegistro(true)}
        />
      ) : (
        alumnoSeleccionado && (
          <FichaAlumno 
            alumno={alumnoSeleccionado} modeloNegocio={modeloNegocio}
            onVolver={() => setVistaActiva('directorio')}
            onAbrirCobro={() => {
              const familia = alumnos.filter(a => {
                if (a.id === alumnoSeleccionado.id) return false;
                if (!alumnoSeleccionado.titular_id) return a.titular_id === alumnoSeleccionado.id; 
                return a.id === alumnoSeleccionado.titular_id || a.titular_id === alumnoSeleccionado.titular_id;
              })
              setModalCobro({ abierto: true, familia: [alumnoSeleccionado, ...familia] })
            }}
            onVerRecibo={(rec) => setReciboVisualizado(rec)}
            onSubirArchivo={cargarAlumnos}
            onCambiarFoto={cargarAlumnos}
            onArchivar={() => handleArchivarAlumno(alumnoSeleccionado.id)}
            onEliminarPre={() => handleEliminarPreInscripcion(alumnoSeleccionado.email)}
          />
        )
      )}

      <NuevoAlumnoModal 
        abierto={modalPreRegistro} modeloNegocio={modeloNegocio}
        onClose={() => setModalPreRegistro(false)} onGuardado={cargarAlumnos} 
      />

      {modalCobro.abierto && (
        <CobroModal 
          abierto={modalCobro.abierto} familia={modalCobro.familia} modeloNegocio={modeloNegocio}
          onClose={() => setModalCobro({abierto: false, familia: []})} onCobrar={handleCobrar}
        />
      )}

      {reciboVisualizado && (
        <VisorReciboPDF recibo={reciboVisualizado} academia={academiaOficial} onClose={() => setReciboVisualizado(null)} />
      )}
    </div>
  )
}