'use strict';
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=window.matchMedia('(pointer: fine)');
const root=document.documentElement;
const hero=document.querySelector('.hero');
const visual=document.querySelector('.flow-visual');
const menu=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#navigation');
let inView=true;
let cancelParticles=()=>{},resumeParticles=()=>{};
const motionAllowed=()=>!reducedMotion.matches;
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu');navigation.classList.remove('open');}
menu.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!expanded));menu.setAttribute('aria-label',expanded?'Abrir menu':'Fechar menu');navigation.classList.toggle('open',!expanded);});
navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();if(navigation.contains(document.activeElement))menu.focus();}});
document.addEventListener('click',e=>{if(navigation.classList.contains('open')&&!navigation.contains(e.target)&&!menu.contains(e.target)){closeMenu();}});
window.matchMedia('(min-width: 881px)').addEventListener('change',closeMenu);
document.querySelector('#year').textContent=new Date().getFullYear();
function updateMotion(){
  const stopped=!motionAllowed();
  root.classList.toggle('motion-paused',stopped);
  if(stopped){
    document.querySelectorAll('.enter').forEach(el=>el.classList.add('is-visible'));
    if(visual)visual.classList.remove('is-pulsing');
    document.querySelectorAll('.flow-pulse,.click-ripple').forEach(el=>el.remove());
    document.querySelectorAll('.service-card,.system-showcase-card,.hero-stats-card,.workshop-card,.eco-card').forEach(c=>{c.style.transform='';c.style.transition='';});
    document.querySelectorAll('.cursor-dot').forEach(el=>el.classList.add('cursor-hidden'));
    const tc=document.querySelector('.mouse-trail-canvas');if(tc){const ctx=tc.getContext('2d');if(ctx)ctx.clearRect(0,0,tc.width,tc.height);}
    cancelParticles();
  }else resumeParticles();
}
reducedMotion.addEventListener('change',()=>{updateMotion();});
updateMotion();
// Reveal each group once; no scroll interception or content loss without JavaScript.
if('IntersectionObserver' in window){
  const selectors=['.section-heading','.service-grid>.service-card','.system-showcase-card','.hero-stats-card','.ep-item','.expertise-title','.expertise-content','.sites-title','.sites-content','.steps article','.about-heading','.about-story>p','.about-story blockquote','.people','.principle-grid article','.contact-grid','.eco-card'];
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:0,rootMargin:'0px 0px 50px 0px'});
  selectors.forEach(selector=>document.querySelectorAll(selector).forEach((el,index)=>{if(motionAllowed()){el.style.setProperty('--enter-delay',`${(index%3)*45}ms`);el.classList.add('enter');}observer.observe(el);}));
  if(hero)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;hero.classList.toggle('hero-inactive',!inView);if(inView)resumeParticles();else cancelParticles();}).observe(hero);
}
let pulseTimer;
function pulse(x,y){
  if(!motionAllowed()||!visual)return;
  const ring=document.createElement('span');ring.className='flow-pulse';ring.setAttribute('aria-hidden','true');ring.style.left=`${x}px`;ring.style.top=`${y}px`;
  visual.querySelectorAll('.flow-pulse').forEach(el=>el.remove());visual.append(ring);visual.classList.add('is-pulsing');clearTimeout(pulseTimer);
  pulseTimer=setTimeout(()=>{if(visual)visual.classList.remove('is-pulsing');ring.remove();},1250);
}
if(visual){
  visual.addEventListener('click',e=>{
    const r=visual.getBoundingClientRect();
    if(e.detail===0){pulse(visual.clientWidth/2,visual.clientHeight*.55);return;}
    pulse((e.clientX-r.left)*visual.clientWidth/r.width,(e.clientY-r.top)*visual.clientHeight/r.height);
  });
}
let pointerFrame;
const nodes=visual?[...visual.querySelectorAll('.flow-node')]:[];
const pointer={x:-1000,y:-1000,active:false};
function syncConnections(){
  if(!visual)return;
  const svg=visual.querySelector('.connections'),core=visual.querySelector('.flow-core');
  if(!svg||!core)return;
  svg.setAttribute('viewBox',`0 0 ${visual.clientWidth} ${visual.clientHeight}`);
  const cx=core.offsetLeft+core.offsetWidth/2,cy=core.offsetTop+core.offsetHeight/2;
  svg.querySelector('path').setAttribute('d',nodes.map(node=>{
    const x=node.offsetLeft+node.offsetWidth/2,y=node.offsetTop+node.offsetHeight/2;
    return `M${x} ${y} C${cx} ${y} ${x} ${cy} ${cx} ${cy}`;
  }).join(' '));
}
if(visual){
  syncConnections();
  if('ResizeObserver' in window)new ResizeObserver(syncConnections).observe(visual);
  else window.addEventListener('resize',syncConnections,{passive:true});
}
function resetPointer(){
  cancelAnimationFrame(pointerFrame);pointer.active=false;
  if(visual){visual.style.setProperty('--gx','0px');visual.style.setProperty('--gy','0px');}
  nodes.forEach(node=>{node.style.setProperty('--nx','0px');node.style.setProperty('--ny','0px');});
}
if(hero&&visual){
  hero.addEventListener('pointermove',e=>{
    if(!motionAllowed()||!finePointer.matches)return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame=requestAnimationFrame(()=>{
      const r=hero.getBoundingClientRect(),v=visual.getBoundingClientRect();
      hero.style.setProperty('--mx',`${e.clientX-r.left}px`);hero.style.setProperty('--my',`${e.clientY-r.top}px`);
      const dx=Math.max(-.5,Math.min(.5,(e.clientX-v.left)/v.width-.5)),dy=Math.max(-.5,Math.min(.5,(e.clientY-v.top)/v.height-.5));
      visual.style.setProperty('--gx',`${dx*-28}px`);visual.style.setProperty('--gy',`${dy*-22}px`);
      nodes.forEach((node,i)=>{node.style.setProperty('--nx',`${dx*(8+i*2)}px`);node.style.setProperty('--ny',`${dy*(6+i*2)}px`);});
      const c=document.querySelector('.galaxy-particles');
      if(c){
        const cr=c.getBoundingClientRect();
        pointer.x=(e.clientX-cr.left)*c.clientWidth/cr.width;pointer.y=(e.clientY-cr.top)*c.clientHeight/cr.height;
        pointer.active=e.clientX>=v.left&&e.clientX<=v.right&&e.clientY>=v.top&&e.clientY<=v.bottom;
      }
    });
  });
  hero.addEventListener('pointerleave',resetPointer);hero.addEventListener('pointercancel',resetPointer);
}
// Dynamic Spotlight interaction on cards (cards remain completely straight and aligned)
document.querySelectorAll('.spotlight').forEach(card => {
  card.addEventListener('pointermove', e => {
    if (!motionAllowed() || !finePointer.matches) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--sx', `${e.clientX - r.left}px`);
    card.style.setProperty('--sy', `${e.clientY - r.top}px`);
  });
});
document.querySelectorAll('.button,.nav-cta').forEach(button=>button.addEventListener('click',e=>{
  if(!motionAllowed())return;
  button.querySelectorAll('.click-ripple').forEach(el=>el.remove());
  const ripple=document.createElement('span'),r=button.getBoundingClientRect();ripple.className='click-ripple';ripple.setAttribute('aria-hidden','true');
  ripple.style.left=`${e.detail?e.clientX-r.left:r.width/2}px`;ripple.style.top=`${e.detail?e.clientY-r.top:r.height/2}px`;
  button.append(ripple);setTimeout(()=>ripple.remove(),650);
}));
document.querySelectorAll('.magnetic').forEach(button=>{
  button.addEventListener('pointermove',e=>{if(!motionAllowed()||!finePointer.matches)return;const r=button.getBoundingClientRect();button.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.055}px,${(e.clientY-r.top-r.height/2)*.12}px)`;});
  ['pointerleave','pointercancel','blur'].forEach(type=>button.addEventListener(type,()=>button.style.transform=''));
});
// Sparse reactive points above a separately generated galaxy background.
const canvas=document.querySelector('.galaxy-particles');
const context=canvas?canvas.getContext('2d'):null;
if(context){
  let width=0,height=0,stars=[],animationFrame=0,previousTime=0;
  function paint(time,dt){
    context.clearRect(0,0,width,height);
    stars.forEach(star=>{
      star.y-=dt*1.9*star.depth;if(star.y<0)star.y=height;
      const dx=star.x-pointer.x,dy=star.y-pointer.y,d=Math.hypot(dx,dy);
      const influence=pointer.active?Math.max(0,1-d/110):0;
      const x=star.x+(d?dx/d:0)*influence*7,y=star.y+(d?dy/d:0)*influence*7;
      const alpha=.15+.16*(.5+.5*Math.sin(time*.00065+star.phase))+influence*.25;
      context.fillStyle=`rgba(158,220,255,${alpha})`;context.beginPath();context.arc(x,y,star.r+influence*.3,0,Math.PI*2);context.fill();
      if(influence>.55){context.strokeStyle=`rgba(80,197,249,${influence*.075})`;context.lineWidth=.5;context.beginPath();context.moveTo(x,y);context.lineTo(pointer.x,pointer.y);context.stroke();}
    });
  }
  function resize(){
    width=canvas.parentElement.clientWidth;height=canvas.parentElement.clientHeight;
    const density=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.round(width*density);canvas.height=Math.round(height*density);context.setTransform(density,0,0,density,0,0);
    stars=Array.from({length:window.innerWidth<621?38:80},()=>({x:Math.random()*width,y:Math.random()*height,r:.4+Math.random()*.9,depth:.4+Math.random()*.6,phase:Math.random()*Math.PI*2}));paint(0,0);
  }
  function tick(time){
    animationFrame=0;if(!motionAllowed()||!inView||document.hidden)return;
    const elapsed=time-previousTime;if(elapsed>=32){paint(time,Math.min(elapsed/1000,.06));previousTime=time;}animationFrame=requestAnimationFrame(tick);
  }
  cancelParticles=()=>{cancelAnimationFrame(animationFrame);animationFrame=0;};
  resumeParticles=()=>{if(!animationFrame&&motionAllowed()&&inView&&!document.hidden){previousTime=performance.now();animationFrame=requestAnimationFrame(tick);}};
  resize();
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas.parentElement);else window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelParticles();else resumeParticles();});resumeParticles();
}

// Interactive Mouse: Small dot with smooth fading particle trail
if (finePointer.matches) {
  const trailCanvas = document.createElement('canvas');
  trailCanvas.className = 'mouse-trail-canvas';
  const trailCtx = trailCanvas.getContext('2d');
  const dot = document.createElement('div');
  dot.className = 'cursor-dot cursor-hidden';
  document.body.append(trailCanvas, dot);

  let width = 0, height = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeTrail() {
    width = window.innerWidth;
    height = window.innerHeight;
    trailCanvas.width = Math.round(width * dpr);
    trailCanvas.height = Math.round(height * dpr);
    trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeTrail();
  window.addEventListener('resize', resizeTrail, { passive: true });

  const trailPoints = [];
  const maxPoints = 26;
  let prevX = -100, prevY = -100;
  let lastMoveTime = 0;

  window.addEventListener('pointermove', e => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    dot.classList.remove('cursor-hidden');

    if (!motionAllowed()) return;

    const x = e.clientX;
    const y = e.clientY;
    const now = performance.now();
    const dt = now - lastMoveTime;
    lastMoveTime = now;

    if (dt > 180) {
      trailPoints.length = 0;
      prevX = x;
      prevY = y;
    }

    const dist = Math.hypot(x - prevX, y - prevY);

    if (dist > 3) {
      trailPoints.push({
        x: x,
        y: y,
        age: 0,
        maxAge: 22,
        radius: Math.min(3.5, Math.max(1.8, dist * 0.1))
      });
      prevX = x;
      prevY = y;
      if (trailPoints.length > maxPoints) {
        trailPoints.shift();
      }
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    dot.classList.add('cursor-hidden');
    trailPoints.length = 0;
  });

  const interactiveTarget = 'a, button, .service-card, .system-showcase-card, .hero-stats-card, .flow-node, .flow-core, summary, .round-link, .eco-card, .partner-card';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactiveTarget)) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if (!e.relatedTarget || !e.relatedTarget.closest(interactiveTarget)) {
      document.body.classList.remove('cursor-hover');
    }
  });
  document.addEventListener('pointerdown', () => document.body.classList.add('cursor-active'));
  document.addEventListener('pointerup', () => document.body.classList.remove('cursor-active'));

  function renderTrail() {
    trailCtx.clearRect(0, 0, width, height);

    if (trailPoints.length > 0 && motionAllowed()) {
      if (trailPoints.length > 1) {
        for (let i = 0; i < trailPoints.length - 1; i++) {
          const p1 = trailPoints[i];
          const p2 = trailPoints[i + 1];
          const progress = (i + 1) / trailPoints.length;
          const life = Math.min(1 - (p1.age / p1.maxAge), 1 - (p2.age / p2.maxAge));
          const alpha = Math.max(0, life) * progress * 0.72;

          if (alpha > 0.01) {
            trailCtx.beginPath();
            trailCtx.moveTo(p1.x, p1.y);
            trailCtx.lineTo(p2.x, p2.y);
            trailCtx.strokeStyle = `rgba(0, 168, 232, ${alpha.toFixed(3)})`;
            trailCtx.lineWidth = Math.max(1, p1.radius * progress * 1.5);
            trailCtx.lineCap = 'round';
            trailCtx.lineJoin = 'round';
            trailCtx.shadowColor = '#00a8e8';
            trailCtx.shadowBlur = 6;
            trailCtx.stroke();
          }
        }
      }

      trailCtx.shadowBlur = 8;
      trailCtx.shadowColor = '#62d8ff';
      for (let i = 0; i < trailPoints.length; i++) {
        const p = trailPoints[i];
        const life = 1 - (p.age / p.maxAge);
        if (life > 0.02) {
          const r = p.radius * life * 0.75;
          const a = life * 0.55;
          trailCtx.fillStyle = `rgba(163, 229, 255, ${a.toFixed(3)})`;
          trailCtx.beginPath();
          trailCtx.arc(p.x, p.y, Math.max(0.6, r), 0, Math.PI * 2);
          trailCtx.fill();
        }
        p.age++;
      }

      while (trailPoints.length > 0 && trailPoints[0].age >= trailPoints[0].maxAge) {
        trailPoints.shift();
      }
    }

    requestAnimationFrame(renderTrail);
  }
  requestAnimationFrame(renderTrail);
}

/* ==========================================================================
   RAIO-X DIGITAL MARÉ FLOW — ONBOARDING & DIAGNÓSTICO INTERATIVO
   ========================================================================== */
(function initRaioX() {
  // CONFIGURAÇÃO DO WEBHOOK (Insira a URL do Make ou n8n abaixo)
  const WEBHOOK_RAIO_X = "";

  // Elementos do DOM
  const modal = document.getElementById('raio-x-modal');
  if (!modal) return;

  const openBtns = document.querySelectorAll('.raio-x-trigger-btn, #open-raio-x-btn, a[href="#raio-x-modal"]');
  const closeBtn = document.getElementById('rx-close-btn');
  const backdrop = document.getElementById('rx-backdrop');
  const header = document.getElementById('rx-header');
  const backBtn = document.getElementById('rx-back-btn');
  const stepIndicator = document.getElementById('rx-step-indicator');
  const progressFill = document.getElementById('rx-progress-fill');

  // Telas (Panels)
  const panelWelcome = document.getElementById('rx-step-welcome');
  const panelQuestion = document.getElementById('rx-step-question');
  const panelScanning = document.getElementById('rx-step-scanning');
  const panelLead = document.getElementById('rx-step-lead');
  const panelResult = document.getElementById('rx-step-result');

  // Elementos da Pergunta
  const questionText = document.getElementById('rx-question-text');
  const questionExample = document.getElementById('rx-question-example');
  const optionsList = document.getElementById('rx-options-list');
  const startBtn = document.getElementById('rx-start-btn');

  // Elementos do Formulário de Lead
  const leadForm = document.getElementById('rx-lead-form');
  const inputName = document.getElementById('rx-name');
  const inputWhatsapp = document.getElementById('rx-whatsapp');
  const inputEmail = document.getElementById('rx-email');
  const inputConsent = document.getElementById('rx-consent');
  const submitBtn = document.getElementById('rx-submit-btn');

  // Elementos do Resultado
  const profileTitle = document.getElementById('rx-profile-title');
  const profileDesc = document.getElementById('rx-profile-desc');
  const scoreVal = document.getElementById('rx-score-val');
  const circleProgress = document.getElementById('rx-circle-progress');
  const generalBadge = document.getElementById('rx-general-badge');
  const generalDesc = document.getElementById('rx-general-desc');

  // Elementos dos 5 Pilares
  const barAtendimento = document.getElementById('rx-bar-atendimento');
  const scoreAtendimento = document.getElementById('rx-score-atendimento');
  const itemAtendimento = document.getElementById('rx-pillar-item-atendimento');
  const tagAtendimento = document.getElementById('rx-tag-atendimento');
  const feedbackAtendimento = document.getElementById('rx-feedback-atendimento');

  const barComercial = document.getElementById('rx-bar-comercial');
  const scoreComercial = document.getElementById('rx-score-comercial');
  const itemComercial = document.getElementById('rx-pillar-item-comercial');
  const tagComercial = document.getElementById('rx-tag-comercial');
  const feedbackComercial = document.getElementById('rx-feedback-comercial');

  const barAutomacao = document.getElementById('rx-bar-automacao');
  const scoreAutomacao = document.getElementById('rx-score-automacao');
  const itemAutomacao = document.getElementById('rx-pillar-item-automacao');
  const tagAutomacao = document.getElementById('rx-tag-automacao');
  const feedbackAutomacao = document.getElementById('rx-feedback-automacao');

  const barDados = document.getElementById('rx-bar-dados');
  const scoreDados = document.getElementById('rx-score-dados');
  const itemDados = document.getElementById('rx-pillar-item-dados');
  const tagDados = document.getElementById('rx-tag-dados');
  const feedbackDados = document.getElementById('rx-feedback-dados');

  const barTecnologia = document.getElementById('rx-bar-tecnologia');
  const scoreTecnologia = document.getElementById('rx-score-tecnologia');
  const itemTecnologia = document.getElementById('rx-pillar-item-tecnologia');
  const tagTecnologia = document.getElementById('rx-tag-tecnologia');
  const feedbackTecnologia = document.getElementById('rx-feedback-tecnologia');

  // Pontos de Atenção, Oportunidades, Prioridades & Comparativo
  const obsBox = document.querySelector('.rx-observations-box');
  const obsTitle = document.getElementById('rx-obs-title');
  const observationsList = document.getElementById('rx-observations-list');
  const prioritiesList = document.getElementById('rx-priorities-list');

  const todayBadge = document.getElementById('rx-today-badge');
  const todaySubtitle = document.getElementById('rx-today-subtitle');
  const todayFlowList = document.getElementById('rx-today-flow-list');
  const autoFlowList = document.getElementById('rx-auto-flow-list');
  const autoBadge = document.getElementById('rx-auto-badge');
  const autoTrigger = document.getElementById('rx-auto-trigger');

  const evolveWhatsappBtn = document.getElementById('rx-evolve-whatsapp-btn');
  const retakeBtn = document.getElementById('rx-retake-btn');

  // Perguntas e Pesos
  const RX_QUESTIONS = [
    {
      id: 1,
      question: "Quando um novo lead entra em contato, quanto tempo sua empresa normalmente leva para responder?",
      example: null,
      options: [
        { text: "Imediatamente", score: 100 },
        { text: "Até 10 minutos", score: 80 },
        { text: "Até 1 hora", score: 60 },
        { text: "Algumas horas", score: 35 },
        { text: "Às vezes só respondemos no dia seguinte", score: 15 }
      ]
    },
    {
      id: 2,
      question: "Onde vocês controlam os leads e oportunidades comerciais?",
      example: null,
      options: [
        { text: "CRM", score: 100 },
        { text: "Planilha", score: 60 },
        { text: "WhatsApp", score: 45 },
        { text: "Anotações/processos manuais", score: 20 },
        { text: "Não temos um controle definido", score: 10 }
      ]
    },
    {
      id: 3,
      question: "Quando um cliente pede orçamento e não fecha, o que acontece?",
      example: null,
      options: [
        { text: "Temos follow-up automático", score: 100 },
        { text: "O vendedor recebe um lembrete", score: 75 },
        { text: "Tentamos lembrar manualmente", score: 40 },
        { text: "Normalmente o contato acaba sendo perdido", score: 15 }
      ]
    },
    {
      id: 4,
      question: "Quanto da operação da empresa depende de tarefas manuais e repetitivas?",
      example: null,
      options: [
        { text: "Quase nada", score: 100 },
        { text: "Pouco", score: 80 },
        { text: "Uma parte considerável", score: 55 },
        { text: "Muito", score: 30 },
        { text: "Praticamente tudo", score: 15 }
      ]
    },
    {
      id: 5,
      question: "Você consegue saber exatamente de onde vieram seus leads e suas vendas?",
      example: null,
      options: [
        { text: "Sim, temos tudo rastreado", score: 100 },
        { text: "Sabemos parcialmente", score: 65 },
        { text: "Temos dificuldade para acompanhar", score: 35 },
        { text: "Não sabemos", score: 15 }
      ]
    },
    {
      id: 6,
      question: "Os sistemas da sua empresa conversam entre si?",
      example: "Exemplo: Site → CRM → WhatsApp → Comercial → Gestão",
      options: [
        { text: "Sim, praticamente tudo integrado", score: 100 },
        { text: "Algumas ferramentas estão integradas", score: 70 },
        { text: "Temos várias ferramentas separadas", score: 40 },
        { text: "Quase tudo funciona isoladamente", score: 15 }
      ]
    },
    {
      id: 7,
      question: "Se você ficasse 7 dias fora da empresa, conseguiria acompanhar os principais números pelo celular?",
      example: null,
      options: [
        { text: "Sim, tranquilamente", score: 100 },
        { text: "Apenas algumas informações", score: 65 },
        { text: "Precisaria falar com a equipe", score: 35 },
        { text: "Não teria uma visão clara", score: 15 }
      ]
    },
    {
      id: 8,
      question: "Como você definiria hoje o uso de tecnologia na sua empresa?",
      example: null,
      options: [
        { text: "Tecnologia faz parte da nossa estratégia", score: 100 },
        { text: "Utilizamos várias ferramentas, mas ainda falta integração", score: 70 },
        { text: "Estamos começando a organizar isso", score: 40 },
        { text: "Ainda trabalhamos de maneira muito manual", score: 15 }
      ]
    }
  ];

  // Estado do Raio-X
  let currentQuestionIndex = 0;
  let userAnswers = []; // { questionIndex, answer, score }
  let isSubmitting = false;

  // Sanitização de texto contra injeção de HTML
  function sanitize(str) {
    const temp = document.createElement('div');
    temp.textContent = str || '';
    return temp.innerHTML;
  }

  // Máscara brasileira para telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  function formatPhone(val) {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (!digits.length) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  if (inputWhatsapp) {
    inputWhatsapp.addEventListener('input', (e) => {
      e.target.value = formatPhone(e.target.value);
    });
  }

  // Captura parâmetros de UTM da URL
  function getUTMs() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || '',
      medium: params.get('utm_medium') || '',
      campaign: params.get('utm_campaign') || '',
      content: params.get('utm_content') || '',
      term: params.get('utm_term') || ''
    };
  }

  // Controle de Telas (Panels)
  function showPanel(panel) {
    [panelWelcome, panelQuestion, panelScanning, panelLead, panelResult].forEach(p => {
      if (p) {
        p.classList.remove('active');
        p.style.display = 'none';
      }
    });
    if (panel) {
      panel.style.display = 'block';
      // Força reflow para ativar animação CSS
      void panel.offsetWidth;
      panel.classList.add('active');
    }
  }

  // Abrir Modal
  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rx-modal-open');
    if (userAnswers.length === 0) {
      goToWelcome();
    }
  }

  // Fechar Modal
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('rx-modal-open');
  }

  openBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  }));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Tela de Apresentação
  function goToWelcome() {
    header.style.display = 'none';
    currentQuestionIndex = 0;
    userAnswers = [];
    showPanel(panelWelcome);
  }

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      currentQuestionIndex = 0;
      userAnswers = [];
      goToQuestion(0);
    });
  }

  // Renderizar Pergunta Atual
  function goToQuestion(index) {
    currentQuestionIndex = index;
    const q = RX_QUESTIONS[index];
    if (!q) return;

    header.style.display = 'block';
    stepIndicator.textContent = `Pergunta ${index + 1} de ${RX_QUESTIONS.length}`;
    const pct = ((index + 1) / RX_QUESTIONS.length) * 100;
    progressFill.style.width = `${pct}%`;

    backBtn.style.visibility = index === 0 ? 'hidden' : 'visible';

    questionText.textContent = q.question;
    if (q.example) {
      questionExample.textContent = q.example;
      questionExample.style.display = 'block';
    } else {
      questionExample.style.display = 'none';
    }

    optionsList.innerHTML = '';
    const selectedAnswer = userAnswers[index];

    q.options.forEach((opt, optIndex) => {
      const item = document.createElement('div');
      item.className = 'rx-option-item';
      if (selectedAnswer && selectedAnswer.optIndex === optIndex) {
        item.classList.add('selected');
      }
      item.setAttribute('role', 'radio');
      item.setAttribute('aria-checked', selectedAnswer && selectedAnswer.optIndex === optIndex ? 'true' : 'false');
      item.tabIndex = 0;

      item.innerHTML = `
        <span>${sanitize(opt.text)}</span>
        <span class="rx-option-radio" aria-hidden="true"></span>
      `;

      const selectOpt = () => {
        optionsList.querySelectorAll('.rx-option-item').forEach(el => {
          el.classList.remove('selected');
          el.setAttribute('aria-checked', 'false');
        });
        item.classList.add('selected');
        item.setAttribute('aria-checked', 'true');

        userAnswers[currentQuestionIndex] = {
          question: q.question,
          answer: opt.text,
          score: opt.score,
          optIndex
        };

        // Avanço suave após micro-delay para feedback tátil
        setTimeout(() => {
          if (currentQuestionIndex < RX_QUESTIONS.length - 1) {
            goToQuestion(currentQuestionIndex + 1);
          } else {
            goToScanning();
          }
        }, 360);
      };

      item.addEventListener('click', selectOpt);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectOpt();
        }
      });

      optionsList.appendChild(item);
    });

    showPanel(panelQuestion);
  }

  // Botão Voltar
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (currentQuestionIndex > 0) {
        goToQuestion(currentQuestionIndex - 1);
      }
    });
  }

  // Tela de Análise / Radar
  function goToScanning() {
    header.style.display = 'none';
    showPanel(panelScanning);

    const scanItems = panelScanning.querySelectorAll('.rx-scan-item');
    scanItems.forEach(it => {
      it.classList.remove('active', 'done');
    });

    // Sequência animada dos 5 passos do scanner
    let stepIdx = 0;
    function runNextScan() {
      if (stepIdx < scanItems.length) {
        const item = scanItems[stepIdx];
        item.classList.add('active');
        setTimeout(() => {
          item.classList.add('done');
          stepIdx++;
          setTimeout(runNextScan, 280);
        }, 340);
      } else {
        // Concluiu scanner: avança para captura de lead
        setTimeout(goToLead, 450);
      }
    }

    setTimeout(runNextScan, 250);
  }

  // Tela de Captura de Lead
  function goToLead() {
    header.style.display = 'none';
    showPanel(panelLead);
    clearLeadErrors();
    if (inputName) inputName.focus();
  }

  function clearLeadErrors() {
    document.querySelectorAll('.rx-field-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
  }

  function showLeadError(fieldId, msg) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
    }
  }

  // Sistema de Cálculo de Pontuação (0 a 100) & Diagnóstico Personalizado
  function computeDiagnostics() {
    const qScores = userAnswers.map(a => a.score);
    const ansTexts = userAnswers.map(a => a.answer);
    const Q1 = qScores[0] ?? 50;
    const Q2 = qScores[1] ?? 50;
    const Q3 = qScores[2] ?? 50;
    const Q4 = qScores[3] ?? 50;
    const Q5 = qScores[4] ?? 50;
    const Q6 = qScores[5] ?? 50;
    const Q7 = qScores[6] ?? 50;
    const Q8 = qScores[7] ?? 50;

    // Fórmulas ponderadas para cada pilar
    const atendimento = Math.min(100, Math.max(10, Math.round((Q1 * 0.70) + (Q3 * 0.30))));
    const comercial = Math.min(100, Math.max(10, Math.round((Q2 * 0.50) + (Q3 * 0.35) + (Q5 * 0.15))));
    const automacao = Math.min(100, Math.max(10, Math.round((Q4 * 0.45) + (Q3 * 0.30) + (Q6 * 0.25))));
    const dados = Math.min(100, Math.max(10, Math.round((Q5 * 0.50) + (Q7 * 0.50))));
    const tecnologia = Math.min(100, Math.max(10, Math.round((Q6 * 0.55) + (Q8 * 0.45))));

    // Score Geral (Maturidade Digital)
    const scoreGeral = Math.min(100, Math.max(10, Math.round((atendimento + comercial + automacao + dados + tecnologia) / 5)));

    // Determinação do Perfil
    let profile = {};
    if (scoreGeral <= 35) {
      profile = {
        title: "OPERAÇÃO MANUAL & VULNERÁVEL",
        desc: "Sua empresa ainda depende fortemente de tarefas manuais para rotinas essenciais, gerando perda silenciosa de tempo, clientes e receita."
      };
    } else if (scoreGeral <= 60) {
      profile = {
        title: "OPERAÇÃO EM TRANSIÇÃO",
        desc: "Sua empresa já utiliza tecnologia, mas ferramentas e processos ainda funcionam de maneira desconectada e dependem de esforço manual diário da equipe."
      };
    } else if (scoreGeral <= 80) {
      profile = {
        title: "OPERAÇÃO CONECTADA",
        desc: "Sua empresa possui boa organização operacional, com grandes oportunidades para implementar automações com inteligência artificial e predição de dados."
      };
    } else {
      profile = {
        title: "OPERAÇÃO INTELIGENTE & ESCALÁVEL",
        desc: "A tecnologia é um pilar estratégico do seu negócio, com processos maduros e prontos para hiper-escala com automações de ponta a ponta."
      };
    }

    // Classificação Geral da Maturidade Digital (Regra: 0-39, 40-69, 70-100)
    let generalClassification = {};
    if (scoreGeral <= 39) {
      generalClassification = {
        status: "PONTO DE ATENÇÃO",
        statusClass: "status-attention",
        desc: "Sua operação apresenta pontos importantes que merecem atenção. Processos manuais, falta de integração ou pouca visibilidade dos dados podem estar limitando o crescimento e consumindo tempo da equipe."
      };
    } else if (scoreGeral <= 69) {
      generalClassification = {
        status: "OPERAÇÃO EM EVOLUÇÃO",
        statusClass: "status-evolution",
        desc: "Sua empresa já possui uma base digital estruturada, mas ainda existem oportunidades importantes para ganhar eficiência, controle e escala."
      };
    } else {
      generalClassification = {
        status: "OPERAÇÃO OTIMIZADA",
        statusClass: "status-optimized",
        desc: "Sua operação apresenta um bom nível de maturidade digital, com processos estruturados e tecnologia bem aplicada. Ainda existem oportunidades pontuais para aumentar eficiência e escala."
      };
    }

    // Feedback Personalizado para cada Pilar baseado nas respostas individuais
    // 1. Atendimento
    let feedbackAtendimento = "";
    if (Q1 <= 35) {
      feedbackAtendimento = "Principal oportunidade: novos leads aguardam horas ou até o dia seguinte para serem respondidos. Mais de 60% dos contatos em potencial desistem ou fecham com concorrentes nesse intervalo.";
    } else if (Q1 <= 60) {
      feedbackAtendimento = "Ponto observado: tempo de resposta entre 10 minutos e 1 hora. A equipe atende bem em horário comercial, mas contatos no almoço, noite ou fins de semana acabam esfriando.";
    } else if (Q1 <= 80) {
      feedbackAtendimento = "Destaque: boa velocidade de resposta em horário comercial (até 10 minutos). O próximo passo é atendimento instantâneo 24/7 com IA integrada ao WhatsApp.";
    } else {
      feedbackAtendimento = "Destaque: atendimento imediato e ágil. O salto de escala agora é a triagem e qualificação autônoma por IA antes de acionar a equipe comercial.";
    }

    // 2. Comercial
    let feedbackComercial = "";
    if (ansTexts[1] === "WhatsApp") {
      feedbackComercial = "Principal oportunidade: o uso do WhatsApp pessoal como base de dados deixa conversas, contatos e orçamentos retidos nos aparelhos, sem histórico centralizado.";
    } else if (ansTexts[1] === "Planilha") {
      feedbackComercial = "Ponto observado: gestão comercial em planilhas exige preenchimento manual diário, deixando o funil estático e follow-ups de orçamentos descontinuados.";
    } else if (["Anotações/processos manuais", "Não temos um controle definido"].includes(ansTexts[1])) {
      feedbackComercial = "Principal oportunidade: implementar controle comercial centralizado para evitar perda de negociações por falta de rastreamento do funil.";
    } else if (ansTexts[2] === "Normalmente o contato acaba sendo perdido" || ansTexts[2] === "Tentamos lembrar manualmente") {
      feedbackComercial = "Ponto observado: mesmo com CRM, o acompanhamento pós-orçamento ainda depende de lembrança manual. Automatizar essa rotina recupera vendas ativas.";
    } else {
      feedbackComercial = "Destaque: processo comercial estruturado com CRM e rotina consistente de acompanhamento das oportunidades.";
    }

    // 3. Automação
    let feedbackAutomacao = "";
    if (Q4 <= 30) {
      feedbackAutomacao = "Principal oportunidade: automatizar tarefas repetitivas que hoje sobrecarregam o dia a dia da equipe, gerando lentidão e retrabalho operacional.";
    } else if (Q4 <= 55) {
      feedbackAutomacao = "Ponto observado: rotinas essenciais funcionam, mas a redigitação de informações e repasses manuais entre sistemas ainda consomem horas produtivas.";
    } else {
      feedbackAutomacao = "Destaque: alta eficiência operacional no fluxo diário, com rotinas ágeis bem estabelecidas e baixo atrito manual.";
    }

    // 4. Dados & Métricas
    let feedbackDados = "";
    if (dados <= 35) {
      feedbackDados = "Principal oportunidade: estruturar relatórios em tempo real para rastrear de onde vêm os clientes mais lucrativos e acompanhar a operação à distância pelo celular.";
    } else if (dados <= 65) {
      feedbackDados = "Ponto observado: visibilidade parcial dos indicadores. Integrar custos de aquisição e conversão final trará maior precisão nas decisões.";
    } else {
      feedbackDados = "Destaque: excelente controle de dados, com visão clara das origens dos leads e métricas operacionais acessíveis na palma da mão.";
    }

    // 5. Tecnologia & Integração
    let feedbackTecnologia = "";
    if (tecnologia <= 35) {
      feedbackTecnologia = "Principal oportunidade: conectar ferramentas que hoje operam isoladas (site, WhatsApp, planilhas), eliminando pontes manuais que travam a escala.";
    } else if (tecnologia <= 65) {
      feedbackTecnologia = "Ponto observado: boas ferramentas em uso, com oportunidade de conectar o fluxo ponta a ponta através de integrações diretas.";
    } else {
      feedbackTecnologia = "Destaque: ecossistema tecnológico integrado e conectado como vantagem estratégica para o crescimento do negócio.";
    }

    const feedbacks = {
      atendimento: feedbackAtendimento,
      comercial: feedbackComercial,
      automacao: feedbackAutomacao,
      dados: feedbackDados,
      tecnologia: feedbackTecnologia
    };

    // Geração Inteligente de OPORTUNIDADES (Exatamente 3 itens reais baseados nas respostas)
    const oppCandidates = [];

    // Oportunidade 1: Atendimento / Primeiro Contato
    if (ansTexts[0].includes("dia seguinte") || ansTexts[0].includes("Algumas horas")) {
      oppCandidates.push({
        title: "Primeiro contato",
        text: "O tempo de resposta no WhatsApp pode estar fazendo sua empresa perder oportunidades para concorrentes mais rápidos."
      });
    } else if (ansTexts[0].includes("1 hora")) {
      oppCandidates.push({
        title: "Primeiro contato",
        text: "A demora de até 1 hora para responder no WhatsApp esfria leads no momento de maior interesse."
      });
    }

    // Oportunidade 2: Gestão Comercial
    if (ansTexts[1] === "WhatsApp") {
      oppCandidates.push({
        title: "Gestão comercial",
        text: "O uso do WhatsApp pessoal como base de dados deixa histórico e orçamentos retidos nos celulares, sem controle central."
      });
    } else if (ansTexts[1] === "Planilha") {
      oppCandidates.push({
        title: "Gestão comercial",
        text: "A ausência de um processo centralizado dificulta acompanhar negociações e medir conversões em tempo real."
      });
    } else if (ansTexts[1].includes("Anotações") || ansTexts[1].includes("Não temos")) {
      oppCandidates.push({
        title: "Gestão comercial",
        text: "A falta de um controle centralizado de leads faz oportunidades serem esquecidas sem acompanhamento."
      });
    } else if (ansTexts[2].includes("perdido") || ansTexts[2].includes("lembrar manualmente")) {
      oppCandidates.push({
        title: "Follow-up de propostas",
        text: "Orçamentos sem rotina de retorno acabam sendo perdidos, diminuindo o retorno dos investimentos em captação."
      });
    }

    // Oportunidade 3: Automação
    if (ansTexts[3].includes("Praticamente tudo") || ansTexts[3].includes("Muito")) {
      oppCandidates.push({
        title: "Automação",
        text: "Existem tarefas repetitivas que podem ser automatizadas para liberar tempo da equipe e evitar erros."
      });
    } else if (ansTexts[3].includes("Uma parte considerável")) {
      oppCandidates.push({
        title: "Automação",
        text: "Rotinas manuais e repasses de informações diminuem o ritmo diário e consomem horas de trabalho produtivo."
      });
    }

    // Oportunidade 4: Rastreamento & Dados
    if (ansTexts[4].includes("Não sabemos") || ansTexts[4].includes("dificuldade")) {
      oppCandidates.push({
        title: "Rastreamento de dados",
        text: "Sem rastrear com clareza a origem dos leads, torna-se difícil identificar os canais de marketing mais lucrativos."
      });
    }

    // Oportunidade 5: Integração de Sistemas
    if (ansTexts[5].includes("isoladamente") || ansTexts[5].includes("várias ferramentas")) {
      oppCandidates.push({
        title: "Integração de sistemas",
        text: "Ferramentas que operam isoladas exigem redigitação constante entre WhatsApp, planilhas e sistemas de gestão."
      });
    }

    // Oportunidade 6: Gestão Remota
    if (ansTexts[6].includes("Não teria") || ansTexts[6].includes("falar com a equipe")) {
      oppCandidates.push({
        title: "Gestão remota",
        text: "A ausência de um painel no celular impede você de acompanhar os números e vendas da empresa à distância."
      });
    }

    // Fallbacks inteligentes se a empresa tiver poucos pontos de atenção
    if (oppCandidates.length < 3) {
      oppCandidates.push({
        title: "Atendimento inteligente 24/7",
        text: "Implementar IA integrada ao WhatsApp para qualificar leads e agendar atendimentos de forma autônoma."
      });
    }
    if (oppCandidates.length < 3) {
      oppCandidates.push({
        title: "Reativação de base",
        text: "Criar fluxos automáticos de pós-venda para resgatar clientes inativos e gerar novas receitas."
      });
    }
    if (oppCandidates.length < 3) {
      oppCandidates.push({
        title: "Hiper-automação",
        text: "Conectar automações avançadas de ponta a ponta para escalar as vendas sem inchar a estrutura operacional."
      });
    }

    const opportunities = oppCandidates.slice(0, 3);

    // Geração das 3 PRIORIDADES RECOMENDADAS (Baseadas nos pilares de menor pontuação)
    const sortedPillars = [
      { key: 'atendimento', val: atendimento },
      { key: 'comercial', val: comercial },
      { key: 'automacao', val: automacao },
      { key: 'dados', val: dados },
      { key: 'tecnologia', val: tecnologia }
    ].sort((a, b) => a.val - b.val);

    const priorityPool = [];
    sortedPillars.forEach(pilar => {
      if (priorityPool.length >= 3) return;

      if (pilar.key === 'atendimento') {
        const isSlow = ansTexts[0].includes("dia seguinte") || ansTexts[0].includes("Algumas horas") || ansTexts[0].includes("1 hora");
        priorityPool.push({
          title: "CENTRALIZAR O ATENDIMENTO",
          desc: isSlow
            ? "Organize os contatos recebidos pelo WhatsApp e outros canais para reduzir o tempo de resposta e evitar oportunidades esquecidas."
            : "Estruture o atendimento comercial no WhatsApp com triagem ágil para qualificar leads e acelerar fechamentos."
        });
      } else if (pilar.key === 'comercial') {
        const isNotCRM = ansTexts[1] !== "CRM";
        priorityPool.push({
          title: "ESTRUTURAR O PROCESSO COMERCIAL",
          desc: isNotCRM
            ? "Centralize leads e negociações em um CRM para acompanhar cada oportunidade do primeiro contato até o fechamento."
            : "Ative cadências automáticas de follow-up pós-orçamento no WhatsApp para recuperar negociações paradas."
        });
      } else if (pilar.key === 'automacao') {
        priorityPool.push({
          title: "AUTOMATIZAR TAREFAS REPETITIVAS",
          desc: "Identifique atividades manuais que podem ser executadas automaticamente, reduzindo trabalho operacional da equipe."
        });
      } else if (pilar.key === 'dados') {
        const noTrack = ansTexts[4].includes("Não sabemos") || ansTexts[4].includes("dificuldade");
        priorityPool.push({
          title: noTrack ? "RASTREAR ORIGENS DE VENDAS" : "CENTRALIZAR MÉTRICAS DA OPERAÇÃO",
          desc: noTrack
            ? "Mapeie a origem de cada cliente para entender com precisão quais canais geram o maior retorno sobre investimento."
            : "Crie um painel de indicadores atualizado em tempo real para acompanhar a evolução da operação pelo celular."
        });
      } else if (pilar.key === 'tecnologia') {
        priorityPool.push({
          title: "INTEGRAR FERRAMENTAS E SISTEMAS",
          desc: "Conecte seus canais de atendimento, vendas e gestão para que as informações transitem sem retrabalho manual."
        });
      }
    });

    const priorities = priorityPool.slice(0, 3).map((item, idx) => ({
      number: idx + 1,
      title: item.title,
      desc: item.desc
    }));

    // Fluxo Comparativo Personalizado
    const comparativeFlow = buildComparativeFlow(ansTexts, qScores, { atendimento, comercial, automacao, dados, tecnologia }, scoreGeral);

    return {
      scores: { atendimento, comercial, automacao, dados, tecnologia },
      scoreGeral,
      profile,
      generalClassification,
      feedbacks,
      opportunities,
      priorities,
      comparativeFlow
    };
  }

  // Construtor do Fluxo Comparativo Dinâmico (HOJE vs COM AUTOMAÇÃO)
  function buildComparativeFlow(ansTexts, qScores, scores, scoreGeral) {
    const q1Ans = (ansTexts && ansTexts[0]) || "";
    const q2Ans = (ansTexts && ansTexts[1]) || "";
    const q3Ans = (ansTexts && ansTexts[2]) || "";
    const q4Ans = (ansTexts && ansTexts[3]) || "";
    const q5Ans = (ansTexts && ansTexts[4]) || "";
    const q6Ans = (ansTexts && ansTexts[5]) || "";
    const q7Ans = (ansTexts && ansTexts[6]) || "";
    const q8Ans = (ansTexts && ansTexts[7]) || "";

    const todayTrigger = "Lead recebido";
    const autoTrigger = "Lead recebido";

    // 1. ATENDIMENTO / RESPOSTA AO LEAD (Pergunta 1)
    let leftStep1 = "Responder manualmente";
    let rightCardWhatsApp = "WhatsApp enviado";

    if (q1Ans.includes("dia seguinte")) {
      leftStep1 = "Resposta no outro dia";
      rightCardWhatsApp = "Atendimento 24/7";
    } else if (q1Ans.includes("Algumas horas")) {
      leftStep1 = "Horas para responder";
      rightCardWhatsApp = "Atendimento 24/7";
    } else if (q1Ans.includes("1 hora")) {
      leftStep1 = "Resposta com atraso";
      rightCardWhatsApp = "WhatsApp imediato";
    } else if (q1Ans.includes("10 minutos")) {
      leftStep1 = "Responder manualmente";
      rightCardWhatsApp = "WhatsApp enviado";
    } else if (q1Ans.includes("Imediatamente")) {
      leftStep1 = "Equipe interrompida";
      rightCardWhatsApp = "Triagem com IA";
    }

    // 2. COMERCIAL / CADASTRO / CRM (Pergunta 2)
    let leftStep2 = "Cadastrar informação";
    let rightCardCRM = "CRM atualizado";

    if (q2Ans === "Planilha") {
      leftStep2 = "Digitar em planilha";
      rightCardCRM = "CRM atualizado";
    } else if (q2Ans === "WhatsApp") {
      leftStep2 = "Preso no WhatsApp";
      rightCardCRM = "Lead salvo no CRM";
    } else if (q2Ans.includes("Anotações") || q2Ans.includes("Não temos")) {
      leftStep2 = "Anotar em papel";
      rightCardCRM = "Oportunidade no CRM";
    } else if (q2Ans === "CRM") {
      leftStep2 = "Cadastrar no CRM";
      rightCardCRM = "CRM integrado";
    }

    // 3. REPASSE & COMUNICAÇÃO INTERNA (Perguntas 6 e 4)
    let leftStep3 = "Avisar vendedor";
    let rightCardNotif = "Responsável notificado";

    if (q6Ans.includes("isoladamente") || q6Ans.includes("várias ferramentas")) {
      leftStep3 = "Copiar dados na mão";
      rightCardNotif = "Canais integrados";
    } else if (q4Ans.includes("Praticamente tudo") || q4Ans.includes("Muito")) {
      leftStep3 = "Repassar à equipe";
      rightCardNotif = "Vendedor acionado";
    } else {
      leftStep3 = "Avisar vendedor";
      rightCardNotif = "Responsável notificado";
    }

    // 4. LEMBRETE & ROTINA DE VENDAS (Perguntas 3 e 4)
    let leftStep4 = "Criar lembrete";
    let rightCardFollowup = "Follow-up programado";

    if (q3Ans.includes("perdido")) {
      leftStep4 = "Contato esquecido";
      rightCardFollowup = "Resgate de vendas";
    } else if (q3Ans.includes("lembrar manualmente")) {
      leftStep4 = "Tentar lembrar";
      rightCardFollowup = "Follow-up programado";
    } else if (q3Ans.includes("recebe um lembrete")) {
      leftStep4 = "Lembrete no celular";
      rightCardFollowup = "Cobrança automática";
    } else if (q3Ans.includes("automático")) {
      leftStep4 = "Conferir tarefas";
      rightCardFollowup = "Rotina autônoma";
    }

    // 5. FECHAMENTO, DADOS & MÉTRICAS (Perguntas 3, 5, 7)
    let leftStep5 = "Fazer follow-up";
    let rightCardDados = "Dados registrados";

    if (q3Ans.includes("perdido")) {
      leftStep5 = "Venda perdida";
    } else if (q5Ans.includes("Não sabemos") || q5Ans.includes("dificuldade")) {
      leftStep5 = "Origem desconhecida";
    } else if (q7Ans.includes("Não teria") || q7Ans.includes("falar com a equipe")) {
      leftStep5 = "Sem visão no celular";
    } else if (q3Ans.includes("lembrar manualmente")) {
      leftStep5 = "Follow-up manual";
    } else {
      leftStep5 = "Fazer follow-up";
    }

    if (q5Ans.includes("Não sabemos") || q5Ans.includes("dificuldade")) {
      rightCardDados = "Origem rastreada";
    } else if (q7Ans.includes("Não teria") || q7Ans.includes("falar com a equipe")) {
      rightCardDados = "Métricas no celular";
    } else if (q4Ans.includes("Praticamente") || q4Ans.includes("Muito")) {
      rightCardDados = "Tarefas automáticas";
    } else {
      rightCardDados = "Dados registrados";
    }

    // Coluna COM AUTOMAÇÃO (5 cards com check em linha única):
    const autoCards = [
      rightCardCRM,
      rightCardWhatsApp,
      rightCardNotif,
      rightCardFollowup,
      rightCardDados
    ];

    // Coluna HOJE (passos lineares em linha única):
    const todaySteps = [
      leftStep1,
      leftStep2,
      leftStep3,
      leftStep4,
      leftStep5
    ];

    return {
      todayBadgeText: "HOJE",
      autoBadgeText: "COM AUTOMAÇÃO",
      todayTrigger,
      autoTrigger,
      todaySteps,
      autoCards
    };
  }

  // Submissão do Formulário de Lead
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearLeadErrors();

      const nameVal = inputName.value.trim();
      const phoneVal = inputWhatsapp.value.trim();
      const emailVal = inputEmail.value.trim();
      const consentVal = inputConsent.checked;

      let hasError = false;

      if (!nameVal || nameVal.length < 2) {
        showLeadError('rx-name', 'Por favor, informe seu nome completo.');
        hasError = true;
      }

      const phoneDigits = phoneVal.replace(/\D/g, '');
      if (!phoneVal || phoneDigits.length < 10) {
        showLeadError('rx-whatsapp', 'Informe um WhatsApp válido com DDD (mínimo 10 dígitos).');
        hasError = true;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailRegex.test(emailVal)) {
        showLeadError('rx-email', 'Informe um endereço de e-mail válido.');
        hasError = true;
      }

      if (!consentVal) {
        showLeadError('rx-consent', 'Você precisa concordar com o envio do diagnóstico.');
        hasError = true;
      }

      if (hasError) return;
      if (isSubmitting) return;

      isSubmitting = true;
      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.rx-btn-text');
      const btnSpinner = submitBtn.querySelector('.rx-btn-spinner');
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'inline-block';

      const diag = computeDiagnostics();
      const utms = getUTMs();

      // Montagem do payload conforme especificação
      const webhookPayload = {
        origem: "Raio-X Digital Maré Flow",
        nome: nameVal,
        whatsapp: phoneVal,
        email: emailVal,
        data_hora: new Date().toISOString(),
        perfil: diag.profile.title,
        score_geral: diag.scoreGeral,
        scores: {
          atendimento: diag.scores.atendimento,
          comercial: diag.scores.comercial,
          automacao: diag.scores.automacao,
          dados: diag.scores.dados,
          tecnologia: diag.scores.tecnologia
        },
        respostas: userAnswers.map(a => ({
          pergunta: a.question,
          resposta: a.answer
        })),
        url_atual: window.location.href,
        url_origem: window.location.href,
        utm_source: utms.source,
        utm_medium: utms.medium,
        utm_campaign: utms.campaign,
        utm_content: utms.content,
        utm_term: utms.term
      };

      // Disparo assíncrono para o Webhook com tratamento tolerante a falhas
      if (WEBHOOK_RAIO_X && WEBHOOK_RAIO_X.trim().startsWith('http')) {
        try {
          await fetch(WEBHOOK_RAIO_X, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload)
          });
        } catch (err) {
          console.warn('Webhook dispatch notification:', err);
        }
      }

      // Renderiza a tela de resultado imediatamente
      isSubmitting = false;
      submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';

      renderResults(diag, nameVal);
    });
  }

  // Renderizar Tela de Resultados Personalizada
  function renderResults(diag, userName) {
    header.style.display = 'none';
    showPanel(panelResult);

    // Perfil
    profileTitle.textContent = diag.profile.title;
    profileDesc.textContent = diag.profile.desc;

    // Classificação Geral da Maturidade Digital
    if (generalBadge && diag.generalClassification) {
      generalBadge.textContent = diag.generalClassification.status;
      generalBadge.className = `rx-general-badge ${diag.generalClassification.statusClass}`;
    }
    if (generalDesc && diag.generalClassification) {
      generalDesc.textContent = diag.generalClassification.desc;
    }

    // Animação do Score Circular & Controle de Movimento do Radar
    const targetScore = diag.scoreGeral;
    let currentScore = 0;
    scoreVal.textContent = '0';

    const resultRadar = document.getElementById('rx-result-radar');
    const resultSweep = document.getElementById('rx-result-sweep');
    if (resultRadar) {
      resultRadar.classList.remove('is-finished');
      resultRadar.classList.add('is-reading');
    }
    if (resultSweep) {
      resultSweep.style.animationPlayState = 'running';
      resultSweep.style.opacity = '1';
    }

    const circleCircumference = 314.16;
    if (circleProgress) {
      circleProgress.style.strokeDashoffset = String(circleCircumference);
      setTimeout(() => {
        const offset = circleCircumference - (circleCircumference * targetScore) / 100;
        circleProgress.style.strokeDashoffset = String(offset);
      }, 100);
    }

    const counterInterval = setInterval(() => {
      currentScore += 1;
      if (currentScore >= targetScore) {
        currentScore = targetScore;
        clearInterval(counterInterval);

        // Leitura concluída: encerra o movimento imediatamente
        if (resultRadar) {
          resultRadar.classList.remove('is-reading');
          resultRadar.classList.add('is-finished');
        }
        if (resultSweep) {
          resultSweep.style.animationPlayState = 'paused';
          resultSweep.style.opacity = '0';
        }
      }
      scoreVal.textContent = String(currentScore);
    }, 18);

    // Renderizar e Categorizar cada um dos 5 Pilares
    const pillarsConfig = [
      { key: 'atendimento', val: diag.scores.atendimento, itemEl: itemAtendimento, tagEl: tagAtendimento, barEl: barAtendimento, scoreEl: scoreAtendimento, feedbackEl: feedbackAtendimento, text: diag.feedbacks.atendimento },
      { key: 'comercial', val: diag.scores.comercial, itemEl: itemComercial, tagEl: tagComercial, barEl: barComercial, scoreEl: scoreComercial, feedbackEl: feedbackComercial, text: diag.feedbacks.comercial },
      { key: 'automacao', val: diag.scores.automacao, itemEl: itemAutomacao, tagEl: tagAutomacao, barEl: barAutomacao, scoreEl: scoreAutomacao, feedbackEl: feedbackAutomacao, text: diag.feedbacks.automacao },
      { key: 'dados', val: diag.scores.dados, itemEl: itemDados, tagEl: tagDados, barEl: barDados, scoreEl: scoreDados, feedbackEl: feedbackDados, text: diag.feedbacks.dados },
      { key: 'tecnologia', val: diag.scores.tecnologia, itemEl: itemTecnologia, tagEl: tagTecnologia, barEl: barTecnologia, scoreEl: scoreTecnologia, feedbackEl: feedbackTecnologia, text: diag.feedbacks.tecnologia }
    ];

    setTimeout(() => {
      pillarsConfig.forEach(p => {
        if (!p.barEl || !p.scoreEl) return;

        // Animação de largura e valor numérico
        p.barEl.style.width = `${p.val}%`;
        p.scoreEl.textContent = `${p.val}%`;

        // Textinho personalizado de feedback por pilar
        if (p.feedbackEl) {
          p.feedbackEl.textContent = p.text;
        }

        // Reset de classes
        if (p.itemEl) {
          p.itemEl.classList.remove('is-attention', 'is-bottleneck', 'is-good', 'is-evolution');
        }
        if (p.tagEl) {
          p.tagEl.className = 'rx-p-tag';
        }
        p.scoreEl.className = 'rx-p-val';
        p.barEl.className = 'rx-p-bar'; // Todas as barras utilizam azul/ciano padrão Maré Flow

        // Classificação: cores vermelho, laranja e verde apenas nos badges de status
        // Destacando apenas a linha de PONTO DE ATENÇÃO
        if (p.val < 40) {
          // Ponto de Atenção (0% a 39%): Linha de progresso vermelha
          if (p.tagEl) {
            p.tagEl.textContent = 'PONTO DE ATENÇÃO';
            p.tagEl.classList.add('tag-bottleneck');
          }
          p.barEl.classList.add('bar-attention');
          if (p.itemEl) {
            p.itemEl.classList.add('is-attention');
          }
        } else if (p.val >= 70) {
          // Otimizado (70% a 100%)
          if (p.tagEl) {
            p.tagEl.textContent = 'OTIMIZADO';
            p.tagEl.classList.add('tag-optimized');
          }
        } else {
          // Em evolução (40% a 69%)
          if (p.tagEl) {
            p.tagEl.textContent = 'EM EVOLUÇÃO';
            p.tagEl.classList.add('tag-evolution');
          }
        }
      });
    }, 150);

    // Oportunidades Identificadas no seu Raio-X
    if (observationsList && diag.opportunities) {
      observationsList.innerHTML = '';
      if (obsBox) {
        obsBox.classList.remove('has-bottlenecks');
      }
      if (obsTitle) {
        obsTitle.textContent = 'OPORTUNIDADES IDENTIFICADAS NO SEU RAIO-X';
      }

      diag.opportunities.forEach(opp => {
        const li = document.createElement('li');
        li.className = 'rx-opp-item';

        const titleEl = document.createElement('strong');
        titleEl.className = 'rx-opp-title';
        titleEl.textContent = opp.title;

        const textEl = document.createElement('p');
        textEl.className = 'rx-opp-text';
        textEl.textContent = opp.text;

        li.appendChild(titleEl);
        li.appendChild(textEl);
        observationsList.appendChild(li);
      });
    }

    // Suas 3 Prioridades Recomendadas
    if (prioritiesList && diag.priorities) {
      prioritiesList.innerHTML = '';
      diag.priorities.forEach(prio => {
        const item = document.createElement('div');
        item.className = 'rx-priority-item';

        const numBox = document.createElement('div');
        numBox.className = 'rx-priority-number';
        numBox.textContent = String(prio.number);

        const content = document.createElement('div');
        content.className = 'rx-priority-content';

        const titleEl = document.createElement('strong');
        titleEl.className = 'rx-priority-title';
        titleEl.textContent = prio.title;

        const descEl = document.createElement('p');
        descEl.className = 'rx-priority-desc';
        descEl.textContent = prio.desc;

        content.appendChild(titleEl);
        content.appendChild(descEl);

        item.appendChild(numBox);
        item.appendChild(content);

        prioritiesList.appendChild(item);
      });
    }

    // Renderizar Comparativo Visual Dinâmico ("HOJE" vs "COM AUTOMAÇÃO")
    const flow = diag.comparativeFlow;
    if (flow) {
      if (todayBadge) todayBadge.textContent = flow.todayBadgeText;
      if (autoBadge) autoBadge.textContent = flow.autoBadgeText;

      // Coluna HOJE: Trigger inicial + Passos lineares com setas
      if (todayFlowList) {
        todayFlowList.innerHTML = '';

        const triggerEl = document.createElement('div');
        triggerEl.className = 'rx-flow-step rx-step-trigger';
        triggerEl.textContent = flow.todayTrigger;
        todayFlowList.appendChild(triggerEl);

        flow.todaySteps.forEach(stepText => {
          const arrow = document.createElement('span');
          arrow.className = 'rx-flow-arrow';
          arrow.setAttribute('aria-hidden', 'true');
          arrow.textContent = '↓';
          todayFlowList.appendChild(arrow);

          const stepEl = document.createElement('div');
          stepEl.className = 'rx-flow-step';
          stepEl.textContent = stepText;
          todayFlowList.appendChild(stepEl);
        });
      }

      // Coluna COM AUTOMAÇÃO: Trigger inicial + Cards com check
      const autoTriggerEl = document.getElementById('rx-auto-trigger');
      if (autoTriggerEl) {
        autoTriggerEl.textContent = flow.autoTrigger;
      }

      if (autoFlowList) {
        autoFlowList.innerHTML = '';
        flow.autoCards.forEach(cardText => {
          const card = document.createElement('div');
          card.className = 'rx-auto-card';

          const check = document.createElement('span');
          check.className = 'rx-auto-card-check';
          check.setAttribute('aria-hidden', 'true');
          check.textContent = '✓';

          const text = document.createElement('span');
          text.className = 'rx-auto-card-text';
          text.textContent = cardText;

          card.appendChild(check);
          card.appendChild(text);
          autoFlowList.appendChild(card);
        });
      }
    }

    // Link WhatsApp Comercial pré-preenchido
    const statusText = diag.generalClassification ? diag.generalClassification.status : diag.profile.title;
    const whatsappMsg = encodeURIComponent(
      `Olá! Fiz o Raio-X Digital da Maré Flow e gostaria de conversar sobre meu diagnóstico.\n\n` +
      `*Nome:* ${userName}\n` +
      `*Status:* ${statusText}\n` +
      `*Score de Maturidade Digital:* ${diag.scoreGeral}/100\n` +
      `*Perfil Identificado:* ${diag.profile.title}\n` +
      `*Atendimento:* ${diag.scores.atendimento}% · *Comercial:* ${diag.scores.comercial}% · *Automação:* ${diag.scores.automacao}% · *Dados:* ${diag.scores.dados}% · *Tecnologia:* ${diag.scores.tecnologia}%`
    );
    evolveWhatsappBtn.href = `https://wa.me/5548998258944?text=${whatsappMsg}`;

    // Rolagem suave para o topo do modal
    const dialog = modal.querySelector('.raio-x-dialog');
    if (dialog) dialog.scrollTop = 0;
  }

  // Refazer Raio-X
  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      currentQuestionIndex = 0;
      userAnswers = [];
      if (inputName) inputName.value = '';
      if (inputWhatsapp) inputWhatsapp.value = '';
      if (inputEmail) inputEmail.value = '';
      goToWelcome();
    });
  }
})();

