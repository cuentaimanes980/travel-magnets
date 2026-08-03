import { AdminShell } from "@/components/admin/AdminShell";
import { NewTripForm } from "@/components/admin/NewTripForm";

export default function NewTripPage() {
  return <AdminShell><section className="admin-section"><div className="admin-page-heading"><div><span className="section-label">Nuevo contenido</span><h1>Crear viaje</h1><p>El viaje se crea como borrador y no sera publico hasta validarlo.</p></div></div><NewTripForm /></section></AdminShell>;
}
