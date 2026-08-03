"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const client = createSupabaseBrowserClient();
    const result = password
      ? await client.auth.signInWithPassword({ email, password })
      : await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    if (result.error) setMessage(result.error.message);
    else if (password) window.location.assign("/admin/viajes");
    else setMessage("Enlace enviado. Revisa tu correo para continuar.");
    setBusy(false);
  }

  return <form className="admin-login-form" onSubmit={submit}>
    <label>Correo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
    <label>Contrasena <span>(opcional)</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
    {message && <p className="admin-message">{message}</p>}
    <button type="submit" disabled={busy}>{busy ? "Comprobando..." : password ? "Entrar" : "Enviar magic link"}</button>
    <small>Usa una contrasena o deja el campo vacio para recibir un enlace de acceso.</small>
  </form>;
}

