"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react" // Importamos loader por si tarda

// Componentes importados
import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import Clases from "@/components/landing/Clases"
import Galeria from "@/components/landing/Galeria"
import SobreMi from "@/components/landing/SobreMi"
import Eventos from "@/components/landing/Eventos"
import Spotify from "@/components/landing/Spotify"
import Footer from "@/components/landing/Footer"
import Contacto from "@/components/landing/Contacto"

export default function LandingSaaS() {
  const supabase = createClient()
  const [scrolled, setScrolled] = useState(false)
  const [cargando, setCargando] = useState(true)
  
  const [eventos, setEventos] = useState<any[]>([])
  const [galeria, setGaleria] = useState<any[]>([])
  const [disciplinas, setDisciplinas] = useState<any[]>([])
  const [equipo, setEquipo] = useState<any[]>([])
  const [whatsapp, setWhatsapp] = useState("5491100000000") 

  const [config, setConfig] = useState<any>({
    nombreEstudio: "Sync Studio",
    hero: { foto_portada: "", frase_streets: "" },
    spotify: { canciones: [] } 
  })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)

    const fetchData = async () => {
      const hoy = new Date().toISOString().split('T')[0]
      
      const [resEv, resGal, resDisc, resConf] = await Promise.all([
        supabase.from("landing_clases").select("*").eq("es_evento", true).gte("fecha", hoy).order("fecha", { ascending: true }),
        supabase.from("landing_multimedia").select("*").order("orden"),
        supabase.from("landing_disciplinas").select("*"),
        supabase.from("landing_configuracion").select("*")
      ])

      if (resEv.data) setEventos(resEv.data)
      if (resGal.data) setGaleria(resGal.data)
      if (resDisc.data) setDisciplinas(resDisc.data)
      
      if (resConf.data) {
        const c = resConf.data;
        
        // Buscamos helpers para encontrar valores en el JSON de configuración
        const findVal = (key: string, fallback: any) => {
          const item = c.find((x: any) => x.key === key);
          return item ? (typeof item.valor === 'string' ? JSON.parse(item.valor) : item.valor) : fallback;
        }

        setConfig({
          nombreEstudio: findVal('nombre_estudio', 'Sync Studio'),
          hero: {
            foto_portada: findVal('hero_portada', ""),
            frase_streets: findVal('hero_frase', "Movimiento, fuerza y disciplina.")
          },
          spotify: { canciones: findVal('spotify', []) }
        })

        setEquipo(findVal('equipo', []))
        setWhatsapp(findVal('whatsapp', "5491100000000"))
      }
      setCargando(false)
    }
    
    fetchData()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [supabase])

  if (cargando) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      <Navbar scrolled={scrolled} nombreEstudio={config.nombreEstudio} />
      <Hero config={config} />
      <Clases disciplinas={disciplinas} />
      <Galeria galeria={galeria} />
      <SobreMi equipo={equipo} />
      <Eventos eventos={eventos} whatsapp={whatsapp} />
      <Spotify spotify={config.spotify} />
      <Contacto whatsapp={whatsapp} />
      <Footer nombreEstudio={config.nombreEstudio} whatsapp={whatsapp} />
    </div>
  )
}