// =========================================
// NEURAL NETWORK BACKGROUND
// Forward & backward propagation visualization
// =========================================
(function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var animId;
  var paused = false;
  var isMobile = window.innerWidth < 768;

  var neurons = [];
  var connections = [];
  var signals = [];

  var cfg = {
    layers: isMobile ? 6 : 9,
    neuronsMin: isMobile ? 4 : 7,
    neuronsMax: isMobile ? 8 : 12,
    maxSignals: isMobile ? 12 : 24,
    spawnRate: 0.03,
    connectionProb: 0.55,
    chainForward: 0.5,
    chainBackward: 0.45
  };

  var FWD_COLORS = [
    { r: 0, g: 255, b: 136 },
    { r: 0, g: 255, b: 170 },
    { r: 0, g: 230, b: 118 }
  ];
  var BWD_COLORS = [
    { r: 102, g: 68, b: 255 },
    { r: 136, g: 102, b: 255 },
    { r: 124, g: 58, b: 237 }
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildNetwork() {
    neurons = [];
    connections = [];
    signals = [];

    var w = window.innerWidth;
    var h = window.innerHeight;
    var mx = w * 0.06;
    var my = h * 0.08;
    var layerGap = (w - mx * 2) / (cfg.layers - 1);
    var availH = h - my * 2;

    for (var l = 0; l < cfg.layers; l++) {
      var count = cfg.neuronsMin + Math.floor(Math.random() * (cfg.neuronsMax - cfg.neuronsMin + 1));
      if (l > 1 && l < cfg.layers - 2) count = Math.min(count + 1, cfg.neuronsMax);

      for (var n = 0; n < count; n++) {
        neurons.push({
          x: mx + l * layerGap + (Math.random() - 0.5) * layerGap * 0.25,
          y: my + (n + 0.5) * (availH / count) + (Math.random() - 0.5) * availH * 0.08,
          layer: l,
          radius: 1.4 + Math.random() * 2.2,
          baseAlpha: 0.2 + Math.random() * 0.25,
          activation: 0,
          actColor: null,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    for (var i = 0; i < neurons.length; i++) {
      for (var j = 0; j < neurons.length; j++) {
        if (neurons[j].layer === neurons[i].layer + 1 && Math.random() < cfg.connectionProb) {
          connections.push({ from: i, to: j });
        }
      }
    }

    for (var i = 0; i < neurons.length; i++) {
      var ni = neurons[i];
      if (ni.layer < cfg.layers - 1) {
        var hasOut = false;
        for (var c = 0; c < connections.length; c++) { if (connections[c].from === i) { hasOut = true; break; } }
        if (!hasOut) {
          var t = [];
          for (var j = 0; j < neurons.length; j++) { if (neurons[j].layer === ni.layer + 1) t.push(j); }
          if (t.length) connections.push({ from: i, to: pick(t) });
        }
      }
      if (ni.layer > 0) {
        var hasIn = false;
        for (var c = 0; c < connections.length; c++) { if (connections[c].to === i) { hasIn = true; break; } }
        if (!hasIn) {
          var s = [];
          for (var j = 0; j < neurons.length; j++) { if (neurons[j].layer === ni.layer - 1) s.push(j); }
          if (s.length) connections.push({ from: pick(s), to: i });
        }
      }
    }

  }

  function spawnSignal() {
    if (signals.length >= cfg.maxSignals || !connections.length) return;

    var isForward = Math.random() < 0.6;
    var connIdx, color;

    if (isForward) {
      var early = [];
      for (var i = 0; i < connections.length; i++) {
        if (neurons[connections[i].from].layer < 2) early.push(i);
      }
      connIdx = early.length ? pick(early) : Math.floor(Math.random() * connections.length);
      color = pick(FWD_COLORS);
      signals.push({
        ci: connIdx, progress: 0,
        speed: 0.006 + Math.random() * 0.008,
        dir: 'fwd', r: color.r, g: color.g, b: color.b,
        glow: 3 + Math.random() * 4
      });
    } else {
      var late = [];
      for (var i = 0; i < connections.length; i++) {
        if (neurons[connections[i].to].layer > cfg.layers - 3) late.push(i);
      }
      connIdx = late.length ? pick(late) : Math.floor(Math.random() * connections.length);
      color = pick(BWD_COLORS);
      signals.push({
        ci: connIdx, progress: 1,
        speed: -(0.005 + Math.random() * 0.007),
        dir: 'bwd', r: color.r, g: color.g, b: color.b,
        glow: 2.5 + Math.random() * 3.5
      });
    }
  }

  function curvePoint(c, t) {
    var a = neurons[c.from], b = neurons[c.to];
    var mx = (a.x + b.x) / 2;
    var my = (a.y + b.y) / 2 + (a.y - b.y) * 0.15;
    var u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * mx + t * t * b.x, y: u * u * a.y + 2 * u * t * my + t * t * b.y };
  }

  function drawCurve(c) {
    var a = neurons[c.from], b = neurons[c.to];
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + (a.y - b.y) * 0.15, b.x, b.y);
  }

  function draw() {
    if (paused) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    if (Math.random() < cfg.spawnRate) spawnSignal();

    ctx.beginPath();
    for (var i = 0; i < connections.length; i++) drawCurve(connections[i]);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    for (var i = signals.length - 1; i >= 0; i--) {
      var s = signals[i];
      var c = connections[s.ci];
      s.progress += s.speed;

      if (s.progress > 1.05 || s.progress < -0.05) {
        var tgt = s.dir === 'fwd' ? c.to : c.from;
        neurons[tgt].activation = 1;
        neurons[tgt].actColor = s.dir;

        var cp = s.dir === 'fwd' ? cfg.chainForward : cfg.chainBackward;
        if (Math.random() < cp && signals.length < cfg.maxSignals) {
          var next = [];
          for (var j = 0; j < connections.length; j++) {
            if (s.dir === 'fwd' ? connections[j].from === c.to : connections[j].to === c.from) next.push(j);
          }
          if (next.length) {
            var ni = pick(next);
            signals.push({
              ci: ni, progress: s.dir === 'fwd' ? 0 : 1,
              speed: s.dir === 'fwd' ? (0.006 + Math.random() * 0.008) : -(0.005 + Math.random() * 0.007),
              dir: s.dir, r: s.r, g: s.g, b: s.b, glow: s.glow
            });
          }
        }
        signals.splice(i, 1);
        continue;
      }

      var t = Math.max(0, Math.min(1, s.progress));
      var pos = curvePoint(c, t);
      var cs = Math.round(s.r) + ',' + Math.round(s.g) + ',' + Math.round(s.b);

      ctx.beginPath();
      drawCurve(c);
      ctx.strokeStyle = 'rgba(' + cs + ',0.15)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      var gr = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, s.glow * 3);
      gr.addColorStop(0, 'rgba(' + cs + ',0.7)');
      gr.addColorStop(0.35, 'rgba(' + cs + ',0.2)');
      gr.addColorStop(1, 'rgba(' + cs + ',0)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, s.glow * 3, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, s.glow * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + cs + ',1)';
      ctx.fill();
    }

    for (var i = 0; i < neurons.length; i++) {
      var n = neurons[i];
      n.phase += 0.008;
      if (n.activation > 0) n.activation = Math.max(0, n.activation - 0.018);

      var alpha = n.baseAlpha + Math.sin(n.phase) * 0.04 + n.activation * 0.4;

      if (n.activation > 0.05) {
        var gc = n.actColor === 'fwd' ? '0,255,136' : '102,68,255';
        var gg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 10);
        gg.addColorStop(0, 'rgba(' + gc + ',' + (n.activation * 0.45) + ')');
        gg.addColorStop(1, 'rgba(' + gc + ',0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 10, 0, Math.PI * 2);
        ctx.fillStyle = gg;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }

  resize();
  buildNetwork();
  draw();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      isMobile = window.innerWidth < 768;
      cfg.layers = isMobile ? 6 : 9;
      cfg.neuronsMin = isMobile ? 4 : 7;
      cfg.neuronsMax = isMobile ? 8 : 12;
      cfg.maxSignals = isMobile ? 12 : 24;
      resize();
      buildNetwork();
    }, 200);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      paused = true;
      cancelAnimationFrame(animId);
    } else {
      paused = false;
      draw();
    }
  });
})();

