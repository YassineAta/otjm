'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export type Lang = 'fr' | 'ar'

const fr = {
  skipLink: 'Aller au contenu principal',
  nav: {
    home: 'Accueil',
    news: 'Actualités',
    archives: 'Archives',
    membership: 'Adhésion',
  },
  header: {
    newsletter: 'Newsletter',
    join: 'Adhérer →',
    joinFull: "Adhérer à l'OTJM →",
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
    langToggle: 'عربي',
    menuLabel: 'Menu',
  },
  footer: {
    tagline: "L'Organisation Tunisienne des Jeunes Médecins défend les droits des internes, résidents et médecins débutants en Tunisie.",
    navigation: 'Navigation',
    contact: 'Contact',
    address: 'Apt A 32, 3e étage, Bardo Palace, 2000 Bardo',
    press: 'Presse',
    pressDesc: 'Pour les demandes médias et communiqués officiels, contactez notre service presse.',
    copyright: '© 2025–2026 OTJM — Organisation Tunisienne des Jeunes Médecins',
    rights: 'Tous droits réservés',
    privacy: 'Politique de confidentialité',
  },
  categories: {
    protests: 'Protestation',
    statements: 'Déclaration',
    announcements: 'Annonce',
    updates: 'Mise à jour',
    documents: 'Document',
    general: 'Général',
  },
  news: {
    eyebrow: 'OTJM — Communiqués & actualités',
    title: 'Actualités',
    subtitle: "Communiqués officiels, protestations, déclarations et annonces de l'Organisation Tunisienne des Jeunes Médecins.",
    filterAll: 'Tout',
    filterSuffix: 's',
    searchPlaceholder: 'Rechercher...',
    loading: 'Chargement...',
    error: 'Impossible de charger les actualités.',
    retry: 'Réessayer',
    noResults: 'Aucun résultat',
    noResultsHint: 'Essayez un autre filtre ou terme de recherche.',
    readArticle: "Lire l'article",
    source: 'Voir la source',
    count: (n: number) => `${n} article${n > 1 ? 's' : ''} trouvé${n > 1 ? 's' : ''}`,
  },
  archives: {
    eyebrow: 'OTJM — Documents & historique',
    title: 'Archives',
    subtitle: "L'ensemble des documents historiques, rapports et communiqués officiels de l'OTJM depuis sa création.",
    filterAll: 'Tout',
    allYears: 'Toutes les années',
    older: 'Plus ancien',
    searchPlaceholder: 'Rechercher dans les archives...',
    loading: 'Chargement...',
    error: 'Impossible de charger les archives.',
    retry: 'Réessayer',
    noResults: 'Aucun résultat',
    noResultsHint: 'Essayez un autre filtre ou terme de recherche.',
    document: 'Voir le document',
    count: (n: number) => `${n} archive${n > 1 ? 's' : ''} trouvée${n > 1 ? 's' : ''}`,
  },
  membership: {
    eyebrow: 'Campagne 2025–2026',
    title: 'Rejoignez',
    titleAccent: 'le mouvement.',
    subtitle: "Votre adhésion n'est pas une cotisation. C'est un acte de solidarité professionnelle — un engagement pour des conditions de travail dignes pour tous les jeunes médecins de Tunisie.",
    stats: ['1 200+ membres actifs', '12 gouvernorats', 'Campagne active 2025'],
    stepsLabel: 'Comment adhérer',
    stepsTitle: '3 étapes simples',
    nextStep: 'Étape suivante',
    steps: [
      {
        num: '01',
        title: 'Inscription et paiement',
        desc: "Choisissez votre tarif ci-dessous, remplissez le formulaire et payez en ligne via Flouci (carte ou wallet). Moins de 3 minutes.",
        action: undefined as { label: string; href: string } | undefined,
      },
      {
        num: '02',
        title: 'Confirmation',
        desc: "Dès le paiement confirmé, votre adhésion est activée automatiquement et vous recevez un email de confirmation.",
        action: undefined as { label: string; href: string } | undefined,
      },
      {
        num: '03',
        title: 'Retrait de votre carte',
        desc: "Retirez votre carte membre officielle aux stands OTJM dans votre faculté. Le calendrier de distribution est publié sur nos réseaux sociaux.",
        action: undefined as { label: string; href: string } | undefined,
      },
    ],
    pricingLabel: 'Tarifs',
    pricingTitle: 'Choisissez votre statut',
    perYear: '/an',
    popular: 'Plus populaire',
    register: "S'inscrire",
    tiers: [
      {
        role: 'Externe',
        price: '10',
        description: 'Étudiant en médecine (cycle externe)',
        bullets: ['Carte membre officielle', 'Accès aux avantages partenaires', 'Représentation nationale'],
        isPopular: false,
      },
      {
        role: 'Interne / Résident',
        price: '20',
        description: 'Interne hospitalier ou résident en spécialisation',
        bullets: ['Carte membre officielle', 'Accès aux avantages partenaires', 'Représentation nationale'],
        isPopular: true,
      },
    ],
    faqLabel: 'FAQ',
    faqTitle: 'Questions fréquentes',
    faq: [
      {
        q: "Qui peut adhérer à l'OTJM ?",
        a: "Tout étudiant en médecine (externe), interne hospitalier, ou résident en spécialisation inscrit dans un établissement tunisien peut adhérer à l'OTJM.",
      },
      {
        q: "L'adhésion est-elle valable toute l'année ?",
        a: "Oui. L'adhésion est valable pour l'année universitaire 2025–2026 (du moment de l'inscription jusqu'au 31 juillet 2026).",
      },
      {
        q: "Que se passe-t-il si je change de statut (externe → interne) en cours d'année ?",
        a: "Vous conservez votre carte membre de l'année en cours. Lors du renouvellement, vous payez le tarif correspondant à votre nouveau statut.",
      },
      {
        q: 'Comment retirer ma carte membre ?',
        a: "Des stands de distribution sont organisés dans chaque faculté de médecine. Le calendrier est publié sur les pages Facebook et Instagram de l'OTJM.",
      },
    ],
    ctaTitle: 'Prêt à rejoindre le mouvement ?',
    ctaDesc: 'Chaque adhésion renforce notre capacité de négociation. Rejoignez les 1 200+ membres actifs.',
    ctaBtn: 'Adhérer maintenant',
  },
  home: {
    eyebrow: 'Organisation Tunisienne des Jeunes Médecins',
    headlineNormal: 'Médecins au service ',
    headlineAccent: 'du peuple et de la patrie',
    headlineDot: '.',
    heroDesc: "L'OTJM représente et défend les droits des internes, résidents et médecins débutants en Tunisie.",
    latestNews: 'Dernières actualités',
    joinOtjm: "Adhérer à l'OTJM",
    statLabels: ['membres actifs', 'gouvernorats', 'Campagne active'],
    newsSectionLabel: 'Actualités',
    newsSectionTitle: 'Dernières nouvelles',
    viewArchives: 'Voir les archives',
    filterAll: 'Tout',
    noFilter: 'Aucun résultat pour ce filtre.',
    moreRecent: 'Plus récents',
    readArticle: 'Lire',
    liveLabel: 'En cours',
    ctaBannerLabel: 'Adhésions ouvertes',
    ctaBannerTitle: 'Votre voix compte.',
    ctaBannerTitle2: "Rejoignez l'OTJM.",
    ctaBannerDesc: 'Plus nous sommes nombreux, plus notre force de négociation est grande.',
    ctaJoinNow: 'Adhérer maintenant →',
    membershipLabel: 'Adhésion 2025–2026',
    membershipTitle: 'Rejoignez le mouvement.',
    membershipDesc: "Votre adhésion n'est pas une cotisation. C'est un acte de solidarité professionnelle.",
    howToJoin: 'Comment adhérer',
    nextStep: 'Étape suivante',
    perYear: '/an',
    mostPopular: 'Plus populaire',
    joinTier: 'Adhérer',
    footerNavTitle: 'Navigation',
    footerContactTitle: 'Contact',
    footerOrgDesc: "L'Organisation Tunisienne des Jeunes Médecins défend les droits des internes, résidents et médecins débutants.",
    footerPress: 'Presse',
    footerPressDesc: 'Pour les demandes médias, contactez notre service presse.',
    footerCopyright: '© 2025–2026 OTJM — Organisation Tunisienne des Jeunes Médecins',
    footerRights: 'Tous droits réservés',
    viewSource: 'Voir la source',
    newsletterTitle: 'Restez informé',
    newsletterDesc: "Recevez les communiqués de l'OTJM dans votre boîte mail.",
    firstNameLabel: 'Prénom *',
    lastNameLabel: 'Nom *',
    emailLabel: 'Email *',
    statusLabel: 'Statut',
    selectStatus: 'Sélectionner',
    statuses: ['Externe', 'Interne', 'Résident', 'Médecin (service civil)', 'Presse / Citoyen'],
    subscribing: 'Inscription...',
    subscribe: "S'inscrire",
    noSpam: 'Pas de spam. Désabonnement à tout moment.',
    successTitle: 'Bienvenue dans le mouvement',
    successDesc: 'Vous recevrez bientôt nos communiqués.',
    close: 'Fermer',
    archivesLink: 'Archives',
    menuLabel: 'Menu',
    darkMode: 'Mode sombre',
    lightMode: 'Mode clair',
    newsletterConsentPre: "J'accepte la ",
    newsletterConsentLink: 'politique de confidentialité',
    newsletterConsentPost: " et consens au traitement de mon adresse email par l'OTJM.",
  },
}

