export default function SobreMi() {
  // Datos curados para la Demo Viva
  const equipo = [
    { id: 1, nombre: "Elena", rol: "Directora & Ballet", foto: "/staff-1.jpg" },
    { id: 2, nombre: "Marcos", rol: "Coach de Boxeo", foto: "/staff-2.jpg" },
    { id: 3, nombre: "Valeria", rol: "Ritmos Latinos", foto: "/staff-3.jpg" },
    { id: 4, nombre: "Sofía", rol: "Karate & Defensa", foto: "/staff-4.jpg" }
  ];

  return (
    <section id="equipo" className="bg-slate-900 py-32 px-6 text-white relative border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Título de la Sección */}
        <div className="mb-16 flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-white">
            Nuestro Equipo
          </h2>
          <div className="h-2 w-20 bg-white mt-4" />
          <p className="mt-6 text-slate-400 max-w-2xl text-lg">
            Conoce a los profesionales que te acompañarán a lograr tu mejor versión. 
            Gestiona los perfiles y horarios de todos tus profesores desde un solo lugar.
          </p>
        </div>

        {/* Grilla del Staff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {equipo.map((profe) => (
            <div key={profe.id} className="group relative overflow-hidden bg-slate-800">
              <div className="aspect-[3/4] overflow-hidden">
                <img 
                  src={profe.foto} 
                  alt={profe.nombre} 
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 to-transparent">
                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
                  {profe.nombre}
                </h3>
                <p className="text-slate-300 font-medium text-sm">
                  {profe.rol}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}