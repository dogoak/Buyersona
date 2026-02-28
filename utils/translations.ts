import { Language } from "../types";

export const translations = {
  en: {
    hero: {
      title: "Who should I sell to?",
      subtitle: "Where do I find them? And how do I scale without breaking?",
      description: "Most businesses don't fail because of their product. They fail because they don't know their real customer.",
      cta_start: "Start Analysis",
      cta_login: "Login",
      footer: "AI-Powered Growth Strategy",
      time_to_value: "Get a complete strategic roadmap in less than 10 minutes."
    },
    auth: {
      login_title: "Welcome back",
      register_title: "Create your account",
      email: "Email address",
      password: "Password",
      submit_login: "Sign In",
      submit_register: "Start Free",
      switch_to_register: "Don't have an account? Sign up",
      switch_to_login: "Already have an account? Sign in",
      mock_notice: "Mock Mode: Enter any email/password"
    },
    onboarding: {
      title: "Let's build your Growth Model",
      subtitle: "We need to understand your identity, economics, and operations.",
      back: "Back",
      next: "Next",
      finish: "Generate Strategy",
      steps: {
        identity: "Identity",
        product: "Product",
        revenue: "Revenue",
        acquisition: "Acquisition",
        operations: "Operations",
        pain: "Pain Points",
        ambition: "Ambition",
        context: "Context"
      },
      questions: {
        q_name: "What is your company name?",
        q_geo: "Where do you sell? (Be specific: City, Country)",
        q_currency: "Main currency?",
        q_type: "What is your business? (Select all that apply)",
        q_type_other: "Describe your business type:",
        q_dist_model: "Distribution Model (Identity)",
        q_offering: "What do you primarily sell?",
        q_diff: "How is your product positioned?",
        
        // Product Step
        q_what_sell: "What do you sell?",
        q_what_sell_hint: "Describe it in one specific sentence (e.g., 'Inventory software for SMEs').",
        q_target_scope: "Who is this product for?",
        
        // B2B Specifics
        q_b2b_use: "How does the client use it?",
        q_b2b_role: "Who usually buys it? (Select all)",
        q_b2b_problem: "Main Problem Solved for COMPANIES", // NEW
        q_b2b_driver: "Why do COMPANIES buy it? (Drivers)", // NEW

        // B2C Specifics
        q_b2c_context: "When/Why do they buy it? (Select all)",
        q_b2c_channel: "Natural Discovery Channel",
        q_b2c_problem: "Main Problem Solved for CONSUMERS", // NEW
        q_b2c_driver: "Why do CONSUMERS buy it? (Drivers)", // NEW

        q_problem_other: "Describe the specific problem...",
        q_driver_other: "Other driver...",

        q_secondary_benefits: "What other benefits do you provide?",
        q_inaction: "What happens if they DON'T use it?",
        q_inaction_hint: "e.g., They lose money, they get fined, they waste time.",
        
        q_market_pos: "Market Positioning",
        q_price_rel: "How expensive is it for the client?",
        q_freq: "Is it used every day?",

        q_target: "Who do you bill today?",
        q_payment_model: "How does a customer normally pay you?",
        q_transaction_value: "Typical Transaction Value",
        q_transaction_hint: "Is this per unit or average ticket?",
        q_transaction_custom: "Enter specific value:",
        q_ltv: "Lifetime Value (LTV)",
        q_cycle: "Sales Cycle Duration",
        
        // Channels
        q_sales_channels: "Where does the transaction happen? (Sales)",
        q_channels: "How do they find you? (Marketing)",
        q_channel_other: "Other Channel:",
        q_best_channel: "Which channel brings the BEST clients (Quality)?",
        q_best_client_channel: "Which channel brought your SINGLE best client ever?",
        q_vol_channel: "Which channel brings the MOST clients (Volume)?",
        
        q_ad_spend: "Monthly Ad Budget (Estimate)",
        q_ad_spend_custom: "Enter specific budget:",
        
        q_prospecting: "Where SHOULD we find new clients? (Perception)",
        q_prospecting_other: "Other source...",
        q_prospecting_output: "What do you want to receive? (Select all)",
        q_explore_secondary: "Do you want to explore a secondary market?", 
        
        q_predictability: "Is your lead flow predictable?",
        q_response: "What happens when someone asks for info?",
        q_team: "How many people handle sales/leads?",
        q_capacity: "How many leads can you handle per day?",
        q_capacity_channel: "Through which channel?",
        q_support_readiness: "Can you handle the new segment (e.g. B2C support)?",
        q_response_sla: "How fast do you respond to a lead?",
        q_automation: "What tools do you use?",
        q_surge: "What happens if 100 leads enter tomorrow?",
        q_pain: "What frustrates you the most?",
        q_risk: "What happens to your BUSINESS if this isn't solved?",
        q_goal: "What is your main goal right now?",
        q_pace: "How do you prefer to grow?",
      },
      options: {
        // Geo
        local: "Local / City",
        national: "National",
        global: "International",
        // Type
        factory: "Factory / Producer",
        brand: "Brand / Label",
        distributor: "Distributor / Retail",
        service: "Service Provider",
        software: "Software / SaaS",
        other: "Other",

        // Distribution
        dist_b2c: "Retail (B2C)",
        dist_b2b: "Wholesale (B2B)",
        dist_both: "Both / Hybrid",

        // Target Scope
        scope_b2b: "Business (B2B)",
        scope_b2c: "Consumer (B2C)",
        scope_both: "Both Markets",

        // B2B Use Cases
        b2b_use_resale: "Resale / Revenue Gen",
        b2b_use_input: "Raw Material / Input",
        b2b_use_ops: "Operations / Efficiency",
        b2b_use_gift: "Corporate Gift / HR",

        b2b_role_owner: "Owner / CEO",
        b2b_role_procurement: "Procurement Dept",
        b2b_role_ops: "Operations Manager",
        b2b_role_marketing: "Marketing / Sales",

        // B2B Problems
        b2b_prob_revenue: "Increase Revenue/Sales",
        b2b_prob_cost: "Reduce Costs",
        b2b_prob_risk: "Reduce Risk/Compliance",
        b2b_prob_efficiency: "Save Time/Efficiency",
        b2b_prob_resale: "Product for Resale",
        
        // B2B Drivers
        b2b_driver_margin: "Profit Margin / ROI",
        b2b_driver_reliability: "Reliability / Trust",
        b2b_driver_speed: "Speed / Availability",
        b2b_driver_relationship: "Relationship / Service",

        // B2C Context
        b2c_ctx_daily: "Daily Necessity",
        b2c_ctx_event: "Occasion / Event",
        b2c_ctx_gift: "Gift for others",
        b2c_ctx_status: "Status / Treat",

        // B2C Problems
        b2c_prob_need: "Solve a Functional Need",
        b2c_prob_pleasure: "Entertainment / Pleasure",
        b2c_prob_health: "Health / Wellbeing",
        b2c_prob_status: "Social Status / Image",
        b2c_prob_convenience: "Convenience / Ease",
        
        // B2C Drivers
        b2c_driver_price: "Price / Deal",
        b2c_driver_brand: "Brand / Love",
        b2c_driver_convenience: "Convenience",
        b2c_driver_review: "Reviews / Trust",
        b2c_driver_design: "Aesthetics / Design",

        b2c_chan_social: "Instagram / TikTok",
        b2c_chan_search: "Google Search",
        b2c_chan_physical: "Physical Store",
        b2c_chan_market: "Marketplaces",

        // Explore Secondary
        explore_yes_b2c: "Yes, explore B2C opportunities",
        explore_yes_b2b: "Yes, explore B2B opportunities",
        explore_no: "No, focus on current",

        // Readiness
        ready_yes: "Yes, fully ready",
        ready_partial: "Partial / Manual",
        ready_no: "No, operationally risky",
        
        prob_other: "Other...",
        driver_other: "Other...",

        pos_mass: "Mass / Standard",
        pos_premium: "Premium",
        pos_luxury: "Luxury / Exclusive",
        pos_unsure: "Not sure",

        price_v_cheap: "Very Cheap",
        price_cheap: "Cheap",
        price_medium: "Medium",
        price_expensive: "Expensive",
        price_v_expensive: "Very Expensive",

        freq_yes: "Yes, Daily",
        freq_no: "No, Sporadic",
        freq_sometimes: "Sometimes / Weekly",

        // Others
        b2b: "Companies (B2B)",
        b2c: "Consumers (B2C)",
        gov: "Government",
        mixed: "Mixed",
        // Customer Types
        cust_smb: "Small Business / SMB",
        cust_enterprise: "Enterprise",
        cust_consumer: "Individual Consumer",
        cust_gov: "Government / Public",

        // Payment Models
        pay_one_time: "One-time Payment",
        pay_subscription: "Subscription",
        pay_usage: "Pay per Usage",
        pay_freemium: "Freemium",
        
        pay_onetime: "One-time Purchase", // Legacy
        pay_repeated: "Repeated Purchases",
        pay_monthly: "Monthly Contract",
        pay_project: "Specific Project",
        
        // LTV
        ltv_single: "Buy once",
        ltv_multiple: "Buy multiple times",
        ltv_longterm: "Long term contract",
        ltv_unknown: "I don't know",
        // Cycle
        instant: "Instant",
        days: "Days",
        weeks: "Weeks",
        months: "Months",
        unknown: "Not sure",
        // Acquisition
        ad_none: "Zero / Organic Only",
        ad_low: "Low (< 500 USD)",
        ad_med: "Medium (500 - 2k USD)",
        ad_high: "High (> 2k USD)",
        
        out_companies: "Company List",
        out_profiles: "Profiles / Contact Info",
        out_queries: "Search Keywords",
        out_messages: "Outreach Scripts",
        out_sales: "Sales Tactics", 

        // Operations
        sla_instant: "< 5 min",
        sla_hour: "< 1 hour",
        sla_day: "Same Day",
        sla_next: "Next Day",

        auto_crm: "CRM",
        auto_bot: "AI Chatbot / Agent",
        auto_email: "Email Automation",
        auto_zap: "Zapier / Make",
        auto_none: "None / Manual",

        predictable: "Predictable",
        random: "Random / Luck",
        person: "A person replies",
        bot: "A bot / Automated",
        nobody: "Nobody / Takes too long",
        lose: "We lose them",
        bad: "Response quality drops",
        handle: "We can handle it",
        
        // Pains
        no_clients: "Not enough clients",
        bad_clients: "Low quality clients",
        chaos: "Internal chaos",
        expensive: "Spending without ROI",
        burnout: "Burnout / Stress",
        competition: "Competition is winning",

        // Ambition
        sales: "More Sales",
        margin: "Better Margin",
        order: "More Order",
        scale: "Scale / Automation",
        exit: "Sell the Company",
        leader: "Market Leadership",

        slow: "Slow & Safe",
        fast: "Fast & Risky",
      }
    },
    dashboard: {
      title: "Strategic Blueprint",
      subtitle: "AI Analysis",
      start_over: "Start Over",
      download_report: "Download Report",
      exec_summary: "Executive Analysis",
      
      // Market Pulse
      market_pulse: "Market Pulse",
      growth_opps: "Growth Opportunities",
      blue_ocean: "Blue Ocean Strategy",
      market_trends: "Trends",
      market_benchmarks: "Industry Benchmarks",
      
      demand_map: "Your Buyer Personas",
      demand_sub: "Detailed profile and strategic battle card for each target.",
      
      // Battle Card
      tab_profile: "Deep Profile",
      tab_strategy: "How to Win",
      
      strat_channel: "Best Channel",
      strat_hook: "Marketing Hook",
      strat_content: "Content Strategy",
      strat_offer: "Offer Angle",
      
      operational_check: "Operational Reality Check",
      max_leads: "Max Leads/Mo",
      
      action_plan: "Your Action Plan",
      generated_by: "Generated by BUYERSONA AI",

      // Product Deep Dive
      deep_dive_title: "Deep Dive: Product Analysis",
      deep_dive_desc: "Now that we understand your business, let's analyze a specific product to create a tactical sales strategy.",
      deep_dive_btn: "Analyze a Product",

      // Persona Profiles
      p_demographic: "Demographic & Professional",
      p_psychological: "Psychological Profile",
      p_social: "Social & Status",
      p_economic: "Economic Profile",
      p_maturity: "Maturity Stage",
      p_friction: "Friction & Barriers",
      
      // Labels
      lbl_role: "Role",
      lbl_industry: "Industry",
      lbl_motivations: "Motivations",
      lbl_fears: "Fears",
      lbl_hates: "Hates",
      lbl_reports: "Reports to",
      lbl_kpis: "Key KPIs",
      lbl_stage: "Stage",
      lbl_barriers: "Barriers",
      lbl_objections: "Objections"
    },
    loader: {
      init: "Initializing AI Consultant...",
      step1: "Analyzing business model & geography...",
      step2: "Profiling 6-dimensional personas...",
      step3: "Calculando industry benchmarks...",
      step4: "Mapping specific strategies to personas...",
      step5: "Drafting action plan..."
    }
  },
  es: {
    hero: {
      title: "¿A quién le tengo que vender?",
      subtitle: "¿Dónde los encuentro? ¿Cómo convierto ventas sin romper mi operación?",
      description: "La mayoría de las empresas no fracasan por su producto. Fracasan porque no saben quién es su cliente real.",
      cta_start: "Comenzar Ahora",
      cta_login: "Ingresar",
      footer: "Estrategia de Crecimiento con IA",
      time_to_value: "Obtené un mapa estratégico completo en menos de 10 minutos."
    },
    auth: {
      login_title: "Bienvenido de nuevo",
      register_title: "Crea tu cuenta",
      email: "Correo electrónico",
      password: "Contraseña",
      submit_login: "Ingresar",
      submit_register: "Comenzar Gratis",
      switch_to_register: "¿No tienes cuenta? Regístrate",
      switch_to_login: "¿Ya tienes cuenta? Ingresa",
      mock_notice: "Modo Demo: Ingresa cualquier email"
    },
    onboarding: {
      title: "Modelo de Crecimiento",
      subtitle: "Necesitamos entender tu identidad, tu economía y tu operación.",
      back: "Atrás",
      next: "Siguiente",
      finish: "Generar Estrategia",
      steps: {
        identity: "Identidad",
        product: "Producto",
        revenue: "Dinero",
        acquisition: "Adquisición",
        operations: "Operación",
        pain: "Dolores",
        ambition: "Ambición",
        context: "Humano"
      },
      questions: {
        q_name: "¿Cómo se llama tu empresa?",
        q_geo: "¿Dónde vendés? (Sé específico: Ciudad, País)",
        q_currency: "¿Moneda principal?",
        q_type: "¿Qué es tu empresa? (Seleccioná todas las que apliquen)",
        q_type_other: "Describí tu tipo de negocio:",
        q_dist_model: "¿Modelo de Distribución (Identidad)?",
        q_offering: "¿Qué vendés principalmente?",
        q_diff: "¿Cómo se posiciona lo que vendés?",
        
        // Product
        q_what_sell: "¿Qué vendés?",
        q_what_sell_hint: "Descríbelo en una frase concreta (ej: 'Software de inventario para PyMES').",
        q_target_scope: "¿Para quién es el producto?",

        // B2B Specifics
        q_b2b_use: "¿Cómo lo usa tu cliente?",
        q_b2b_role: "¿Quién te compra? (Seleccioná varios)",
        q_b2b_problem: "Problema principal para EMPRESAS", // NEW
        q_b2b_driver: "¿Por qué compra una EMPRESA?", // NEW

        // B2C Specifics
        q_b2c_context: "¿Cuándo/Por qué lo compra? (Seleccioná varios)",
        q_b2c_channel: "Canal de descubrimiento natural",
        q_b2c_problem: "Problema principal para CONSUMIDOR", // NEW
        q_b2c_driver: "¿Por qué compra un CONSUMIDOR?", // NEW

        q_problem_other: "Describí el problema específico...",
        q_driver_other: "Otro motivo...",

        q_secondary_benefits: "¿Qué otros beneficios brindás?",
        q_inaction: "¿Qué pasa si NO lo usan?",
        q_inaction_hint: "Ej: Pierden dinero, los multan, pierden tiempo.",
        
        q_market_pos: "¿Tu producto es más...?",
        q_price_rel: "¿Qué tan caro es para tu cliente?",
        q_freq: "¿Se usa todos los días?",

        q_target: "¿A quién le facturás hoy?",
        q_payment_model: "¿Cómo te paga normalmente un cliente?",
        q_transaction_value: "Valor de Transacción Típico",
        q_transaction_hint: "¿Es por unidad o ticket promedio?",
        q_transaction_custom: "Ingresá el valor exacto:",
        q_ltv: "Lifetime Value (LTV)",
        q_cycle: "¿Tiempo desde contacto hasta pago?",
        
        // Channels
        q_sales_channels: "¿Dónde ocurre la transacción? (Venta)",
        q_channels: "¿Cómo te encuentran? (Marketing)",
        q_channel_other: "Otro Canal:",
        q_best_channel: "¿Qué canal te trae los MEJORES clientes (Calidad)?",
        q_best_client_channel: "¿Qué canal te trajo tu MEJOR cliente histórico?",
        q_vol_channel: "¿Qué canal te trae MÁS clientes (Volumen)?",
        
        q_ad_spend: "Presupuesto Publicitario Mensual (Estimado)",
        q_ad_spend_custom: "Ingresá presupuesto exacto:",
        
        q_prospecting: "¿Dónde CREES que deberíamos buscar clientes? (Percepción)",
        q_prospecting_other: "Otra fuente...",
        q_prospecting_output: "¿Qué querés recibir de esto? (Seleccioná varios)",
        q_explore_secondary: "¿Querés explorar un mercado secundario?", 

        q_predictability: "¿Tenés un flujo predecible?",
        q_response: "¿Qué pasa cuando alguien pide info?",
        q_team: "¿Cuántas personas atienden ventas?",
        q_capacity: "¿Cuántos leads podés atender por día?",
        q_capacity_channel: "¿Por qué medio los atendés?",
        q_support_readiness: "¿Podés atender este nuevo segmento (ej. soporte B2C)?",
        q_response_sla: "¿Qué tan rápido suelen responder?",
        q_automation: "¿Qué herramientas usás hoy?",
        q_surge: "¿Qué pasa si mañana entran 100 consultas?",
        q_pain: "¿Qué es lo que más te frustra hoy?",
        q_risk: "¿Qué riesgo corre tu EMPRESA si esto no se resuelve?",
        q_goal: "¿Qué querés de verdad?",
        q_pace: "¿Preferís crecer rápido o seguro?",
      },
      options: {
        // Geo
        local: "Local / Ciudad",
        national: "Nacional",
        global: "Internacional",
        // Type
        factory: "Fábrica",
        brand: "Marca",
        distributor: "Distribuidor / Comercio",
        service: "Servicios",
        software: "Software / App",
        other: "Otro",

        // Distribution
        dist_b2c: "Minorista (B2C)",
        dist_b2b: "Mayorista (B2B)",
        dist_both: "Ambos / Híbrido",

        // Target Scope
        scope_b2b: "Empresas (B2B)",
        scope_b2c: "Consumidor Final (B2C)",
        scope_both: "Ambos Mercados",

         // B2B Use Cases
        b2b_use_resale: "Reventa / Generar Ingresos",
        b2b_use_input: "Insumo / Materia Prima",
        b2b_use_ops: "Eficiencia / Operaciones",
        b2b_use_gift: "Regalo Corporativo / RRHH",

        b2b_role_owner: "Dueño / CEO",
        b2b_role_procurement: "Compras",
        b2b_role_ops: "Gerente de Operaciones",
        b2b_role_marketing: "Marketing / Ventas",

         // B2B Problems
        b2b_prob_revenue: "Aumentar Ventas/Ingresos",
        b2b_prob_cost: "Reducir Costos",
        b2b_prob_risk: "Reducir Riesgo/Compliance",
        b2b_prob_efficiency: "Ahorrar Tiempo/Eficiencia",
        b2b_prob_resale: "Producto para Revender",
        
        // B2B Drivers
        b2b_driver_margin: "Margen de Ganancia / ROI",
        b2b_driver_reliability: "Confiabilidad / Seguridad",
        b2b_driver_speed: "Velocidad / Disponibilidad",
        b2b_driver_relationship: "Relación / Servicio",

        // B2C Context
        b2c_ctx_daily: "Necesidad Diaria",
        b2c_ctx_event: "Ocasión / Evento",
        b2c_ctx_gift: "Regalo para otros",
        b2c_ctx_status: "Estatus / Lujo",

        // B2C Problems
        b2c_prob_need: "Resolver Necesidad Funcional",
        b2c_prob_pleasure: "Entretenimiento / Placer",
        b2c_prob_health: "Salud / Bienestar",
        b2c_prob_status: "Estatus Social / Imagen",
        b2c_prob_convenience: "Conveniencia / Facilidad",
        
        // B2C Drivers
        b2c_driver_price: "Precio / Oferta",
        b2c_driver_brand: "Marca / Amor",
        b2c_driver_convenience: "Conveniencia",
        b2c_driver_review: "Reseñas / Confianza",
        b2c_driver_design: "Estética / Diseño",

        b2c_chan_social: "Instagram / TikTok",
        b2c_chan_search: "Búsqueda Google",
        b2c_chan_physical: "Local Físico",
        b2c_chan_market: "Marketplaces",

        // Explore Secondary
        explore_yes_b2c: "Sí, explorar oportunidades B2C",
        explore_yes_b2b: "Sí, explorar oportunidades B2B",
        explore_no: "No, enfocar en lo actual",

         // Readiness
        ready_yes: "Sí, totalmente listo",
        ready_partial: "Parcial / Manual",
        ready_no: "No, riesgo operativo",
        
        prob_other: "Otro...",
        driver_other: "Otro...",

        pos_mass: "Masivo / Estándar",
        pos_premium: "Premium",
        pos_luxury: "Lujo / Exclusivo",
        pos_unsure: "No estoy seguro",

        price_v_cheap: "Muy barato",
        price_cheap: "Barato",
        price_medium: "Medio",
        price_expensive: "Caro",
        price_v_expensive: "Muy caro",

        freq_yes: "Sí, todos los días",
        freq_no: "No, es esporádico",
        freq_sometimes: "A veces / Semanal",

        // Others
        b2b: "Empresas (B2B)",
        b2c: "Consumidores (B2C)",
        gov: "Estado",
        mixed: "Mixto",
        // Customer Types
        cust_smb: "Pequeñas Empresas / PyMEs",
        cust_enterprise: "Grandes Empresas",
        cust_consumer: "Consumidor Final",
        cust_gov: "Gobierno / Público",

        // Payment Models
        pay_one_time: "Pago Único",
        pay_subscription: "Suscripción",
        pay_usage: "Pago por Uso",
        pay_freemium: "Freemium",

        pay_onetime: "Compra única", // Legacy
        pay_repeated: "Compras repetidas",
        pay_monthly: "Contrato mensual",
        pay_project: "Proyecto puntual",

        // LTV
        ltv_single: "Compra una sola vez",
        ltv_multiple: "Compra varias veces",
        ltv_longterm: "Contrato largo",
        ltv_unknown: "No lo sé",
        // Cycle
        instant: "Instantáneo",
        days: "Días",
        weeks: "Semanas",
        months: "Meses",
        unknown: "No estoy seguro",
        // Acquisition
        ad_none: "Cero / Solo Orgánico",
        ad_low: "Bajo (< 500 USD)",
        ad_med: "Medio (500 - 2k USD)",
        ad_high: "Alto (> 2k USD)",
        
        out_companies: "Listado de Empresas",
        out_profiles: "Perfiles / Contactos",
        out_queries: "Ideas de Búsqueda",
        out_messages: "Mensajes de Contacto",
        out_sales: "Tácticas de Cierre", 

        // Operations
        sla_instant: "< 5 min",
        sla_hour: "< 1 hora",
        sla_day: "En el día",
        sla_next: "Al día siguiente",

        auto_crm: "CRM",
        auto_bot: "Chatbot / Agente IA",
        auto_email: "Email Marketing",
        auto_zap: "Zapier / Make",
        auto_none: "Nada / Manual",

        predictable: "Predecible",
        random: "Al azar",
        person: "Responde una persona",
        bot: "Responde un bot",
        nobody: "Nadie / Tarda mucho",
        lose: "Las perdemos",
        bad: "Respondemos mal",
        handle: "Podemos manejarlas",
        
        // Pains
        no_clients: "No entran clientes",
        bad_clients: "Entran malos clientes",
        chaos: "Desorden interno",
        expensive: "Gasto y no vendo",
        burnout: "Burnout / Estrés",
        competition: "Gana la competencia",

        // Ambition
        sales: "Más ventas",
        margin: "Más margen",
        order: "Más orden",
        scale: "Escalar",
        exit: "Vender la empresa",
        leader: "Liderar el mercado",

        slow: "Lento y Seguro",
        fast: "Rápido con Riesgo",
      }
    },
    dashboard: {
      title: "Plan Estratégico",
      subtitle: "Análisis IA",
      start_over: "Reiniciar",
      download_report: "Descargar Reporte",
      exec_summary: "Análisis Ejecutivo",
      
      // Market Pulse
      market_pulse: "Pulso del Mercado",
      growth_opps: "Oportunidades de Crecimiento",
      blue_ocean: "Estrategia Océano Azul",
      market_trends: "Tendencias",
      market_benchmarks: "Benchmarks de Industria",

      demand_map: "Mapa de Demanda",
      demand_sub: "A quién deberías venderle, categorizado por valor estratégico.",
      
      // Battle Card
      tab_profile: "Perfil Profundo",
      tab_strategy: "Cómo Ganar",

      strat_channel: "Mejor Canal",
      strat_hook: "Gancho de Marketing",
      strat_content: "Estrategia de Contenido",
      strat_offer: "Ángulo de Oferta",

      operational_check: "Chequeo Operativo",
      max_leads: "Capacidad Máx.",
      
      action_plan: "Tu Plan de Acción",
      generated_by: "Generado por BUYERSONA AI",

      // Product Deep Dive
      deep_dive_title: "Profundizar: Análisis de Producto",
      deep_dive_desc: "Ahora que entendemos tu negocio, analicemos un producto específico para crear una estrategia de venta táctica.",
      deep_dive_btn: "Analizar un Producto",

      // Persona Profiles
      p_demographic: "Perfil Demográfico y Profesional",
      p_psychological: "Perfil Psicológico",
      p_social: "Perfil Social y Status",
      p_economic: "Perfil Económico",
      p_maturity: "Perfil de Madurez",
      p_friction: "Perfil de Fricción",

      // Labels
      lbl_role: "Cargo",
      lbl_industry: "Industria",
      lbl_motivations: "Motivaciones",
      lbl_fears: "Miedos",
      lbl_hates: "Odia",
      lbl_reports: "Reporta a",
      lbl_kpis: "KPIs Clave",
      lbl_stage: "Etapa",
      lbl_barriers: "Barreras",
      lbl_objections: "Objeciones"
    },
    loader: {
      init: "Iniciando consultor IA...",
      step1: "Analizando modelo y geografía...",
      step2: "Perfilando personas en 6 dimensiones...",
      step3: "Calculando límites operativos...",
      step4: "Formulando go-to-market...",
      step5: "Redactando plan de acción..."
    }
  }
};