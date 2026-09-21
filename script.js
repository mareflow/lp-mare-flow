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
  const barAtendimento = document.getElementById('rx-bar-atendimento');
  const scoreAtendimento = document.getElementById('rx-score-atendimento');
  const barComercial = document.getElementById('rx-bar-comercial');
  const scoreComercial = document.getElementById('rx-score-comercial');
  const barAutomacao = document.getElementById('rx-bar-automacao');
  const scoreAutomacao = document.getElementById('rx-score-automacao');
  const barDados = document.getElementById('rx-bar-dados');
  const scoreDados = document.getElementById('rx-score-dados');
  const barTecnologia = document.getElementById('rx-bar-tecnologia');
  const scoreTecnologia = document.getElementById('rx-score-tecnologia');
  const observationsList = document.getElementById('rx-observations-list');
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

  // Sistema de Cálculo de Pontuação (0 a 100)
  function computeDiagnostics() {
    const qScores = userAnswers.map(a => a.score);
    const Q1 = qScores[0] ?? 50;
    const Q2 = qScores[1] ?? 50;
    const Q3 = qScores[2] ?? 50;
    const Q4 = qScores[3] ?? 50;
    const Q5 = qScores[4] ?? 50;
    const Q6 = qScores[5] ?? 50;
    const Q7 = qScores[6] ?? 50;
    const Q8 = qScores[7] ?? 50;

    // Fórmulas ponderadas para cada pilar
    const atendimento = Math.min(100, Math.max(10, Math.round((Q1 * 0.65) + (Q3 * 0.35))));
    const comercial = Math.min(100, Math.max(10, Math.round((Q2 * 0.45) + (Q3 * 0.35) + (Q5 * 0.20))));
    const automacao = Math.min(100, Math.max(10, Math.round((Q4 * 0.45) + (Q3 * 0.30) + (Q6 * 0.25))));
    const dados = Math.min(100, Math.max(10, Math.round((Q5 * 0.45) + (Q7 * 0.40) + (Q2 * 0.15))));
    const tecnologia = Math.min(100, Math.max(10, Math.round((Q6 * 0.40) + (Q8 * 0.40) + (Q7 * 0.20))));

    // Score Geral (Maturidade Digital)
    const scoreGeral = Math.min(100, Math.max(10, Math.round((atendimento + comercial + automacao + dados + tecnologia) / 5)));

    // Determinação do Perfil
    let profile = {};
    if (scoreGeral <= 30) {
      profile = {
        title: "OPERAÇÃO MANUAL",
        desc: "Sua empresa ainda depende fortemente de pessoas e processos manuais para tarefas que poderiam ser organizadas ou automatizadas."
      };
    } else if (scoreGeral <= 55) {
      profile = {
        title: "OPERAÇÃO EM TRANSIÇÃO",
        desc: "Sua empresa já utiliza tecnologia, mas ferramentas e processos ainda funcionam de maneira pouco integrada."
      };
    } else if (scoreGeral <= 80) {
      profile = {
        title: "OPERAÇÃO CONECTADA",
        desc: "Sua empresa possui uma boa estrutura tecnológica, mas ainda existem oportunidades de integração, automação e inteligência de dados."
      };
    } else {
      profile = {
        title: "OPERAÇÃO INTELIGENTE",
        desc: "Tecnologia já faz parte da operação e existe uma estrutura sólida para utilizar automação, integrações e dados de maneira estratégica."
      };
    }

    // Geração de 2 a 4 Observações Personalizadas
    const observations = [];
    const ansTexts = userAnswers.map(a => a.answer);

    // Q2: CRM / Gestão de Leads
    if (ansTexts[1] === "WhatsApp") {
      observations.push("Seu WhatsApp está funcionando também como CRM. Conforme o volume de oportunidades aumenta, isso pode dificultar o acompanhamento dos leads e gerar perda de dados.");
    } else if (["Planilha", "Anotações/processos manuais", "Não temos um controle definido"].includes(ansTexts[1])) {
      observations.push("O controle comercial em planilhas ou anotações descentraliza o histórico das oportunidades e impede a visualização clara do funil em tempo real.");
    }

    // Q3: Follow-up pós-orçamento
    if (["Normalmente o contato acaba sendo perdido", "Tentamos lembrar manualmente"].includes(ansTexts[2])) {
      observations.push("Existem oportunidades comerciais que podem estar sendo perdidas pela ausência de uma rotina estruturada de acompanhamento pós-orçamento.");
    }

    // Q4: Tarefas manuais
    if (["Praticamente tudo", "Muito", "Uma parte considerável"].includes(ansTexts[3])) {
      observations.push("Identificamos processos repetitivos na sua operação diária que possuem grande potencial de automação para liberar tempo da equipe.");
    }

    // Q6: Integração de sistemas
    if (["Quase tudo funciona isoladamente", "Temos várias ferramentas separadas"].includes(ansTexts[5])) {
      observations.push("Suas ferramentas funcionam de maneira isolada. Integrar site, WhatsApp, CRM e gestão pode reduzir retrabalho e centralizar informações.");
    }

    // Q5: Origem de leads
    if (["Não sabemos", "Temos dificuldade para acompanhar"].includes(ansTexts[4])) {
      observations.push("A ausência de rastreamento claro da origem dos contatos dificulta saber com precisão onde seus investimentos geram mais retorno.");
    }

    // Q7: Gestão à distância
    if (["Não teria uma visão clara", "Precisaria falar com a equipe"].includes(ansTexts[6])) {
      observations.push("A gestão à distância fica restrita sem painéis em tempo real que entreguem os principais indicadores da operação direto no seu celular.");
    }

    // Q1: Tempo de resposta
    if (["Às vezes só respondemos no dia seguinte", "Algumas horas"].includes(ansTexts[0])) {
      observations.push("O tempo de resposta aos novos contatos está alto. Uma IA no atendimento qualifica a demanda e responde o visitante em segundos 24/7.");
    }

    // Fallback para garantir entre 2 e 4 observações
    if (observations.length < 2) {
      observations.push("Sua estrutura possui boa base de tecnologia; a próxima etapa de escala envolve inteligência preditiva e agentes autônomos no WhatsApp.");
      observations.push("Recomendamos aprofundar cadências automáticas de retenção ativa para aumentar o retorno de clientes antigos.");
    }

    return {
      scores: { atendimento, comercial, automacao, dados, tecnologia },
      scoreGeral,
      profile,
      observations: observations.slice(0, 4)
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

  // Renderizar Tela de Resultados
  function renderResults(diag, userName) {
    header.style.display = 'none';
    showPanel(panelResult);

    // Perfil
    profileTitle.textContent = diag.profile.title;
    profileDesc.textContent = diag.profile.desc;

    // Animação do Score Circular
    const targetScore = diag.scoreGeral;
    let currentScore = 0;
    scoreVal.textContent = '0';

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
      }
      scoreVal.textContent = String(currentScore);
    }, 18);

    // Animação das Barras dos 5 Pilares
    setTimeout(() => {
      barAtendimento.style.width = `${diag.scores.atendimento}%`;
      scoreAtendimento.textContent = `${diag.scores.atendimento}%`;

      barComercial.style.width = `${diag.scores.comercial}%`;
      scoreComercial.textContent = `${diag.scores.comercial}%`;

      barAutomacao.style.width = `${diag.scores.automacao}%`;
      scoreAutomacao.textContent = `${diag.scores.automacao}%`;

      barDados.style.width = `${diag.scores.dados}%`;
      scoreDados.textContent = `${diag.scores.dados}%`;

      barTecnologia.style.width = `${diag.scores.tecnologia}%`;
      scoreTecnologia.textContent = `${diag.scores.tecnologia}%`;
    }, 150);

    // Lista de Observações
    observationsList.innerHTML = '';
    diag.observations.forEach(obs => {
      const li = document.createElement('li');
      li.textContent = obs;
      observationsList.appendChild(li);
    });

    // Link WhatsApp Comercial pré-preenchido
    const whatsappMsg = encodeURIComponent(
      `Olá! Fiz o Raio-X Digital da Maré Flow e gostaria de conversar sobre meu diagnóstico.\n\n` +
      `*Nome:* ${userName}\n` +
      `*Perfil Identificado:* ${diag.profile.title} (${diag.scoreGeral}/100)\n` +
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




