"use client";

interface NavbarProps {
  theme: "dark" | "light";
  liveMode: boolean;
  updatedText: string;
  onToggleTheme: () => void;
}

export default function Navbar({ theme, liveMode, updatedText, onToggleTheme }: NavbarProps) {
  const logo = theme === "light" ? "/assets/MC-Designs-Logo.svg" : "/assets/MC-Designs-Logo-white.svg";
  return (
    <nav className="navbar">
      <div className="nav-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img id="nav-logo" className="nav-logo" src={logo} alt="MC Designs" />
        <div className="nav-divider" />
        <div className="nav-title">
          <span className="eyebrow">AI Boom · Cadena de suministro</span>
          <span className="name">Del silicio al modelo de lenguaje</span>
        </div>
      </div>
      <div className="nav-right">
        <div className={"update-pill" + (liveMode ? "" : " reference")}>
          <span className="update-dot" />
          <span className="update-text">
            {liveMode ? "Datos en vivo" : "Datos de referencia"} · actualizado{" "}
          </span>
          {updatedText}
        </div>
        <button className="icon-btn" title="Cambiar tema" aria-label="Cambiar tema" onClick={onToggleTheme}>
          <span className="material-symbols-outlined">{theme === "light" ? "dark_mode" : "light_mode"}</span>
        </button>
      </div>
    </nav>
  );
}
