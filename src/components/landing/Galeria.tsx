interface GaleriaProps {
  galeria: any[];
}

export default function Galeria({ galeria }: GaleriaProps) {
  if (!galeria || galeria.length === 0) return null;

  return (
    <section id="galeria" className="py-32 px-6 max-w-7xl mx-auto border-t border-slate-100">
      <div className="mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-black uppercase italic">El Estudio</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {galeria.map((foto, idx) => (
          <div key={foto.id} className={`relative bg-slate-100 overflow-hidden group aspect-square ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}>
            <img src={foto.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Estudio" />
          </div>
        ))}
      </div>
    </section>
  )
}