// =========================================
// NAV SCROLL STATE
// =========================================
(function () {
  var nav = document.getElementById('nav');
  var ticking = false;

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        nav.classList.toggle('scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  });
})();

// =========================================
// MOBILE NAV TOGGLE
// =========================================
(function () {
  var toggle = document.getElementById('navToggle');
  var mobile = document.getElementById('navMobile');
  if (!toggle || !mobile) return;

  toggle.addEventListener('click', function () {
    mobile.classList.toggle('open');
  });

  mobile.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { mobile.classList.remove('open'); });
  });
})();

// =========================================
// SCROLL REVEAL
// =========================================
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach(function (el) { observer.observe(el); });
})();

// =========================================
// ACTIVE NAV LINK HIGHLIGHT
// =========================================
(function () {
  var sections = document.querySelectorAll('section[id]');
  var links = document.querySelectorAll('.nav__links a');

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          links.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(function (s) { observer.observe(s); });
})();

// =========================================
// SMOOTH ANCHOR SCROLL
// =========================================
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    var navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10
    ) || 64;
    var top = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });
});

// =========================================
// PROJECT DATA & MODAL
// =========================================
(function () {
  var projectData = [
    {
      title: 'Kareem Agent',
      tags: ['LLMs', 'Agentic AI', 'RAG', 'FastAPI', 'LangChain'],
      bgClass: 'project-card__bg--1',
      summary: 'An AI-powered support and analysis assistant built using LLMs, agentic workflows, semantic search, and retrieval-augmented generation. Designed to automate support operations, improve information retrieval, and assist users with complex queries across enterprise knowledge bases.',
      problem: 'Support teams were spending significant time manually searching through documentation, past tickets, and knowledge bases to answer complex user queries. Response times were slow, accuracy was inconsistent, and the volume of requests was growing beyond what manual processes could handle efficiently.',
      approach: 'Built an agentic AI system that combines multiple capabilities: semantic search over enterprise documents, retrieval-augmented generation for accurate answer synthesis, and multi-step reasoning workflows that can break complex queries into sub-tasks. The agent uses tool-calling patterns to decide when to search, when to analyze, and when to escalate.',
      stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'OpenAI', 'Azure OpenAI', 'Vector Database', 'Redis', 'Docker'],
      outcome: 'Significantly reduced average response time for support queries. The system handles a large portion of incoming questions autonomously, freeing human agents to focus on complex edge cases. Accuracy improved through grounded, citation-backed responses.'
    },
    {
      title: 'Text-to-SQL Platform',
      tags: ['NLP', 'SQL', 'LLMs', 'APIs', 'FastAPI'],
      bgClass: 'project-card__bg--2',
      summary: 'Built intelligent APIs capable of converting natural language requests into database queries, enabling easier access to business data and analytics for non-technical stakeholders across the organization.',
      problem: 'Business analysts and stakeholders needed to request data from engineering teams, creating bottlenecks. Non-technical users could not query databases directly, leading to delays in decision-making and over-reliance on a small number of technical staff.',
      approach: 'Designed a multi-stage pipeline: schema understanding layer that maps natural language concepts to database structure, an LLM-powered SQL generation engine with robust prompt engineering, a validation layer that checks generated queries for safety and correctness, and a natural language response formatter that presents results clearly.',
      stack: ['Python', 'FastAPI', 'OpenAI', 'PostgreSQL', 'SQLAlchemy', 'Pydantic', 'Docker', 'AWS'],
      outcome: 'Enabled non-technical stakeholders to query business data directly using natural language. Reduced data request turnaround from days to seconds. Built-in guardrails prevent destructive queries and ensure only read-access operations are executed.'
    },
    {
      title: 'Semantic Search & RAG Systems',
      tags: ['RAG', 'Embeddings', 'Vector DB', 'LLMs', 'Search'],
      bgClass: 'project-card__bg--3',
      summary: 'Designed and deployed retrieval systems that improve answer accuracy by combining large language models with enterprise knowledge bases for intelligent, context-aware responses to complex information needs.',
      problem: 'Traditional keyword-based search systems were failing to surface relevant information from large enterprise document stores. Users had to manually sift through results, and the search system could not understand intent, context, or semantic relationships between concepts.',
      approach: 'Implemented a hybrid retrieval architecture combining dense vector embeddings with sparse keyword matching. Documents are chunked intelligently, embedded using state-of-the-art models, and stored in a vector database. At query time, a retrieval pipeline fetches the most relevant chunks, reranks them, and feeds them to an LLM that synthesizes an accurate, grounded answer with source citations.',
      stack: ['Python', 'LangChain', 'OpenAI Embeddings', 'FAISS', 'Pinecone', 'FastAPI', 'Redis', 'Docker'],
      outcome: 'Dramatically improved information retrieval accuracy compared to keyword search. Users get direct answers with source citations instead of lists of documents. The system handles complex multi-hop queries that were previously impossible with traditional search.'
    },
    {
      title: 'Computer Vision Platform',
      tags: ['YOLOv5/v8', 'PyTorch', 'Computer Vision', 'ML Ops'],
      bgClass: 'project-card__bg--4',
      summary: 'Developed a YOLOv5/v8-based computer vision solution achieving high accuracy while significantly reducing manual review efforts through automated visual intelligence and real-time detection capabilities.',
      problem: 'Manual visual inspection and review processes were time-consuming, error-prone, and could not scale. Human reviewers suffered from fatigue-related accuracy drops, and the volume of visual data needing review was growing beyond capacity.',
      approach: 'Trained and fine-tuned YOLOv5 and YOLOv8 object detection models on domain-specific datasets. Built a complete ML pipeline including data annotation tooling, model training infrastructure, evaluation dashboards, and a production serving layer with real-time inference capabilities. Implemented confidence thresholds and human-in-the-loop escalation for edge cases.',
      stack: ['Python', 'PyTorch', 'YOLOv5', 'YOLOv8', 'OpenCV', 'AWS SageMaker', 'Docker', 'FastAPI'],
      outcome: 'Achieved high detection accuracy on production data. Significantly reduced the manual review workload, with the system handling the majority of routine cases autonomously. Processing time dropped from minutes to sub-second per image.'
    },
    {
      title: 'AI Invoice Extraction',
      tags: ['Azure Functions', 'LangChain', 'Azure OpenAI', 'PyMuPDF', 'Python'],
      bgClass: 'project-card__bg--5',
      summary: 'A cloud-native document intelligence pipeline on Azure that automatically extracts structured data from diverse invoice formats using LLMs. Azure Functions trigger on file upload, process PDFs through an AI extraction layer, and persist results to a SQL database for downstream UI consumption.',
      problem: 'The organization receives invoices in multiple different formats from various vendors across the 340B contract pharmacy program. Manual data entry was slow, error-prone, and could not scale with increasing invoice volume. Each format had different field layouts, making traditional rule-based extraction fragile and expensive to maintain.',
      approach: 'Built an event-driven pipeline on Azure: files uploaded to Azure Blob Storage automatically trigger an Azure Function. The function retrieves the PDF, uses PyMuPDF to extract raw text content, then sends it through a LangChain prompt chain backed by Azure OpenAI to intelligently parse fields regardless of invoice format. The LLM output is validated, mapped to a structured JSON schema, and inserted into SQL Server. The UI team consumes the extracted data via existing APIs.',
      stack: ['Python', 'Azure Functions', 'Azure Blob Storage', 'Azure OpenAI', 'LangChain', 'PyMuPDF', 'SQL Server', 'Pydantic'],
      outcome: 'Eliminated manual invoice data entry entirely. The system handles multiple invoice formats without format-specific rules, adapting to layout variations through LLM comprehension. Processing time dropped from minutes of manual work per invoice to seconds of automated extraction with high accuracy.'
    },
    {
      title: 'LangGraph Multi-Agent System',
      tags: ['LangGraph', 'Multi-Agent', 'Sub-Agents', 'Python', 'LLMs'],
      bgClass: 'project-card__bg--6',
      summary: 'A proof-of-concept multi-level agent orchestration system built on LangGraph, featuring hierarchical sub-agent delegation for complex, multi-step reasoning and task execution workflows.',
      problem: 'Single-agent architectures hit limitations when dealing with tasks that require diverse expertise or multi-step reasoning across different domains. A monolithic agent prompt becomes unwieldy, context windows fill up, and the agent struggles with tasks that need specialized sub-skills applied in sequence or parallel.',
      approach: 'Designed a hierarchical agent architecture using LangGraph where a supervisor agent decomposes complex tasks and delegates sub-tasks to specialized child agents. Each sub-agent has its own tools, system prompt, and domain focus. The supervisor coordinates execution flow, aggregates results, handles failures, and synthesizes final outputs. The graph-based state management enables conditional routing, parallel execution branches, and iterative refinement loops.',
      stack: ['Python', 'LangGraph', 'LangChain', 'OpenAI', 'Azure OpenAI'],
      outcome: 'Demonstrated that hierarchical multi-agent systems outperform single-agent approaches on complex, multi-domain tasks. The modular architecture allows new sub-agents to be added without modifying existing ones, enabling scalable growth of system capabilities.'
    },
    {
      title: 'KYPB — Know Your Product Better',
      tags: ['AI Agents', 'Python', 'Dashboards', 'Code Quality', 'LLMs'],
      bgClass: 'project-card__bg--7',
      summary: 'A one-stop product intelligence agent that provides instant answers about product architecture, ongoing issues, resolution metrics, and code quality — all powered by AI models and interactive dashboards.',
      problem: 'Product knowledge was scattered across documentation, codebases, Jira boards, and tribal knowledge. Teams spent significant time tracking down information about product architecture, issue timelines, and code health. There was no single source of truth for cross-cutting product intelligence.',
      approach: 'Built an AI-powered agent that ingests product documentation, issue trackers, and source code repositories. The agent answers natural language queries about product features, architecture, and workflows. Integrated dashboards surface real-time metrics: ongoing issues, average resolution times, issue trends, and code quality reports covering vulnerabilities, duplications, and maintainability scores. Code analysis pipelines run on each commit to keep quality data current.',
      stack: ['Python', 'LLMs', 'LangChain', 'FastAPI', 'SonarQube', 'Jira API', 'React', 'PostgreSQL', 'Docker'],
      outcome: 'Consolidated product intelligence into a single platform. Teams get instant answers to product queries instead of searching across tools. Code quality dashboards reduced undetected vulnerabilities and drove measurable improvements in code maintainability across multiple products.'
    }
  ];

  var modal = document.getElementById('projectModal');
  var modalHero = document.getElementById('modalHero');
  var modalContent = document.getElementById('modalContent');
  if (!modal || !modalHero || !modalContent) return;

  function openModal(index) {
    var data = projectData[index];
    if (!data) return;

    modalHero.className = 'project-modal__hero';
    modalHero.innerHTML = '<div class="' + data.bgClass + '" style="position:absolute;inset:0;"></div>' +
      '<div class="project-card__overlay" style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,rgba(13,13,13,0.95) 100%);"></div>';

    var tagsHtml = '<div class="modal-tags">' + data.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>';
    var stackHtml = '<div class="modal-stack">' + data.stack.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>';

    modalContent.innerHTML =
      '<h2>' + data.title + '</h2>' +
      tagsHtml +
      '<div class="modal-section"><h3>Summary</h3><p>' + data.summary + '</p></div>' +
      '<div class="modal-section"><h3>The Problem</h3><p>' + data.problem + '</p></div>' +
      '<div class="modal-section"><h3>Approach</h3><p>' + data.approach + '</p></div>' +
      '<div class="modal-section"><h3>Tech Stack</h3>' + stackHtml + '</div>' +
      '<div class="modal-section"><h3>Outcome</h3><p>' + data.outcome + '</p></div>';

    modal.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('.project-card[data-project]').forEach(function (card) {
    card.addEventListener('click', function () {
      var idx = parseInt(this.getAttribute('data-project'), 10);
      openModal(idx);
    });
  });

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
})();
