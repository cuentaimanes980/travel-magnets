import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Acceso administrador" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; confirmed?: string }> }) {
  const query = await searchParams;
  return <main className="admin-login-page"><section className="admin-login-card">
    <span className="section-label">Travel Magnets</span>
    <h1>Acceso privado</h1>
    <p>Gestiona el contenido editorial de tus viajes.</p>
    {query.error === "not-authorized" && <p className="admin-message admin-message--error">Este correo no esta autorizado como administrador.</p>}
    {query.confirmed && <p className="admin-message">Enlace enviado. Revisa tu correo para continuar.</p>}
    <LoginForm />
  </section></main>;
}

