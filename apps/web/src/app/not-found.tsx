import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell eyebrow="Erro" title="Projeto nao encontrado">
      <div className="section-card">
        <p className="muted-text">O projeto pedido nao existe neste ambiente ou ainda nao foi criado.</p>
        <Link className="primary-button button-link" href="/">
          Voltar para dashboard
        </Link>
      </div>
    </AppShell>
  );
}