/* ===== CARROSSEL / MARQUEE DE OFICINAS PARCEIRAS (AUTO-SCROLL SUAVE + ARRASTO TOUCH/MOUSE) ===== */
(function initPartnersMarquee() {
  const marquee = document.getElementById('partners-marquee');
  if (!marquee) return;

  const track = marquee.querySelector('.marquee-track');
  const groups = track ? track.querySelectorAll('.marquee-group') : [];
  if (!track || groups.length < 2) return;

  let currentX = 0;
  let singleWidth = 0;
  let isDown = false;
  let startX = 0;
  let dragStartX = 0;
  let lastTime = performance.now();
  const speed = 26; // pixels por segundo: suave, contínuo e calmo ("bem devagarzinho, sem parar")

  function updateDimensions() {
    if (groups.length >= 2) {
      const diff = groups[1].offsetLeft - groups[0].offsetLeft;
      if (diff > 50) {
        singleWidth = diff;
        return;
      }
    }
    if (groups[0] && groups[0].offsetWidth > 50) {
      singleWidth = groups[0].offsetWidth + 24;
      return;
    }
    singleWidth = 1314;
  }

  // Medições robustas
  updateDimensions();
  window.addEventListener('resize', updateDimensions);
  window.addEventListener('load', updateDimensions);
  setTimeout(updateDimensions, 400);

  // Interação de arrasto com o mouse ou toque (move 1:1 junto com o mouse)
  marquee.addEventListener('pointerdown', (e) => {
    isDown = true;
    marquee.classList.add('is-dragging');
    startX = e.clientX;
    dragStartX = currentX;
    try { marquee.setPointerCapture(e.pointerId); } catch (err) {}
  });

  marquee.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const deltaX = e.clientX - startX;
    currentX = dragStartX - deltaX;
    render();
  });

  const endDrag = (e) => {
    if (!isDown) return;
    isDown = false;
    marquee.classList.remove('is-dragging');
    try { marquee.releasePointerCapture(e.pointerId); } catch (err) {}
    lastTime = performance.now(); // evita salto temporal ao soltar o mouse
  };

  marquee.addEventListener('pointerup', endDrag);
  marquee.addEventListener('pointercancel', endDrag);

  function render() {
    if (singleWidth > 0) {
      currentX = ((currentX % singleWidth) + singleWidth) % singleWidth;
    }
    track.style.transform = `translate3d(${-currentX}px, 0, 0)`;
  }

  // Loop contínuo: passa devagarzinho sem parar (não congela com o mouse em cima)
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!isDown) {
      currentX += speed * dt;
      render();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();




