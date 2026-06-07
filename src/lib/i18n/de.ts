// Central registry of German UI strings repeated across the app.
//
// This is a pragmatic step toward i18n: strings are grouped by surface, so the
// next person who adds a locale only has to mirror this object. No runtime
// translator yet — components import the constants directly.
//
// Guideline: add a string here only when it is reused by ≥2 surfaces or when a
// copywriter might want to tweak it without grepping components.

export const de = {
  common: {
    save: "Speichern",
    saving: "Wird gespeichert...",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    back: "Zurück",
    retry: "Erneut versuchen",
    loading: "Wird geladen...",
    home: "Startseite",
  },
  auth: {
    login: "Anmelden",
    logout: "Abmelden",
    register: "Registrieren",
    forgotPassword: "Passwort vergessen?",
    invalidCredentials: "Ungültige Anmeldedaten",
    sessionExpired: "Sitzung abgelaufen. Bitte neu anmelden.",
  },
  errors: {
    genericRoute:
      "Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    genericHeading: "Etwas ist schiefgelaufen",
    networkProblem: "Netzwerkproblem. Bitte Verbindung prüfen.",
    tooManyRequests: "Zu viele Anfragen. Bitte später erneut versuchen.",
  },
  preferences: {
    title: "Präferenzen",
    subtitle: "Nachhaltigkeitswerte festlegen — beeinflusst Produktempfehlungen",
    profileType: "Profiltyp",
    profileNone: "Kein Profil",
    profileNoneDesc: "Keine Nachhaltigkeitsfilterung",
    profileSimple: "Einfach",
    profileSimpleDesc: "Ein Gewicht pro Kategorie",
    profileExtended: "Erweitert",
    profileExtendedDesc: "Gewichte pro Unterkategorie",
    noProfileHeadline: "Kein Werteprofil aktiv",
    noProfileBody: "Produkte werden ohne Nachhaltigkeitsgewichtung angezeigt.",
    savedToast: "Präferenzen gespeichert.",
    saveErrorToast: "Fehler beim Speichern.",
  },
} as const

export type DeStrings = typeof de