const ar: typeof fr = {
  skipLink: 'انتقل إلى المحتوى الرئيسي',
  nav: {
    home: 'الرئيسية',
    news: 'الأخبار',
    archives: 'الأرشيف',
    membership: 'الانخراط',
  },
  header: {
    newsletter: 'النشرة البريدية',
    join: 'انخرط ←',
    joinFull: 'انخرط في OTJM ←',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    langToggle: 'Français',
    menuLabel: 'القائمة',
  },
  footer: {
    tagline: 'المنظمة التونسية للأطباء الشبان تدافع عن حقوق المتدربين والمقيمين والأطباء الناشئين في تونس.',
    navigation: 'التنقل',
    contact: 'التواصل',
    address: 'شقة A 32، الطابق الثالث، قصر باردو، 2000 باردو',
    press: 'الإعلام',
    pressDesc: 'للطلبات الإعلامية والبيانات الرسمية، تواصل مع مكتب الإعلام لدينا.',
    copyright: '© 2025–2026 OTJM — المنظمة التونسية للأطباء الشبان',
    rights: 'جميع الحقوق محفوظة',
    privacy: 'سياسة الخصوصية',
  },
  categories: {
    protests: 'احتجاج',
    statements: 'بيان',
    announcements: 'إعلان',
    updates: 'تحديث',
    documents: 'وثيقة',
    general: 'عام',
  },
  news: {
    eyebrow: 'OTJM — بيانات وأخبار',
    title: 'الأخبار',
    subtitle: 'البيانات الرسمية والاحتجاجات والإعلانات الصادرة عن المنظمة التونسية للأطباء الشبان.',
    filterAll: 'الكل',
    filterSuffix: '',
    searchPlaceholder: 'بحث...',
    loading: 'جاري التحميل...',
    error: 'تعذر تحميل الأخبار.',
    retry: 'إعادة المحاولة',
    noResults: 'لا توجد نتائج',
    noResultsHint: 'جرّب فلترًا أو كلمة بحث أخرى.',
    readArticle: 'قراءة المقال',
    source: 'عرض المصدر',
    count: (n: number) => `${n} مقال`,
  },
  archives: {
    eyebrow: 'OTJM — وثائق وتاريخ',
    title: 'الأرشيف',
    subtitle: 'جميع الوثائق التاريخية والتقارير والبيانات الرسمية لـ OTJM منذ تأسيسها.',
    filterAll: 'الكل',
    allYears: 'كل السنوات',
    older: 'أقدم',
    searchPlaceholder: 'بحث في الأرشيف...',
    loading: 'جاري التحميل...',
    error: 'تعذر تحميل الأرشيف.',
    retry: 'إعادة المحاولة',
    noResults: 'لا توجد نتائج',
    noResultsHint: 'جرّب فلترًا أو كلمة بحث أخرى.',
    document: 'عرض الوثيقة',
    count: (n: number) => `${n} وثيقة`,
  },
  membership: {
    eyebrow: 'حملة 2025–2026',
    title: 'انخرط',
    titleAccent: 'في الحركة.',
    subtitle: 'انخراطك ليس مجرد اشتراك. إنه فعل تضامن مهني — التزام من أجل ظروف عمل كريمة لجميع الأطباء الشبان في تونس.',
    stats: ['أكثر من 1200 عضو نشط', '12 ولاية', 'حملة نشطة 2025'],
    stepsLabel: 'كيفية الانخراط',
    stepsTitle: '3 خطوات بسيطة',
    nextStep: 'الخطوة التالية',
    steps: [
      {
        num: '01',
        title: 'التسجيل والدفع',
        desc: 'اختر فئتك أدناه، أملأ النموذج وادفع مباشرة عبر Flouci (بطاقة أو محفظة). أقل من 3 دقائق.',
        action: undefined as { label: string; href: string } | undefined,
      },
      {
        num: '02',
        title: 'التأكيد',
        desc: 'بمجرد تأكيد الدفع، يتم تفعيل عضويتك تلقائياً وستتلقى رسالة تأكيد عبر البريد الإلكتروني.',
        action: undefined as { label: string; href: string } | undefined,
      },
      {
        num: '03',
        title: 'استلام بطاقتك',
        desc: 'استلم بطاقة عضويتك الرسمية من أكشاك OTJM في كليتك. يُنشر جدول التوزيع على شبكاتنا الاجتماعية.',
        action: undefined as { label: string; href: string } | undefined,
      },
    ],
    pricingLabel: 'الأسعار',
    pricingTitle: 'اختر وضعك',
    perYear: '/سنة',
    popular: 'الأكثر شعبية',
    register: 'التسجيل',
    tiers: [
      {
        role: 'الطالب الخارجي',
        price: '10',
        description: 'طالب طب (دور خارجي)',
        bullets: ['بطاقة عضوية رسمية', 'الوصول إلى مزايا الشركاء', 'تمثيل وطني'],
        isPopular: false,
      },
      {
        role: 'مقيم داخلي / متخصص',
        price: '20',
        description: 'مقيم داخلي أو متخصص في التدريب',
        bullets: ['بطاقة عضوية رسمية', 'الوصول إلى مزايا الشركاء', 'تمثيل وطني'],
        isPopular: true,
      },
    ],
    faqLabel: 'الأسئلة الشائعة',
    faqTitle: 'أسئلة متكررة',
    faq: [
      {
        q: 'من يمكنه الانخراط في OTJM؟',
        a: 'يمكن لأي طالب طب (دور خارجي) أو مقيم داخلي أو متخصص في التدريب مسجل في مؤسسة تونسية الانخراط في OTJM.',
      },
      {
        q: 'هل الانخراط صالح طوال العام؟',
        a: 'نعم. الانخراط صالح للسنة الجامعية 2025–2026 (من لحظة التسجيل حتى 31 يوليو 2026).',
      },
      {
        q: 'ماذا يحدث إذا تغير وضعي (من خارجي إلى داخلي) خلال العام؟',
        a: 'تحتفظ ببطاقة العضوية الخاصة بك للعام الحالي. عند التجديد، تدفع السعر المقابل لوضعك الجديد.',
      },
      {
        q: 'كيف أستلم بطاقة العضوية؟',
        a: 'تُنظَّم أكشاك توزيع في كل كلية طب. يُنشر الجدول على صفحتي OTJM على Facebook وInstagram.',
      },
    ],
    ctaTitle: 'مستعد للانخراط في الحركة؟',
    ctaDesc: 'كل انخراط يعزز قدرتنا التفاوضية. انخرط في صفوف أكثر من 1200 عضو نشط.',
    ctaBtn: 'انخرط الآن',
  },
  home: {
    eyebrow: 'المنظمة التونسية للأطباء الشبان',
    headlineNormal: 'أطباء في خدمة ',
    headlineAccent: 'الشعب و الوطن',
    headlineDot: '.',
    heroDesc: 'المنظمة التونسية للأطباء الشبان تمثّل وتدافع عن حقوق المقيمين والمتربصين والأطباء الناشئين في تونس.',
    latestNews: 'آخر الأخبار',
    joinOtjm: 'انخرط في المنظمة',
    statLabels: ['عضو نشط', 'ولاية', 'حملة نشطة'],
    newsSectionLabel: 'أخبار',
    newsSectionTitle: 'آخر المستجدات',
    viewArchives: 'عرض الأرشيف',
    filterAll: 'الكل',
    noFilter: 'لا توجد نتائج لهذا الفلتر.',
    moreRecent: 'الأحدث',
    readArticle: 'اقرأ',
    liveLabel: 'جارٍ الآن',
    ctaBannerLabel: 'الاشتراكات مفتوحة',
    ctaBannerTitle: 'صوتك مهم.',
    ctaBannerTitle2: 'انخرط في المنظمة.',
    ctaBannerDesc: 'كلما كنا أكثر، كانت قوتنا التفاوضية أكبر.',
    ctaJoinNow: 'انخرط الآن →',
    membershipLabel: 'الانخراط 2025–2026',
    membershipTitle: 'انخرط في الحركة.',
    membershipDesc: 'انخراطك ليس مجرد اشتراك. إنه فعل تضامن مهني.',
    howToJoin: 'كيفية الانخراط',
    nextStep: 'الخطوة التالية',
    perYear: '/سنة',
    mostPopular: 'الأكثر شعبية',
    joinTier: 'انخرط',
    footerNavTitle: 'التنقل',
    footerContactTitle: 'التواصل',
    footerOrgDesc: 'المنظمة التونسية للأطباء الشبان تدافع عن حقوق المتدربين والمقيمين والأطباء الناشئين في تونس.',
    footerPress: 'الإعلام',
    footerPressDesc: 'للطلبات الإعلامية، تواصل مع مكتب الإعلام.',
    footerCopyright: '© 2025–2026 OTJM — المنظمة التونسية للأطباء الشبان',
    footerRights: 'جميع الحقوق محفوظة',
    viewSource: 'عرض المصدر',
    newsletterTitle: 'ابقَ على اطلاع',
    newsletterDesc: 'احصل على بيانات المنظمة في صندوق بريدك.',
    firstNameLabel: 'الاسم الأول *',
    lastNameLabel: 'اللقب *',
    emailLabel: 'البريد الإلكتروني *',
    statusLabel: 'الوضع المهني',
    selectStatus: 'اختر',
    statuses: ['طالب خارجي', 'مقيم داخلي', 'متخصص', 'طبيب (خدمة مدنية)', 'إعلام / مواطن'],
    subscribing: 'جارٍ التسجيل...',
    subscribe: 'اشترك',
    noSpam: 'لا رسائل مزعجة. إلغاء الاشتراك في أي وقت.',
    successTitle: 'مرحباً بك في الحركة',
    successDesc: 'ستصل إليك بياناتنا قريباً.',
    close: 'إغلاق',
    archivesLink: 'الأرشيف',
    menuLabel: 'القائمة',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    newsletterConsentPre: 'أوافق على ',
    newsletterConsentLink: 'سياسة الخصوصية',
    newsletterConsentPost: ' وأوافق على معالجة بريدي الإلكتروني من قِبَل OTJM.',
  },
}

