"use strict";
const LANGS = [
  { id: "fr", name: "Français" }, { id: "en", name: "English" }, { id: "es", name: "Español" },
  { id: "pt", name: "Português" }, { id: "de", name: "Deutsch" }, { id: "it", name: "Italiano" },
  { id: "ja", name: "日本語" }, { id: "ko", name: "한국어" }, { id: "zh", name: "简体中文" },
  { id: "zh-TW", name: "繁體中文" }, { id: "ar", name: "العربية", dir: "rtl" }, { id: "ru", name: "Русский" },
  { id: "hi", name: "हिन्दी" }, { id: "tr", name: "Türkçe" }, { id: "pl", name: "Polski" },
  { id: "nl", name: "Nederlands" }, { id: "id", name: "Bahasa Indonesia" }, { id: "vi", name: "Tiếng Việt" },
  { id: "th", name: "ไทย" }, { id: "uk", name: "Українська" }, { id: "sv", name: "Svenska" },
  { id: "cs", name: "Čeština" }, { id: "ro", name: "Română" }, { id: "el", name: "Ελληνικά" },
  { id: "hu", name: "Magyar" }, { id: "fi", name: "Suomi" }, { id: "da", name: "Dansk" },
  { id: "no", name: "Norsk" }, { id: "he", name: "עברית", dir: "rtl" }, { id: "ca", name: "Català" },
  { id: "ms", name: "Bahasa Melayu" }, { id: "tl", name: "Filipino" }
];
const I18N = {
  fr: {
    metaTitle: "SunoApp · GalaxyBunny Studio",
    metaDescription: "Application Windows non officielle pour Suno. Lecteur personnalisé, mini-lecteur, égaliseur, 31 langues.",
    navHome: "Accueil", navGithub: "GitHub", chooseLang: "Langue",
    heroKicker: "SUNOAPP · 2026",
    heroTitle: "Suno, dans une fenêtre Windows à vous.",
    heroLead: "Application de bureau non officielle : lecteur personnalisé, mini-lecteur, égaliseur, thèmes GalaxyBunny. Votre session reste sur la machine.",
    ctaInstall: "Télécharger", ctaDev: "Développer",
    pillWin: "Windows", pillUnofficial: "Non officiel", pillFree: "Gratuit & open source",
    shotHero: "Lecteur & spectre", shotMini: "Mini-lecteur",
    featuresTitle: "Un studio d’écoute, pas seulement un navigateur",
    fPlayerT: "Lecteur personnalisé", fPlayerD: "Pochette, progression, forme d’onde, couleurs dynamiques selon le morceau.",
    fMiniT: "Mini-lecteur", fMiniD: "Toujours visible, en bas à droite, avec lecture, pause, précédent, suivant et volume.",
    fEqT: "Égaliseur 10 bandes", fEqD: "Spectre, réverbe, écho, plusieurs profils sonores.",
    fThemeT: "Thèmes", fThemeD: "Nuit, Clair, Cherry, Aurore, Glass Apple, Aero, Musique.",
    fI18nT: "31 langues", fI18nD: "L’app et ce site parlent votre langue.",
    fWinT: "Windows natif", fWinD: "Contrôles multimédias dans la barre des tâches, session conservée.",
    installTitle: "Installation Windows",
    installLead: "Téléchargez l’installateur de la dernière release. Windows SmartScreen peut avertir : l’app n’a pas encore de certificat commercial.",
    step1: "Ouvrez la page Releases du dépôt.",
    step2: "Téléchargez l’installateur .exe de la dernière version.",
    step3: "Lancez l’installateur.",
    step4: "Ouvrez SunoApp et connectez-vous à Suno comme d’habitude.",
    devTitle: "Développement", devLead: "Node.js 22 ou plus.",
    discTitle: "Projet indépendant",
    discLead: "SunoApp n’est ni affilié ni approuvé par Suno. Marque et service appartiennent à leurs détenteurs.",
    disclaimer: "SunoApp est un projet indépendant, non officiel. GalaxyBunny Studio / Flora Cherry.",
    footer: "GalaxyBunny Studio · application Windows pour Suno"
  },
  en: {
    metaTitle: "SunoApp · GalaxyBunny Studio",
    metaDescription: "Unofficial Windows app for Suno. Custom player, mini player, equalizer, 31 languages.",
    navHome: "Home", navGithub: "GitHub", chooseLang: "Language",
    heroKicker: "SUNOAPP · 2026",
    heroTitle: "Suno, in a Windows window of your own.",
    heroLead: "Unofficial desktop app: custom player, mini player, equalizer, GalaxyBunny themes. Your session stays on the machine.",
    ctaInstall: "Download", ctaDev: "Develop",
    pillWin: "Windows", pillUnofficial: "Unofficial", pillFree: "Free & open source",
    shotHero: "Player & spectrum", shotMini: "Mini player",
    featuresTitle: "A listening studio, not just a browser",
    fPlayerT: "Custom player", fPlayerD: "Cover, progress, waveform, colors that follow the track.",
    fMiniT: "Mini player", fMiniD: "Always on top, bottom-right, with play, pause, previous, next, and volume.",
    fEqT: "10-band equalizer", fEqD: "Spectrum, reverb, echo, several sound profiles.",
    fThemeT: "Themes", fThemeD: "Night, Light, Cherry, Aurora, Glass Apple, Aero, Music.",
    fI18nT: "31 languages", fI18nD: "The app and this site speak your language.",
    fWinT: "Native Windows", fWinD: "Taskbar media controls, session kept between launches.",
    installTitle: "Windows install",
    installLead: "Download the installer from the latest release. Windows SmartScreen may warn you: the app does not have a commercial certificate yet.",
    step1: "Open the repository Releases page.",
    step2: "Download the latest .exe installer.",
    step3: "Run the installer.",
    step4: "Open SunoApp and sign in to Suno as usual.",
    devTitle: "Development", devLead: "Node.js 22 or later.",
    discTitle: "Independent project",
    discLead: "SunoApp is not affiliated with or endorsed by Suno. Brand and service belong to their owners.",
    disclaimer: "SunoApp is an independent, unofficial project. GalaxyBunny Studio / Flora Cherry.",
    footer: "GalaxyBunny Studio · Windows app for Suno"
  }
};
function add(id, t) { I18N[id] = Object.assign({}, I18N.en, t); }
add("es", { navHome: "Inicio", chooseLang: "Idioma", heroTitle: "Suno, en una ventana Windows tuya.", heroLead: "App de escritorio no oficial: reproductor propio, mini reproductor, ecualizador, temas GalaxyBunny. Tu sesión se queda en el PC.", ctaInstall: "Descargar", ctaDev: "Desarrollar", pillUnofficial: "No oficial", pillFree: "Gratis y código abierto", featuresTitle: "Un estudio de escucha, no solo un navegador", fPlayerT: "Reproductor propio", fMiniT: "Mini reproductor", fEqT: "Ecualizador de 10 bandas", fThemeT: "Temas", fI18nT: "31 idiomas", fWinT: "Windows nativo", installTitle: "Instalación en Windows", step1: "Abre la página Releases del repositorio.", step2: "Descarga el instalador .exe de la última versión.", step3: "Ejecuta el instalador.", step4: "Abre SunoApp e inicia sesión en Suno como siempre.", devTitle: "Desarrollo", discTitle: "Proyecto independiente", discLead: "SunoApp no está afiliada ni aprobada por Suno.", footer: "GalaxyBunny Studio · app Windows para Suno" });
add("pt", { navHome: "Início", chooseLang: "Idioma", heroTitle: "Suno, numa janela Windows tua.", ctaInstall: "Transferir", pillUnofficial: "Não oficial", installTitle: "Instalação no Windows", discTitle: "Projeto independente", footer: "GalaxyBunny Studio · app Windows para Suno" });
add("de", { navHome: "Start", chooseLang: "Sprache", heroTitle: "Suno, in deinem eigenen Windows-Fenster.", heroLead: "Inoffizielle Desktop-App: eigener Player, Mini-Player, Equalizer, GalaxyBunny-Themes. Die Session bleibt auf dem Rechner.", ctaInstall: "Herunterladen", ctaDev: "Entwickeln", pillUnofficial: "Inoffiziell", pillFree: "Kostenlos & Open Source", featuresTitle: "Ein Hörstudio, nicht nur ein Browser", fPlayerT: "Eigener Player", fMiniT: "Mini-Player", fEqT: "10-Band-Equalizer", fThemeT: "Themes", fI18nT: "31 Sprachen", fWinT: "Natives Windows", installTitle: "Windows-Installation", devTitle: "Entwicklung", discTitle: "Unabhängiges Projekt", footer: "GalaxyBunny Studio · Windows-App für Suno" });
add("it", { navHome: "Home", chooseLang: "Lingua", heroTitle: "Suno, in una finestra Windows tua.", ctaInstall: "Scarica", pillUnofficial: "Non ufficiale", installTitle: "Installazione Windows", discTitle: "Progetto indipendente", footer: "GalaxyBunny Studio · app Windows per Suno" });
add("ja", { navHome: "ホーム", chooseLang: "言語", heroTitle: "Suno を、自分の Windows ウィンドウで。", heroLead: "非公式デスクトップアプリ。カスタムプレーヤー、ミニプレーヤー、イコライザー、GalaxyBunny テーマ。セッションは端末に残ります。", ctaInstall: "ダウンロード", ctaDev: "開発", pillUnofficial: "非公式", pillFree: "無料・オープンソース", featuresTitle: "ブラウザ以上のリスニングスタジオ", fPlayerT: "カスタムプレーヤー", fMiniT: "ミニプレーヤー", fEqT: "10 バンドイコライザー", fThemeT: "テーマ", fI18nT: "31 言語", fWinT: "ネイティブ Windows", installTitle: "Windows インストール", devTitle: "開発", discTitle: "独立プロジェクト", footer: "GalaxyBunny Studio · Suno 向け Windows アプリ" });
add("ko", { navHome: "홈", chooseLang: "언어", heroTitle: "Suno를 나만의 Windows 창에서.", ctaInstall: "다운로드", pillUnofficial: "비공식", installTitle: "Windows 설치", discTitle: "독립 프로젝트", footer: "GalaxyBunny Studio · Suno용 Windows 앱" });
add("zh", { navHome: "首页", chooseLang: "语言", heroTitle: "把 Suno 放进属于你的 Windows 窗口。", ctaInstall: "下载", pillUnofficial: "非官方", installTitle: "Windows 安装", discTitle: "独立项目", footer: "GalaxyBunny Studio · Suno 的 Windows 应用" });
add("zh-TW", { navHome: "首頁", chooseLang: "語言", heroTitle: "把 Suno 放進屬於你的 Windows 視窗。", ctaInstall: "下載", pillUnofficial: "非官方", installTitle: "Windows 安裝", discTitle: "獨立專案", footer: "GalaxyBunny Studio · Suno 的 Windows 應用" });
add("ar", { navHome: "الرئيسية", chooseLang: "اللغة", heroTitle: "Suno في نافذة ويندوز خاصة بك.", ctaInstall: "تنزيل", pillUnofficial: "غير رسمي", installTitle: "تثبيت ويندوز", discTitle: "مشروع مستقل", footer: "GalaxyBunny Studio · تطبيق ويندوز لـ Suno" });
add("ru", { navHome: "Главная", chooseLang: "Язык", heroTitle: "Suno в вашем окне Windows.", ctaInstall: "Скачать", pillUnofficial: "Неофициально", installTitle: "Установка на Windows", discTitle: "Независимый проект", footer: "GalaxyBunny Studio · Windows-приложение для Suno" });
add("hi", { navHome: "होम", chooseLang: "भाषा", heroTitle: "Suno, आपकी अपनी Windows विंडो में.", ctaInstall: "डाउनलोड", pillUnofficial: "अनौपचारिक", footer: "GalaxyBunny Studio · Suno के लिए Windows ऐप" });
add("tr", { navHome: "Ana sayfa", chooseLang: "Dil", heroTitle: "Suno, kendi Windows pencerenizde.", ctaInstall: "İndir", pillUnofficial: "Resmi değil", installTitle: "Windows kurulumu", footer: "GalaxyBunny Studio · Suno için Windows uygulaması" });
add("pl", { navHome: "Start", chooseLang: "Język", heroTitle: "Suno w Twoim oknie Windows.", ctaInstall: "Pobierz", pillUnofficial: "Nieoficjalne", footer: "GalaxyBunny Studio · aplikacja Windows dla Suno" });
add("nl", { navHome: "Home", chooseLang: "Taal", heroTitle: "Suno, in je eigen Windows-venster.", ctaInstall: "Downloaden", pillUnofficial: "Niet officieel", footer: "GalaxyBunny Studio · Windows-app voor Suno" });
add("id", { navHome: "Beranda", chooseLang: "Bahasa", heroTitle: "Suno, di jendela Windows milikmu.", ctaInstall: "Unduh", pillUnofficial: "Tidak resmi", footer: "GalaxyBunny Studio · aplikasi Windows untuk Suno" });
add("vi", { navHome: "Trang chủ", chooseLang: "Ngôn ngữ", heroTitle: "Suno trong cửa sổ Windows của bạn.", ctaInstall: "Tải xuống", pillUnofficial: "Không chính thức", footer: "GalaxyBunny Studio · ứng dụng Windows cho Suno" });
add("th", { navHome: "หน้าแรก", chooseLang: "ภาษา", heroTitle: "Suno ในหน้าต่าง Windows ของคุณ.", ctaInstall: "ดาวน์โหลด", pillUnofficial: "ไม่เป็นทางการ", footer: "GalaxyBunny Studio · แอป Windows สำหรับ Suno" });
add("uk", { navHome: "Головна", chooseLang: "Мова", heroTitle: "Suno у вашому вікні Windows.", ctaInstall: "Завантажити", pillUnofficial: "Неофіційно", footer: "GalaxyBunny Studio · Windows-застосунок для Suno" });
add("sv", { navHome: "Hem", chooseLang: "Språk", heroTitle: "Suno i ditt eget Windows-fönster.", ctaInstall: "Ladda ner", pillUnofficial: "Inofficiell", footer: "GalaxyBunny Studio · Windows-app för Suno" });
add("cs", { navHome: "Domů", chooseLang: "Jazyk", heroTitle: "Suno ve vašem okně Windows.", ctaInstall: "Stáhnout", pillUnofficial: "Neoficiální", footer: "GalaxyBunny Studio · Windows aplikace pro Suno" });
add("ro", { navHome: "Acasă", chooseLang: "Limbă", heroTitle: "Suno, în fereastra ta Windows.", ctaInstall: "Descarcă", pillUnofficial: "Neoficial", footer: "GalaxyBunny Studio · aplicație Windows pentru Suno" });
add("el", { navHome: "Αρχική", chooseLang: "Γλώσσα", heroTitle: "Το Suno στο δικό σου παράθυρο Windows.", ctaInstall: "Λήψη", pillUnofficial: "Ανεπίσημο", footer: "GalaxyBunny Studio · εφαρμογή Windows για το Suno" });
add("hu", { navHome: "Kezdőlap", chooseLang: "Nyelv", heroTitle: "Suno a saját Windows-ablakodban.", ctaInstall: "Letöltés", pillUnofficial: "Nem hivatalos", footer: "GalaxyBunny Studio · Windows-alkalmazás Sunóhoz" });
add("fi", { navHome: "Koti", chooseLang: "Kieli", heroTitle: "Suno omassa Windows-ikkunassasi.", ctaInstall: "Lataa", pillUnofficial: "Epävirallinen", footer: "GalaxyBunny Studio · Windows-sovellus Sunolle" });
add("da", { navHome: "Hjem", chooseLang: "Sprog", heroTitle: "Suno i dit eget Windows-vindue.", ctaInstall: "Download", pillUnofficial: "Uofficiel", footer: "GalaxyBunny Studio · Windows-app til Suno" });
add("no", { navHome: "Hjem", chooseLang: "Språk", heroTitle: "Suno i ditt eget Windows-vindu.", ctaInstall: "Last ned", pillUnofficial: "Uoffisiell", footer: "GalaxyBunny Studio · Windows-app for Suno" });
add("he", { navHome: "בית", chooseLang: "שפה", heroTitle: "Suno בחלון Windows משלך.", ctaInstall: "הורדה", pillUnofficial: "לא רשמי", footer: "GalaxyBunny Studio · אפליקציית Windows ל-Suno" });
add("ca", { navHome: "Inici", chooseLang: "Llengua", heroTitle: "Suno, en una finestra Windows teva.", ctaInstall: "Descarregar", pillUnofficial: "No oficial", footer: "GalaxyBunny Studio · app Windows per a Suno" });
add("ms", { navHome: "Laman utama", chooseLang: "Bahasa", heroTitle: "Suno dalam tetingkap Windows anda.", ctaInstall: "Muat turun", pillUnofficial: "Tidak rasmi", footer: "GalaxyBunny Studio · apl Windows untuk Suno" });
add("tl", { navHome: "Home", chooseLang: "Wika", heroTitle: "Suno, sa sarili mong Windows window.", ctaInstall: "I-download", pillUnofficial: "Hindi opisyal", footer: "GalaxyBunny Studio · Windows app para sa Suno" });
window.I18N_LANGS = LANGS;
window.I18N = I18N;
if (typeof module !== "undefined") module.exports = { LANGS, I18N };
