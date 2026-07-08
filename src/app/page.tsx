import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirige automáticamente al login apenas alguien entra al dominio principal
  redirect("/login")
}