export type Translations = typeof fr

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  t: fr,
})

// Strip the optional /ar locale prefix off a pathname, yielding the
// default-locale (French) path. '/ar' and '/ar/news' → '/' and '/news'.
function stripLocale(pathname: string): string {
  if (pathname === '/ar' || pathname.startsWith('/ar/')) return pathname.slice(3) || '/'
  return pathname
}

// Prefix an internal href with /ar when the active language is Arabic.
// External/anchor hrefs and already-prefixed paths are left untouched.
export function localeHref(href: string, lang: Lang): string {
  if (lang !== 'ar' || !href.startsWith('/') || href.startsWith('/ar/') || href === '/ar') return href
  return href === '/' ? '/ar' : '/ar' + href
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  // The URL is the single source of truth for language: /ar/* → Arabic,
  // everything else → French. This resolves identically on the server and the
  // client, so the initial HTML is already in the right language for crawlers.
  const lang: Lang = pathname === '/ar' || pathname.startsWith('/ar/') ? 'ar' : 'fr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  // Switching language = navigating to the same page in the other locale.
  const setLang = (l: Lang) => {
    if (l === lang) return
    const base = stripLocale(pathname)
    router.push(l === 'ar' ? localeHref(base, 'ar') : base)
  }

  const t = lang === 'ar' ? ar : fr

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
