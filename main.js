/* ================= animated network background ================= */
(function(){
  const canvas = document.getElementById('net-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  let nodes = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = Math.min(70, Math.floor((window.innerWidth * window.innerHeight) / 22000));
  for (let i = 0; i < COUNT; i++){
    nodes.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 1 + Math.random() * 1.6,
      pulse: Math.random() * Math.PI * 2
    });
  }

  const LINK_DIST = 150;
  let mouse = { x: -9999, y: -9999 };
  window.addEventListener('mousemove', (e)=>{ mouse.x = e.clientX; mouse.y = e.clientY; });

  function step(){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,window.innerWidth, window.innerHeight);

    nodes.forEach(n=>{
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > window.innerWidth) n.vx *= -1;
      if (n.y < 0 || n.y > window.innerHeight) n.vy *= -1;
      n.pulse += 0.02;
    });

    for (let i=0;i<nodes.length;i++){
      for (let j=i+1;j<nodes.length;j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < LINK_DIST){
          const alpha = (1 - dist/LINK_DIST) * 0.35;
          const grad = ctx.createLinearGradient(a.x,a.y,b.x,b.y);
          grad.addColorStop(0, 'rgba(45,91,167,'+alpha+')');
          grad.addColorStop(1, 'rgba(104,47,142,'+alpha+')');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
      const dxm = nodes[i].x-mouse.x, dym = nodes[i].y-mouse.y;
      const dm = Math.sqrt(dxm*dxm+dym*dym);
      if (dm < 180){
        ctx.strokeStyle = 'rgba(255,19,255,' + ((1-dm/180)*0.5) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    nodes.forEach(n=>{
      const glow = 0.6 + Math.sin(n.pulse)*0.4;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + glow, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(122,128,160,' + (0.5 + glow*0.3) + ')';
      ctx.fill();
    });

    if (!reduceMotion) requestAnimationFrame(step);
  }
  step();
})();

/* ================= burger menu ================= */
(function(){
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.mobile-menu');
  if (!burger || !menu) return;
  burger.setAttribute('aria-expanded', 'false');
  burger.addEventListener('click', ()=>{
    const isOpen = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  menu.addEventListener('click', (e)=>{
    if (e.target.tagName === 'A'){ menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
  });
})();

/* ================= reveal on scroll ================= */
(function(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{ if (entry.isIntersecting) entry.target.classList.add('is-in'); });
  }, { threshold: .2 });
  document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
})();

(function(){
  const fab = document.getElementById('ai-fab');
  const panel = document.getElementById('ai-panel');
  const closeBtn = document.getElementById('ai-close');
  const body = document.getElementById('ai-body');
  const quick = document.getElementById('ai-quick');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  if (!fab || !panel) return;

  let started = false;

  function currentLang(){ return document.documentElement.lang || 'ar'; }

  function addBubble(text, who){
    const b = document.createElement('div');
    b.className = 'ai-bubble ' + who;
    b.textContent = text;
    body.appendChild(b);
    body.scrollTop = body.scrollHeight;
  }

  function botReply(text){
    const typing = document.createElement('div');
    typing.className = 'ai-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    setTimeout(()=>{
      typing.remove();
      addBubble(text, 'bot');
    }, 600 + Math.random()*400);
  }

  function renderQuick(){
    const lang = currentLang();
    quick.innerHTML = '';
    T[lang].bot_quick.forEach(item=>{
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ai-chip';
      chip.textContent = item.label;
      chip.addEventListener('click', ()=>{
        addBubble(item.label, 'user');
        botReply(item.a);
      });
      quick.appendChild(chip);
    });
  }

  function matchKeyword(text){
    const lang = currentLang();
    const lower = text.toLowerCase();
    const kw = T[lang].bot_keywords;
    for (const key in kw){
      if (kw[key].some(w => lower.includes(w))){
        const found = T[lang].bot_quick.find(q => q.k === key);
        if (found) return found.a;
      }
    }
    return null;
  }

  function open(){
    panel.hidden = false;
    fab.setAttribute('aria-expanded','true');
    renderQuick();
    if (!started){
      started = true;
      setTimeout(()=> botReply(T[currentLang()].bot_welcome), 300);
    }
  }
  function close(){
    panel.hidden = true;
    fab.setAttribute('aria-expanded','false');
  }

  fab.addEventListener('click', ()=> panel.hidden ? open() : close());
  closeBtn && closeBtn.addEventListener('click', close);

  form && form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    addBubble(val, 'user');
    input.value = '';
    const answer = matchKeyword(val);
    botReply(answer || T[currentLang()].bot_fallback);
  });

  document.addEventListener('lang-changed', renderQuick);
})();

