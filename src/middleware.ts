import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const MODO_DISENO = false;

export async function middleware(request: NextRequest) {
  if (MODO_DISENO) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Usamos getUser() que es el método seguro que verifica el token con el servidor
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const esRutaProtegida = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/profesor') || 
    pathname.startsWith('/alumno')

  // CASO 1: No hay sesión y quiere entrar a una ruta privada -> Al Login
  if (!user && esRutaProtegida) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // CASO 2: Hay sesión, vamos a verificar los roles reales en la tabla 'usuarios'
  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios') // <--- CORREGIDO: apuntando a tu tabla real
      .select('rol')
      .eq('id', user.id)
      .single()

    const rol = usuario?.rol

    // Si un alumno quiere entrar a /admin o /profesor -> Lo mandamos a su panel
    if ((pathname.startsWith('/admin') && rol !== 'admin') || 
        (pathname.startsWith('/profesor') && rol !== 'admin' && rol !== 'profesor')) {
      return NextResponse.redirect(new URL('/alumno', request.url))
    }
    
    // Si un admin o profe quiere entrar a /alumno por error, lo dejamos o manejamos según prefieras
  }

  return response
}

export const config = {
  matcher: [
    // Protege todo menos archivos estáticos, imágenes y el favicon
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}