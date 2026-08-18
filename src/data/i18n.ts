import { Language } from '../types';

export const translations = {
  ar: {
    appTitle: 'NetManager Pro',
    subTitle: 'نظام إدارة وجرد أصول الشبكة المحلية',
    version: 'الإصدار 4.12 المؤسسي',
    
    // Navigation
    navInfrastructure: 'البنية التحتية والعتاد',
    navOperations: 'العمليات والتشغيل',
    dashboard: 'لوحة المؤشرات',
    inventory: 'سجل الأصول الشامل',
    computers: 'أجهزة الكمبيوتر',
    printers: 'الطابعات والماسحات',
    network: 'أجهزة الشبكة والـ Firewall',
    servers: 'الخوادم وحدات التخزين',
topology: 'خريطة التوبولوجيا',
    security: 'سجلات الأمان والـ Syslog',
    
    // Header
    gateway: 'البوابة الرئيسية',
    uptime: 'مدة التشغيل',
    trafficInOut: 'حركة المرور (دخول/خروج)',
    criticalAlerts: 'تنبيهات حرجة',
    addNode: 'إضافة جهاز جديد',
    scanNetwork: 'فحص الشبكة الآن',
    scanning: 'جاري الفحص...',
    
    // KPI Dashboard Cards
    totalDevices: 'إجمالي أجهزة الشبكة',
    activeNodes: 'أجهزة تعمل بنشاط',
    warningNodes: 'تحذيرات صيانة',
    criticalNodes: 'أجهزة متوقفة / حرجة',
    totalRam: 'إجمالي الذاكرة المخصصة',
    avgStorageUsage: 'متوسط استهلاك التخزين',
    topOsTitle: 'أنظمة التشغيل الأكثر استخداماً',
    hardwareHealth: 'حالة سلامة العتاد',
    
    // Filters & Search
    searchPlaceholder: 'ابحث برقم الـ IP، العنوان الفيزيائي MAC، الاسم، المستخدم، أو البرنامج...',
    allStatuses: 'جميع الحالات',
    onlineOnly: 'متصل (Online)',
    issuesOnly: 'مشاكل وحرجة',
    filterByDept: 'التصفية حسب القسم',
    allDepts: 'جميع الأقسام',
    
    // Table Columns
    colStatus: 'الحالة',
    colDeviceName: 'اسم الجهاز / المضيف',
    colType: 'النوع',
    colIp: 'عنوان IP / الشبكة الفرعية /24',
    colMac: 'عنوان MAC',
    colDepartment: 'القسم / المستخدم',
    colCpuRam: 'المعالج والرام',
    colStorage: 'التخزين والقرص',
    colSerial: 'الرقم التسلسلي',
    colOs: 'نظام التشغيل',
    colActions: 'الإجراءات',
    
    // Actions & Auto IP
    btnDetails: 'تفاصيل العتاد والبرامج',
    btnDiagnose: 'تشخيص Ping',
btnConfig: 'تعديل البيانات',
    autoIpBtn: 'توليد IP تلقائي /24',
    
    // Device Detail Modal
    modalTitle: 'بطاقة جرد الجهاز التفصيلية',
    tabHardware: 'مواصفات العتاد (Hardware)',
    tabSoftware: 'البرمجيات والنظام (Software)',
    tabNetworkPing: 'الشبكة والتشخيص (Network)',
    
    // Hardware Details
    cpuModel: 'المعالج (CPU)',
    cpuCores: 'عدد الأنوية',
    ramCapacity: 'ذاكرة الوصول العشوائي (RAM)',
    storageSpecs: 'التخزين والأقراص (Storage)',
    serialNumber: 'الرقم التسلسلي (Serial No)',
    powerSupply: 'مزود الطاقة (Power Supply)',
    location: 'الموقع الجغرافي / الغرفة',
    assignedUser: 'المستخدم المسؤول / القسم',
    gpuModel: 'كرت الشاشة (GPU)',
    motherboard: 'اللوحة الأم / الطراز',
    
    // Software Details
    osName: 'نظام التشغيل (OS)',
    kernelVer: 'النواة / الإصدار',
    firmwareVer: 'البرنامج الثابت (Firmware)',
    antivirusStatus: 'برنامج الحماية (Antivirus)',
    firewallState: 'الجدار الناري المحلي',
    lastPatchDate: 'تاريخ آخر تحديث أمني',
    installedAppsTitle: 'قائمة البرمجيات والتطبيقات المثبتة',
    appName: 'اسم التطبيق',
    appVersion: 'الإصدار',
    appPublisher: 'الناشر',
    appInstallDate: 'تاريخ التثبيت',
    appLicense: 'نوع الترخيص',
    noAppsFound: 'لا توجد تطبيقات إضافية مسجلة.',
    
    // Scan
    scanTitle: 'ماسح النطاق الفرعي',
    scanSubnet: 'النطاق الفرعي',
    startScan: 'بدء الفحص',
    stopScan: 'إيقاف الفحص',
    scanResults: 'نتائج الفحص',
    discoveredHosts: 'الأجهزة المكتشفة',
    registeredHosts: 'الأجهزة المسجلة',
    importSelected: 'استيراد المحدد',
    selectAll: 'تحديد الكل',
    
    // Auth
    loginTitle: 'تسجيل الدخول',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    
    // Actions
    btnNew: 'جديد',
    btnSave: 'حفظ',
    btnCancel: 'إلغاء',
    btnDelete: 'حذف',
    btnExport: 'تصدير',
    btnImport: 'استيراد',
    btnClear: 'مسح',
    btnReset: 'إعادة ضبط',
    btnConfirm: 'تأكيد',
    
    // Status
    statusOnline: 'متصل',
    statusWarning: 'تحذير',
    statusCritical: 'حرج',
    statusOffline: 'غير متصل',
    
    // Common
    records: 'سجلات',
    of: 'من',
    noData: 'لا توجد بيانات',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    
    // Language Toggle
    langSwitch: 'English'
  },
  en: {
    appTitle: 'NetManager Pro',
    subTitle: 'Local Network Asset & Inventory System',
    version: 'v4.12 Enterprise Core',
    
    // Navigation
    navInfrastructure: 'INFRASTRUCTURE',
    navOperations: 'OPERATIONS',
    dashboard: 'KPI Dashboard',
    inventory: 'Full Asset Inventory',
    computers: 'Computers & Workstations',
    printers: 'Printers & Peripherals',
    network: 'Network & Firewalls',
    servers: 'Servers & Storage',
    topology: 'Topology Map',
    security: 'Security Syslogs',
    
    // Header
    gateway: 'Gateway',
    uptime: 'Uptime',
    trafficInOut: 'Traffic In/Out',
    criticalAlerts: 'CRITICAL ALERTS',
    addNode: 'ADD NODE',
    scanNetwork: 'SCAN NETWORK',
    scanning: 'SCANNING...',
    
    // KPI Dashboard Cards
    totalDevices: 'Total Managed Devices',
    activeNodes: 'Active Online Nodes',
    warningNodes: 'Maintenance Warnings',
    criticalNodes: 'Offline / Critical Nodes',
    totalRam: 'Total Provisioned RAM',
    avgStorageUsage: 'Avg Disk Usage',
    topOsTitle: 'Operating System Distribution',
    hardwareHealth: 'Hardware Integrity & Health',
    
    // Filters & Search
    searchPlaceholder: 'Search IP, MAC, Hostname, Serial, User, or App Name...',
    allStatuses: 'All Statuses',
    onlineOnly: 'Online Only',
    issuesOnly: 'Issues & Warnings',
    filterByDept: 'Filter by Department',
    allDepts: 'All Departments',
    
    // Table Columns
    colStatus: 'STATUS',
    colDeviceName: 'DEVICE NAME',
    colType: 'TYPE',
    colIp: 'IP ADDRESS /24 SUBNET',
    colMac: 'MAC ADDRESS',
    colDepartment: 'DEPARTMENT / USER',
    colCpuRam: 'CPU & RAM',
    colStorage: 'STORAGE / DISK',
    colSerial: 'SERIAL NUMBER',
    colOs: 'OPERATING SYSTEM',
    colActions: 'ACTIONS',
    
    // Actions & Auto IP
    btnDetails: 'DETAILS',
    btnDiagnose: 'PING',
    btnConfig: 'EDIT',
    autoIpBtn: 'AUTO IP /24',
    
    // Device Detail Modal
    modalTitle: 'Device Inventory Card & Specifications',
    tabHardware: 'Hardware Specs',
    tabSoftware: 'Software & OS',
    tabNetworkPing: 'Network Diagnostics',
    
    // Hardware Details
    cpuModel: 'Processor (CPU)',
    cpuCores: 'CPU Cores',
    ramCapacity: 'System RAM',
    storageSpecs: 'Disk Storage',
    serialNumber: 'Serial Number',
    powerSupply: 'Power Supply',
    location: 'Physical Location',
    assignedUser: 'Assigned User / Department',
    gpuModel: 'Graphics (GPU)',
    motherboard: 'Motherboard / Model',
    
    // Software Details
    osName: 'Operating System',
    kernelVer: 'Kernel / Build',
    firmwareVer: 'Firmware Version',
    antivirusStatus: 'Antivirus Agent',
    firewallState: 'Local Firewall',
    lastPatchDate: 'Last Security Patch',
    installedAppsTitle: 'Installed Software Inventory',
    appName: 'Application Name',
    appVersion: 'Version',
    appPublisher: 'Publisher',
    appInstallDate: 'Install Date',
    appLicense: 'License',
    noAppsFound: 'No extra registered software applications.',
    
    // Scan
    scanTitle: 'Subnet Scanner',
    scanSubnet: 'Subnet Range',
    startScan: 'Start Scan',
    stopScan: 'Stop Scan',
    scanResults: 'Scan Results',
    discoveredHosts: 'Discovered Hosts',
    registeredHosts: 'Registered Hosts',
    importSelected: 'Import Selected',
    selectAll: 'Select All',
    
    // Auth
    loginTitle: 'Sign In',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    
    // Actions
    btnNew: 'New',
    btnSave: 'Save',
    btnCancel: 'Cancel',
    btnDelete: 'Delete',
    btnExport: 'Export',
    btnImport: 'Import',
    btnClear: 'Clear',
    btnReset: 'Reset',
    btnConfirm: 'Confirm',
    
    // Status
    statusOnline: 'Online',
    statusWarning: 'Warning',
    statusCritical: 'Critical',
    statusOffline: 'Offline',
    
    // Common
    records: 'records',
    of: 'of',
    noData: 'No data available',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirmDelete: 'Are you sure you want to delete?',
    
    // Language Toggle
    langSwitch: 'Français'
  },
  fr: {
    appTitle: 'NetManager Pro',
    subTitle: 'Système d\'Inventaire et Gestion des Équipements Réseau',
    version: 'v4.12 Enterprise Core',
    
    // Navigation
    navInfrastructure: 'INFRASTRUCTURE & MATÉRIEL',
    navOperations: 'OPÉRATIONS & SYSTÈME',
    dashboard: 'Tableau de Bord KPI',
    inventory: 'Inventaire Complet',
    computers: 'Ordinateurs & PC (Workstations)',
    printers: 'Imprimantes & Périphériques',
    network: 'Équipements Réseau & Firewall',
    servers: 'Serveurs & Stockage NAS',
    topology: 'Carte de Topologie',
    security: 'Journaux Sécurité & Syslog',
    
    // Header
    gateway: 'Passerelle',
    uptime: 'Temps d\'activité',
    trafficInOut: 'Trafic Entrant/Sortant',
    criticalAlerts: 'ALERTES CRITIQUES',
    addNode: 'AJOUTER UN PC / NŒUD',
    scanNetwork: 'SCANNER LE RÉSEAU',
    scanning: 'ANALYSE EN COURS...',
    
    // KPI Dashboard Cards
    totalDevices: 'Total Équipements Gérés',
    activeNodes: 'Nœuds Actifs en Ligne',
    warningNodes: 'Avertissements Maintenance',
    criticalNodes: 'Équipements Hors Ligne / Critiques',
    totalRam: 'Mémoire RAM Totale Allouée',
    avgStorageUsage: 'Utilisation Moyenne Disque',
    topOsTitle: 'Répartition des Systèmes d\'Exploitation',
    hardwareHealth: 'Intégrité du Matériel',
    
    // Filters & Search
    searchPlaceholder: 'Rechercher IP /24, MAC, Nom, N° Série, Utilisateur ou App...',
    allStatuses: 'Tous les Statuts',
    onlineOnly: 'En Ligne Uniquement',
    issuesOnly: 'Problèmes & Alertes',
    filterByDept: 'Filtrer par Département',
    allDepts: 'Tous les Départements',
    
    // Table Columns
    colStatus: 'STATUT',
    colDeviceName: 'NOM DU PC / ÉQUIPEMENT',
    colType: 'TYPE',
    colIp: 'ADRESSE IP /24',
    colMac: 'ADRESSE MAC',
    colDepartment: 'DÉPARTEMENT / UTILISATEUR',
    colCpuRam: 'PROCESSEUR (CPU) & RAM',
    colStorage: 'STOCKAGE / DISQUE',
    colSerial: 'N° DE SÉRIE',
    colOs: 'SYSTÈME D\'EXPLOITATION',
    colActions: 'ACTIONS',
    
    // Actions & Auto IP
    btnDetails: 'DÉTAILS',
    btnDiagnose: 'PING',
    btnConfig: 'ÉDITER',
    autoIpBtn: 'IP AUTO /24',
    
    // Device Detail Modal
    modalTitle: 'Fiche d\'Inventaire Détaillée de l\'Équipement',
    tabHardware: 'Spécifications Matérielles',
    tabSoftware: 'Logiciels & Système',
    tabNetworkPing: 'Diagnostics Réseau / Ping',
    
    // Hardware Details
    cpuModel: 'Processeur (CPU)',
    cpuCores: 'Cœurs CPU',
    ramCapacity: 'Mémoire RAM',
    storageSpecs: 'Stockage & Disques',
    serialNumber: 'Numéro de Série',
    powerSupply: 'Bloc d\'Alimentation',
    location: 'Emplacement / Local',
    assignedUser: 'Utilisateur Assigné / Dept',
    gpuModel: 'Carte Graphique (GPU)',
    motherboard: 'Carte Mère / Modèle',
    
    // Software Details
    osName: 'Système d\'Exploitation',
    kernelVer: 'Noyau / Build',
    firmwareVer: 'Version Firmware',
    antivirusStatus: 'Agent Antivirus',
    firewallState: 'Pare-feu Local',
    lastPatchDate: 'Dernier Patch Sécurité',
    installedAppsTitle: 'Inventaire des Logiciels Installés',
    appName: 'Nom de l\'Application',
    appVersion: 'Version',
    appPublisher: 'Éditeur',
    appInstallDate: 'Date d\'Installation',
    appLicense: 'Licence',
    noAppsFound: 'Aucun logiciel supplémentaire enregistré.',
    
    // Scan
    scanTitle: 'Scanner de Sous-Réseau',
    scanSubnet: 'Plage de Sous-Réseau',
    startScan: 'Lancer le Scan',
    stopScan: 'Arrêter le Scan',
    scanResults: 'Résultats du Scan',
    discoveredHosts: 'Hôtes Découverts',
    registeredHosts: 'Hôtes Enregistrés',
    importSelected: 'Importer la Sélection',
    selectAll: 'Tout Sélectionner',
    
    // Auth
    loginTitle: 'Connexion',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    signIn: 'Se connecter',
    signOut: 'Se déconnecter',
    
    // Actions
    btnNew: 'Nouveau',
    btnSave: 'Enregistrer',
    btnCancel: 'Annuler',
    btnDelete: 'Supprimer',
    btnExport: 'Exporter',
    btnImport: 'Importer',
    btnClear: 'Vider',
    btnReset: 'Réinitialiser',
    btnConfirm: 'Confirmer',
    
    // Status
    statusOnline: 'En ligne',
    statusWarning: 'Avertissement',
    statusCritical: 'Critique',
    statusOffline: 'Hors ligne',
    
    // Common
    records: 'enregistrements',
    of: 'sur',
    noData: 'Aucune donnée disponible',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ?',
    
    // Language Toggle
    langSwitch: 'العربية'
  }
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}