/* ================= translations ================= */
const T = {
  ar: {
    nav_home:"الرئيسية", nav_services:"الخدمات", nav_process:"منهجية العمل", nav_work:"الأعمال", nav_contact:"اتصل بنا", nav_cta:"احجز استشارة",
    tagline:"ذكاء اصطناعي رشيق لأتمتة الأعمال",
    home_eyebrow:"وكالة ويب وذكاء اصطناعي — تونس",
    home_title_1:"نربط عملك", home_title_2:"بذكاء اصطناعي يعمل بلا توقف",
    home_sub:"مواقع ويب، ووكلاء ذكاء اصطناعي، وأنظمة أتمتة — كل نقطة في عملك تتصل بالأخرى وتعمل دون توقف.",
    home_cta1:"تواصل معنا عبر واتساب", home_cta2:"شاهد أعمالنا",
    home_s_tag:"الخدمات", home_s_title:"ثلاثة أنظمة، شبكة واحدة",
    s1_h:"مواقع ويب", s1_p:"موقع من الصفر يعكس هوية علامتك، سريع ومتجاوب.",
    s2_h:"وكلاء ذكاء اصطناعي", s2_p:"يرد على واتساب، والرسائل الصوتية، والمكالمات على مدار الساعة.",
    s3_h:"أتمتة لكل سير عمل", s3_p:"وكيل ذكي لأي مهمة متكررة في عملك.",
    cta_title:"هل أنت مستعد لربط عملك بالذكاء الاصطناعي؟",
    cta_p:"استشارة أولى مجانية — سنطّلع معًا على احتياجاتك.",
    cta_wa:"واتساب: 92 225 982", cta_fb:"صفحة فيسبوك Vokala AI",

    services_eyebrow:"الخدمات", services_h:"أنظمة مترابطة لعمل واحد",
    services_p:"كل خدمة نقطة في الشبكة نفسها — نصممها لتعمل معًا، لا كأجزاء منفصلة.",

    process_eyebrow:"منهجية العمل", process_h:"أربع مراحل، من الفكرة إلى الإطلاق",
    process_p:"نفس الدقة التي تتطلبها الأنظمة الميكانيكية، مطبَّقة على كل مشروع رقمي.",
    p1_h:"استكشاف", p1_p:"نفهم نشاطك التجاري، وجمهورك، والمشكلة التي سنحلّها.",
    p2_h:"تصميم", p2_p:"نصمم هوية بصرية وتجربة استخدام خاصة بك.",
    p3_h:"بناء", p3_p:"تطوير الموقع أو الوكيل، مع اختبار مستمر.",
    p4_h:"إطلاق ومتابعة", p4_p:"نشر، وتدريب، وتحسين وفق الأداء.",

    work_eyebrow:"الأعمال", work_h:"أعمال أنجزناها بالفعل", work_p:"نماذج ومشاريع قيد التطوير أو مُنجَزة.",
    w1_h:"وكيل مبيعات ذكي للعقارات", w1_p:"منتج B2B — البحث عن العملاء المحتملين والرد الآلي عليهم.", w1_s:"قيد التطوير",
    w2_h:"لوحة تحكم لـ ABDO Céramique", w2_p:"نظام متابعة داخلي لتسيير النشاط التجاري.", w2_s:"مُنجَز",
    w3_h:"موقع سيرة ذاتية تفاعلي", w3_p:"موقع شخصي متحرك وثنائي اللغة.", w3_s:"منشور",

    contact_eyebrow:"اتصل بنا", contact_h:"لنبدأ الحديث", contact_p:"واتساب، فيسبوك، أو مكالمة هاتفية — بالطريقة التي تناسبك.",
    contact_wa_h:"واتساب", contact_fb_h:"فيسبوك", contact_loc_h:"الموقع", contact_loc:"تونس، تونس", contact_founder_h:"المؤسس",

    footer_rights:"جميع الحقوق محفوظة",

    bot_title:"مساعد Vokala", bot_placeholder:"اكتب سؤالك هنا...",
    bot_welcome:"أهلاً! أنا وكيل Vokala AI — جرّبني كما لو كنت أحد عملائك 👋",
    bot_fallback:"هذا السؤال يحتاج إلى تفاصيل أكثر — يمكننا إكمال الحديث عبر واتساب مباشرة.",
    bot_cta_wa:"أكمل عبر واتساب",
    bot_quick:[
      {k:"price", label:"ما هي الأسعار؟", a:"تبدأ أسعار المواقع من 500 دينار تونسي، ووكيل الذكاء الاصطناعي من 100 دينار شهريًا. سنقدّم لك عرضًا دقيقًا بعد معرفة احتياجاتك."},
      {k:"lang", label:"هل يفهم اللهجة التونسية؟", a:"نعم، يفهم الوكيل اللهجة التونسية، والعربية الفصحى، والفرنسية."},
      {k:"time", label:"كم يستغرق من الوقت؟", a:"تُنجَز أغلب المواقع خلال أسبوع إلى أسبوعين، والوكيل الذكي في نحو أسبوعين."},
      {k:"what", label:"بماذا يقوم الوكيل؟", a:"يرد على واتساب، والمكالمات، والرسائل الصوتية، ويتصل بأي نظام تستخدمه بالفعل."}
    ],
    bot_keywords:{
      price:["سعر","ثمن","تكلفة","التكلفة"],
      lang:["لغة","لهجة","دارجة","فرنسية","عربي"],
      time:["وقت","مدة","أسبوع","متى"],
      what:["ماذا","وكيل","يعمل","خدمة"]
    }
  },
  en: {
    nav_home:"Home", nav_services:"Services", nav_process:"Process", nav_work:"Work", nav_contact:"Contact", nav_cta:"Book a call",
    tagline:"Agile Intelligence for Business Automation",
    home_eyebrow:"Web & AI agency — Tunis",
    home_title_1:"We connect your business", home_title_2:"to AI that runs itself",
    home_sub:"Websites, AI agents, and automation systems — every point in your business connects to the next, and keeps running without stopping.",
    home_cta1:"Message us on WhatsApp", home_cta2:"See the work",
    home_s_tag:"Services", home_s_title:"Three systems, one network",
    s1_h:"Websites", s1_p:"Built from scratch to reflect your brand, fast and responsive.",
    s2_h:"AI Agents", s2_p:"Answer WhatsApp, voice, and calls — around the clock.",
    s3_h:"Automation, any workflow", s3_p:"An AI agent for any recurring task in your business.",
    cta_title:"Ready to connect your business to AI?",
    cta_p:"First consultation is free — let's look at your needs together.",
    cta_wa:"WhatsApp: 92 225 982", cta_fb:"Vokala AI on Facebook",

    services_eyebrow:"Services", services_h:"Connected systems, one outcome",
    services_p:"Each service is a node in the same network — built to work together, not as separate parts.",

    process_eyebrow:"Process", process_h:"Four stages, idea to launch",
    process_p:"The same precision mechanical systems demand, applied to every digital project.",
    p1_h:"Discover", p1_p:"We map your business, your audience, and the problem to solve.",
    p2_h:"Design", p2_p:"We build a visual identity and experience made for you.",
    p3_h:"Build", p3_p:"Development of the site or agent, tested continuously.",
    p4_h:"Launch & iterate", p4_p:"Ship it, train you on it, improve based on real usage.",

    work_eyebrow:"Work", work_h:"Things we've actually built", work_p:"Live, delivered, and in-progress projects.",
    w1_h:"AI sales agent for real estate", w1_p:"A B2B product — lead research and automated response.", w1_s:"In progress",
    w2_h:"Dashboard for ABDO Céramique", w2_p:"Internal tracking system for daily operations.", w2_s:"Delivered",
    w3_h:"Interactive résumé site", w3_p:"An animated, bilingual personal site.", w3_s:"Live",

    contact_eyebrow:"Contact", contact_h:"Let's talk", contact_p:"WhatsApp, Facebook, or a call — whatever suits you.",
    contact_wa_h:"WhatsApp", contact_fb_h:"Facebook", contact_loc_h:"Location", contact_loc:"Tunis, Tunisia", contact_founder_h:"Founder",

    footer_rights:"All rights reserved",

    bot_title:"Vokala Assistant", bot_placeholder:"Type your question...",
    bot_welcome:"Hey! I'm the Vokala AI agent — try me the way your customers would 👋",
    bot_fallback:"That one needs a bit more detail — let's continue on WhatsApp directly.",
    bot_cta_wa:"Continue on WhatsApp",
    bot_quick:[
      {k:"price", label:"What's the pricing?", a:"Websites start at 500 TND, AI agents from 100 TND/month. I'll give you an exact quote once I know your needs."},
      {k:"lang", label:"Does it speak dialect?", a:"Yes — it understands Tunisian dialect, Standard Arabic, and French."},
      {k:"time", label:"How long does it take?", a:"Most websites are ready in 1-2 weeks, AI agents in about two weeks."},
      {k:"what", label:"What can it actually do?", a:"It answers WhatsApp, calls, and voice messages, and connects to any system you already use."}
    ],
    bot_keywords:{
      price:["price","cost","pricing","how much"],
      lang:["language","dialect","french","arabic"],
      time:["time","long","fast","week"],
      what:["what","agent","do","does"]
    }
  }
};

function applyLang(lang){
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('.lang-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const key = el.getAttribute('data-i18n-ph');
    if (T[lang][key] !== undefined) el.placeholder = T[lang][key];
  });
  try { localStorage.setItem('vokala-lang', lang); } catch(e){}
  document.dispatchEvent(new CustomEvent('lang-changed'));
}
function setLang(lang){ applyLang(lang); }

(function(){
  let saved = 'ar';
  try { saved = localStorage.getItem('vokala-lang') || 'ar'; } catch(e){}
  applyLang(saved);
})();
