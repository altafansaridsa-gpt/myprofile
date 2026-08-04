// =========================================
// PARTICLE SYSTEM
// =========================================
(function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var particles = [];
  var animId;
  var paused = false;
  var isMobile = window.innerWidth < 768;
  var PARTICLE_COUNT = isMobile ? 35 : 80;
  var CONNECTION_DIST = 120;
  var SHOW_CONNECTIONS = !isMobile;

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    particles = [];
    var w = window.innerWidth;
    var h = window.innerHeight;
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.4,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        baseAlpha: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    if (paused) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.phase += 0.008;

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      var alpha = p.baseAlpha + Math.sin(p.phase) * 0.1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fill();
    }

    if (SHOW_CONNECTIONS) {
      var distSq = CONNECTION_DIST * CONNECTION_DIST;
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < distSq) {
            var lineAlpha = (1 - d2 / distSq) * 0.06;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(255,255,255,' + lineAlpha + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      isMobile = window.innerWidth < 768;
      PARTICLE_COUNT = isMobile ? 35 : 80;
      SHOW_CONNECTIONS = !isMobile;
      resize();
      createParticles();
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
