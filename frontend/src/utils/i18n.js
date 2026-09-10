// Lightweight i18n for the /app chrome. English strings are the keys, so
// `t("Settings")` falls back to the key itself for English (or any missing
// translation). Generated documents intentionally stay English — only the UI
// translates. setLanguage() notifies subscribers so useLanguage() re-renders
// live when the settings segment changes.
import { useEffect, useReducer } from "react";

const DICTS = {
  es: {
    "Pay Stubs": "Talones de pago",
    "Canadian Stubs": "Talones canadienses",
    "Tax Forms": "Formularios fiscales",
    "Legal Forms": "Formularios legales",
    "Business Forms": "Formularios de negocios",
    "Resumes": "Currículums",
    "Settings": "Configuración",
    "Terms of Service": "Términos del servicio",
    "Privacy Policy": "Política de privacidad",
    "Subscriber": "Suscriptor",
    "Free": "Gratis",
    "User": "Usuario",
    "Notifications": "Notificaciones",
    "Clear all": "Borrar todo",
    "No notifications yet": "Aún no hay notificaciones",
    "View": "Ver",
    "Create Pay Stub": "Crear talón de pago",
    "Create Canadian Paystub": "Crear talón canadiense",
    "Create Offer Letter": "Crear carta de oferta",
    "Create Accounting Mockup": "Crear simulación contable",
    "Build AI Resume": "Crear currículum con IA",
    "Build Tax Forms": "Crear formularios fiscales",
    "Build Legal Forms": "Crear formularios legales",
    "Build Business Forms": "Crear formularios de negocios",
    "Cancel": "Cancelar",
    "Status": "Estado",
    "App Status": "Estado de la app",
    "Normal": "Normal",
    "Degraded": "Degradado",
    "Down": "Caído",
    "Current version": "Versión actual",
    "Latest": "Última",
    "What's New": "Novedades",
    "Known Issues": "Problemas conocidos",
    "Appearance": "Apariencia",
    "Language": "Idioma",
    "Dark theme": "Tema oscuro",
    "Show support chat": "Mostrar chat de soporte",
    "Support": "Soporte",
    "Tutorials": "Tutoriales",
    "Feature Request": "Sugerir función",
    "Report a Problem": "Reportar un problema",
    "About": "Acerca de",
    "Search": "Buscar",
    "No results found": "No se encontraron resultados",
    "No tutorials available yet.": "Aún no hay tutoriales disponibles.",
    "No videos in this category.": "No hay videos en esta categoría.",
    "Playlists": "Listas de reproducción",
    "video": "video",
    "videos": "videos",
    "Your completed downloads will appear here": "Tus descargas completadas aparecerán aquí",
    "Generating...": "Generando...",
    "Ready to download": "Listo para descargar",
    "Generation failed": "La generación falló",
    "CREATE": "CREAR",
    "Navigate": "Navegar",
    "Home": "Inicio",
    "What would you like to create today?": "¿Qué te gustaría crear hoy?",
    "Professional documents in minutes.": "Documentos profesionales en minutos.",
    "Create a Pay Stub": "Crea un talón de pago",
    "Create a W-2": "Crea un W-2",
    "Build Your AI Resume": "Crea tu currículum con IA",
    "Create a Commercial Lease": "Crea un contrato de arrendamiento",
    "Create an Offer Letter": "Crea una carta de oferta",
    "Generate a 1099": "Genera un 1099",
    "Create a Power of Attorney": "Crea un poder notarial",
  },
  fr: {
    "Pay Stubs": "Bulletins de paie",
    "Canadian Stubs": "Bulletins canadiens",
    "Tax Forms": "Formulaires fiscaux",
    "Legal Forms": "Formulaires juridiques",
    "Business Forms": "Formulaires d'affaires",
    "Resumes": "CV",
    "Settings": "Paramètres",
    "Terms of Service": "Conditions d'utilisation",
    "Privacy Policy": "Politique de confidentialité",
    "Subscriber": "Abonné",
    "Free": "Gratuit",
    "User": "Utilisateur",
    "Notifications": "Notifications",
    "Clear all": "Tout effacer",
    "No notifications yet": "Aucune notification pour l'instant",
    "View": "Voir",
    "Create Pay Stub": "Créer un bulletin de paie",
    "Create Canadian Paystub": "Créer un bulletin canadien",
    "Create Offer Letter": "Créer une lettre d'offre",
    "Create Accounting Mockup": "Créer une maquette comptable",
    "Build AI Resume": "Créer un CV avec l'IA",
    "Build Tax Forms": "Créer des formulaires fiscaux",
    "Build Legal Forms": "Créer des formulaires juridiques",
    "Build Business Forms": "Créer des formulaires d'affaires",
    "Cancel": "Annuler",
    "Status": "État",
    "App Status": "État de l'application",
    "Normal": "Normal",
    "Degraded": "Dégradé",
    "Down": "En panne",
    "Current version": "Version actuelle",
    "Latest": "Dernière",
    "What's New": "Nouveautés",
    "Known Issues": "Problèmes connus",
    "Appearance": "Apparence",
    "Language": "Langue",
    "Dark theme": "Thème sombre",
    "Show support chat": "Afficher le chat d'assistance",
    "Support": "Assistance",
    "Tutorials": "Tutoriels",
    "Feature Request": "Suggérer une fonctionnalité",
    "Report a Problem": "Signaler un problème",
    "About": "À propos",
    "Search": "Rechercher",
    "No results found": "Aucun résultat trouvé",
    "No tutorials available yet.": "Aucun tutoriel disponible pour l'instant.",
    "No videos in this category.": "Aucune vidéo dans cette catégorie.",
    "Playlists": "Playlists",
    "video": "vidéo",
    "videos": "vidéos",
    "Your completed downloads will appear here": "Vos téléchargements terminés apparaîtront ici",
    "Generating...": "Génération...",
    "Ready to download": "Prêt à télécharger",
    "Generation failed": "Échec de la génération",
    "CREATE": "CRÉER",
    "Navigate": "Naviguer",
    "Home": "Accueil",
    "What would you like to create today?": "Que souhaitez-vous créer aujourd'hui ?",
    "Professional documents in minutes.": "Des documents professionnels en quelques minutes.",
    "Create a Pay Stub": "Créez un bulletin de paie",
    "Create a W-2": "Créez un W-2",
    "Build Your AI Resume": "Créez votre CV avec l'IA",
    "Create a Commercial Lease": "Créez un bail commercial",
    "Create an Offer Letter": "Créez une lettre d'offre",
    "Generate a 1099": "Générez un 1099",
    "Create a Power of Attorney": "Créez une procuration",
  },
};

let current = localStorage.getItem("appLanguage") || "en";
const listeners = new Set();

export function getLanguage() {
  return current;
}

export function setLanguage(lang) {
  current = lang;
  localStorage.setItem("appLanguage", lang);
  listeners.forEach((fn) => { try { fn(lang); } catch (e) {} });
}

export function t(text) {
  return DICTS[current]?.[text] ?? text;
}

// Subscribe a component to language changes; returns the current language.
export function useLanguage() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => listeners.delete(force);
  }, []);
  return current;
}
