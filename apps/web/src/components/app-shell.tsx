import Image from "next/image";
import Link from "next/link";

type WorkflowStep = "upload" | "context" | "text" | "image" | "video" | "summary";

const workflowSteps: Array<{ key: WorkflowStep; label: string }> = [
  { key: "upload", label: "Upload" },
  { key: "context", label: "Contexto" },
  { key: "text", label: "Textos" },
  { key: "image", label: "Imagens" },
  { key: "video", label: "Videos" },
  { key: "summary", label: "Resumo" },
];

const navigation = [
  { href: "/", label: "Workspace", icon: "W", key: "workspace" },
  { href: "/", label: "Meus Projetos", icon: "P", key: "projects" },
  { href: "/", label: "Novo stlAI", icon: "+", key: "new" },
];

const footerLinks = [
  { href: "#", label: "Configuracoes", icon: "S" },
  { href: "#", label: "Ajuda", icon: "?" },
  { href: "#", label: "Sair", icon: "<" },
];

export function AppShell({
  title,
  eyebrow,
  subtitle,
  children,
  actions,
  activeNav = "workspace",
  activeStep,
  completedSteps = [],
  creditsLabel = "50 CREDITOS",
}: {
  title: string;
  eyebrow: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  activeNav?: "workspace" | "projects" | "new";
  activeStep?: WorkflowStep;
  completedSteps?: WorkflowStep[];
  creditsLabel?: string;
}) {
  return (
    <div className="vision-app">
      <aside className="vision-sidebar">
        <div className="vision-sidebar__top">
          <Link className="vision-brand" href="/">
            <span className="vision-brand__logo">
              <Image alt="STLAI" height={34} priority src="/stlai-logo.png" width={118} />
            </span>
            <span className="vision-brand__text">
              <span className="vision-brand__title">Vision</span>
              <span className="vision-brand__subtitle">Marketplace AI Studio</span>
            </span>
          </Link>

          <nav className="vision-nav">
            {navigation.map((item) => (
              <Link
                className={`vision-nav__link ${activeNav === item.key ? "vision-nav__link--active" : ""}`}
                href={item.href}
                key={item.label}
              >
                <span className="vision-nav__icon">{item.icon}</span>
                <span className="vision-nav__label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="vision-sidebar__footer">
          {footerLinks.map((item) => (
            <Link className="vision-nav__link" href={item.href} key={item.label}>
              <span className="vision-nav__icon">{item.icon}</span>
              <span className="vision-nav__label">{item.label}</span>
            </Link>
          ))}
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-header__intro">
            <span className="workspace-header__eyebrow">{eyebrow}</span>
            {activeStep ? (
              <div className="stepper">
                {workflowSteps.map((step, index) => {
                  const isActive = step.key === activeStep;
                  const isDone = completedSteps.includes(step.key);

                  return (
                    <div
                      className={`stepper__item ${isActive ? "stepper__item--active" : ""} ${isDone ? "stepper__item--done" : ""}`}
                      key={step.key}
                    >
                      <span className="stepper__bullet">{isDone ? "OK" : index + 1}</span>
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="workspace-header__title">{title}</div>
                {subtitle ? <p className="workspace-subtitle">{subtitle}</p> : null}
              </>
            )}
          </div>

          <div className="workspace-balance">
            {actions}
            <div className="workspace-balance__content">
              <span>Saldo</span>
              <div className="workspace-balance__pill">{creditsLabel}</div>
            </div>
            <div className="workspace-avatar" />
          </div>
        </header>

        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}
