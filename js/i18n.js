
window.KAWA_I18N = {
  els: [
    ['meta[name="description"]', 'kawa, a 22-year-old full stack developer. Websites, apps, systems and AI automations, from concept to working system.', 'content'],
    ['meta[property="og:description"]', 'I turn ideas into real solutions with clean, efficient code.', 'content'],
    ['.skip', 'Skip to content'],

    
    ['#loaderAsk p', '&gt; your system has animations turned off.<br>&gt; load the site\'s animations?'],
    ['#loaderAsk [data-motion]', ['[y] with animations', '[n] without animations']],

    
    ['#navLinks', 'Sections', 'aria-label'],
    ['#navLinks a[href^="#"]', ['~/about', '~/kagutsuchi', '~/languages', '~/certifications', '~/services', '~/contact']],
    ['.nav__progress-t', 'journey'],
    ['.nav__cta', 'Let\'s talk'],
    ['.idioma', 'Language', 'aria-label'],

    
    ['#hero', 'Introduction', 'aria-label'],
    ['.hero__tag .type', '> I turn ideas into real solutions_', 'data-text'],
    ['.hero__actions a', ['Get my website', 'See the Kagutsuchi project']],
    ['.hero__hint', 'hover the drawing · click the background · scroll to cross'],

    
    ['#sobre > .label', '~/02 about'],
    ['.sobre__img', 'Photo of kawa', 'alt'],
    ['#sobreTitulo', 'About me'],
    ['.bio', [
      'My name is Kawa, I\'m 22 years old and I\'m a junior developer currently working in the full stack development market out of appreciation for the field. I\'m particularly interested in turning abstract ideas into concrete solutions, leading projects from their conception and structuring through to the implementation of fully functional systems.',
      'I stand out for my technical curiosity, autonomy in solving problems and ease in learning and adapting to different technologies and contexts. I\'m especially drawn to unusual challenges and out-of-the-ordinary projects, where I can explore possibilities, break with conventional approaches and constantly expand my capabilities.'
    ]],
    ['.type--quote', '“We are what we repeatedly do. Excellence, then, is not an act, but a habit.”', 'data-text'],

    
    ['.wired__head .label', '~/03 featured project'],
    ['.wired__sub', 'A personal desktop assistant that coordinates AI agents on its own, learns through repetition and acts on the computer always under permission.'],
    ['.wired__steps a', ['01 features', '02 security', '03 database and backend']],
    ['.wired__station-t', 'corridor · node'],
    ['.panel .window__bar span:nth-child(2)', ['~/kagutsuchi/features', '~/kagutsuchi/security', '~/kagutsuchi/backend']],
    ['.panel .h3', ['01 · Features', '02 · Security', '03 · Database and backend']],
    ['#kagutsuchi-funcionalidades li', [
      '<b>Automatic agent coordination:</b> built to act as a digital assistant and agent coordinator, the program is fully able to adapt to multiple functions and carry out a set of actions that complement its work with extra pairs of hands.',
      '<b>Vault:</b> a second brain in folders, with a repetition-based routine and weekly self-analysis against context loss. Recurring patterns become rules upon confirmation, so Kagutsuchi constantly works around the expected results.',
      '<b>Voice:</b> voice input and output, with the transcription engine started by the app itself, no extra windows.',
      '<b>Desktop commander:</b> reads and edits files, browses and fills in pages, and uses the terminal and administrator under permission.',
      '<b>Persona integration:</b> Kagutsuchi can present itself through a 3D persona laid directly over your screen, interacting with the allowed files and windows while having a set of configurable actions and expressions.'
    ]],
    ['#kagutsuchi-seguranca li', [
      '<b>Explicit permission:</b> terminal, administrator and browser ask for confirmation by pop-up the first time, with “allow this time” and “always allow”.',
      '<b>Deny by default:</b> when in doubt, reading within scope goes ahead and everything else is denied.',
      '<b>Instruction hierarchy:</b> app limits, then the user, then the master prompt. External content (pages, files) has no authority, which protects against command injection.',
      '<b>Protected core:</b> only the user edits the master prompt and the root AGENTS.md.',
      '<b>Credential vault:</b> logins and passwords saved automatically in a vault, with no manual saving.',
      '<b>Controlled execution:</b> external, destructive or ambiguous-error actions are never retried on their own; each task goes through eight states (from PENDING to DONE or FAILED).',
      '<b>Privacy:</b> the persona reacts to app events, without capturing the screen.'
    ]],
    ['#kagutsuchi-backend li', [
      '<b>Multi-agent orchestrator:</b> coordinator A0 and agents A1 to A6 activated by context, in a layered chain (layer 1 delegates to the next ones), each with its own prompt, editable at the user’s request.',
      '<b>Vault:</b> the app’s default storage, with an optional external folder and connection to Obsidian via plugin (planned).',
      '<b>Database:</b> Cloudflare D1 chosen for Kagutsuchi and the Vault, connected via MCP.',
      '<b>AI layer:</b> provider and key configurable in the interface.',
      '<b>Local transcription service:</b> a built-in listening server, started with the microphone.',
      '<b>Per-user cloud:</b> server-side operation with individual access for each user.'
    ]],

    
    ['#linguagens > .label', '~/04 languages'],
    ['#lingTitulo', 'Languages I master'],
    ['.lang span', ['websites, interfaces and the Kagutsuchi app', 'backend and APIs', 'automations and AI', 'the structure of everything on the web']],
    ['#langCarrossel', 'Languages', 'aria-label'],
    ['#langCarrossel', 'carousel', 'aria-roledescription'],

    
    ['#certificacoes > .label', '~/05 certifications'],
    ['#certTitulo', 'Certifications'],
    ['.cert .window__bar span:nth-child(2)', ['development', 'security', 'ai and automation', 'data and intelligence', 'infrastructure and systems']],
    ['.cert__body p:not(.cert__org)', [
      'Development, testing and deployment of applications.',
      'Information and network security.',
      'Development of agents and applications with AI.',
      'Data modeling, visualization and analysis.',
      'General Linux administration.'
    ]],
    ['.cert__link', ['verify credential ↗', 'verify credential ↗', 'verify credential ↗', 'verify credential ↗', 'verify credential ↗']],

    
    ['#servicos > .label', '~/06 services'],
    ['#servTitulo', 'What I do for you'],
    ['#servicos .lead', 'Your business selling direct, with no app commission: a website and system in your name, with your own QR code.'],
    ['.service .window__bar span:nth-child(2)', ['~/sites', '~/apps', '~/orders', '~/ai', '~/design']],
    ['.service .h3', ['Websites and landing pages', 'Installable web apps', 'Orders and booking', 'AI automations', 'Interface design']],
    ['.service__body p', [
      'Fast, responsive and built to turn visits into customers.',
      'They open in the browser and install on the phone, with no app store.',
      'Digital menu, cart, schedule and a dashboard for the business owner.',
      'Repetitive tasks handled by agents that work for you.',
      'From idea to prototype, with its own identity.'
    ]],

    
    ['#veja > .label', '~/07 see for yourself'],
    ['#vejaTitulo', 'See your business with its own website'],
    ['#appCarrossel', 'carousel', 'aria-roledescription'],
    ['.app', ['Menu', 'Booking', 'Delivery'], 'data-nome'],
    ['.tela__kicker', ['menu · table 12', 'online booking', 'delivery · order #2048']],
    ['.tela__tag', ['open until 11 pm · order from your table', 'service, professional and time', 'arrives in ~12 min']],
    ['.tela__abas li', ['mains', 'pasta', 'drinks', 'desserts']],
    ['.menu b', ['Steak parmigiana', 'Mushroom risotto', 'Grilled chicken', 'House salad']],
    ['.menu span', ['rice and fries', 'parmesan and parsley', 'vegetables and mash', 'greens and burrata']],
    ['.tela--cardapio .tela__barra span', ['2 items · R$ 96', 'order ›']],
    ['.tela__sub', ['service', 'with']],
    ['.chips li', ['haircut', 'blow-dry', 'coloring', 'nails']],
    ['.pros__n', 'Bea · 45 min'],
    ['.dias span', ['mon', 'tue', 'wed', 'thu', 'fri']],
    ['.tela--agenda .tela__barra span', 'confirm · tue 11 · 10:30'],
    ['.etapas span', ['order received', 'being prepared', 'out for delivery', 'delivered']],
    ['.entregador span:nth-child(2)', 'Rafa · motorbike<br><small>açaí 500 ml + granola</small>'],

    
    ['#faqTitulo', 'Frequently asked questions'],
    ['.faq summary', [
      'How much does a website cost?',
      'Who pays for the domain?',
      'Is there a commission on sales?',
      'How long does it take?',
      'Do I need to understand programming?'
    ]],
    ['.faq details p', [
      'It depends on what your business needs. Tell me your idea by e-mail and I\'ll send a no-obligation quote.',
      'The domain stays in the client\'s name and is paid by them. That way the address is truly yours.',
      'No. The site is yours and so are the sales. No percentage on orders.',
      'The deadline is agreed in the quote, according to the size of the project.',
      'No. I take care of the technical side and show you how to use what\'s yours.'
    ]],

    
    ['#contato .label', '~/09 contact'],
    ['#contatoTitulo', 'LET\'S TALK<br>ABOUT YOUR PROJECT?']
  ],

  str: {
    'mail.projeto.s': { pt: 'Projeto — vim pelo portfólio', en: 'Project — I came from your portfolio' },
    'mail.projeto.b': { pt: 'Olá, kawa! Quero conversar sobre um projeto.', en: 'Hello, kawa! I\'d like to talk about a project.' },
    'mail.site.s': { pt: 'Quero um site', en: 'I want a website' },
    'mail.site.b': { pt: 'Olá, kawa! Quero um site.', en: 'Hello, kawa! I want a website.' },
    'copiado': { pt: 'copiado ✓', en: 'copied ✓' },
    'mov.on': { pt: 'movimento: ligado · [reduzir]', en: 'motion: on · [reduce]' },
    'mov.off': { pt: 'movimento: reduzido · [ligar animações]', en: 'motion: reduced · [turn on animations]' }
  }
};
