import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DT Courriers - Gestion documentaire",
    short_name: "DT Courriers",
    description: "Système de suivi et archivage des courriers avec IA",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    categories: ["productivity", "business", "office"],
    lang: "fr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nouveau courrier",
        short_name: "Nouveau",
        description: "Enregistrer un nouveau courrier",
        url: "/dashboard/courriers/nouveau",
      },
      {
        name: "Tous les courriers",
        short_name: "Courriers",
        description: "Voir tous les courriers",
        url: "/dashboard/courriers",
      },
    ],
  }
}
