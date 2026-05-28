export default function Contacto({ whatsapp }: { whatsapp: string }) {
  return (
    <section id="contacto" className="py-32 px-6 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Lado Izquierdo: Textos y Datos */}
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-900 mb-4">
              Encontranos
            </h2>
            <div className="h-2 w-20 bg-slate-900 mb-8" />
            <p className="text-slate-500 text-lg mb-10 leading-relaxed">
              Vení a conocer el estudio, sumate a una clase de prueba y empezá a entrenar con los mejores. 
              ¡Te estamos esperando!
            </p>

            <div className="space-y-6 mb-10">
              {/* Dirección */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 uppercase">Ubicación</h4>
                  <p className="text-slate-500">Av. Principal 1234, Ciudad</p>
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 uppercase">Contacto</h4>
                  <p className="text-slate-500">+54 9 11 0000-0000</p>
                </div>
              </div>
            </div>

            {/* Botón de WhatsApp */}
            <a 
              href={`https://wa.me/${whatsapp}?text=Hola!%20Me%20gustaría%20recibir%20información%20sobre%20las%20clases.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold uppercase tracking-widest py-4 px-8 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/>
              </svg>
              Escribinos por WhatsApp
            </a>
          </div>

          {/* Lado Derecho: Mapa (Usamos un iframe genérico de Google Maps de Buenos Aires como demo) */}
          <div className="h-[500px] w-full bg-slate-100 p-2">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.0167132768496!2d-58.38384262425983!3d-34.60373886500588!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4aa9f0a6da5edb%3A0x11be22f1c8411d51!2sObelisco!5e0!3m2!1ses-419!2sar!4v1700000000000!5m2!1ses-419!2sar" 
              className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

        </div>
      </div>
    </section>
  )
}