import { createFileRoute } from "@tanstack/react-router";

/**
 * Landing page of the app: the single-file simulator (public/simulateur.html) in a
 * full-viewport iframe, with links to the full-screen file and the project status report.
 * `staticData.landing` makes `/` redirect here (see src/landing.ts).
 */
const Simulateur = () => (
  <main
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      margin: 0,
      background: "#0f1620",
      color: "#e8eef6",
      font: "13px/1.4 'Segoe UI', Arial, sans-serif",
    }}
  >
    <div
      style={{
        display: "flex",
        gap: "14px",
        alignItems: "center",
        padding: "6px 14px",
        flex: "none",
      }}
    >
      <b>Simulation de balayage de ventilation</b>
      <a style={{ color: "#38bdf8" }} href="/simulateur.html">
        Simulateur en plein écran
      </a>
      <a style={{ color: "#38bdf8" }} href="/etat-des-lieux.html">
        État des lieux du projet
      </a>
      <span style={{ marginLeft: "auto", color: "#9fb0c3" }}>
        fichier unique autonome — tout le calcul se fait dans le navigateur
      </span>
    </div>
    <iframe
      src="/simulateur.html"
      title="Simulateur de balayage de ventilation"
      style={{ flex: 1, border: 0, width: "100%" }}
    />
  </main>
);

export const Route = createFileRoute("/simulateur")({
  staticData: { landing: true },
  component: Simulateur,
});
