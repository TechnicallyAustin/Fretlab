"use client";

import { useEffect, useMemo, useState } from "react";

type View = "home" | "path" | "map" | "portfolio";

type Competency = {
  name: string;
  description: string;
  capabilities: string[];
};

type Domain = {
  id: string;
  name: string;
  color: string;
  soft: string;
  description: string;
  competencies: Competency[];
};

const DOMAINS: Domain[] = [
  {
    id: "product",
    name: "Product",
    color: "#5b61d6",
    soft: "#e8e9ff",
    description: "Find valuable problems, shape direction, and turn strategy into outcomes.",
    competencies: [
      { name: "Product Discovery", description: "Reduce uncertainty before committing resources.", capabilities: ["Customer Interviews", "Problem Validation", "Opportunity Mapping", "Solution Testing"] },
      { name: "Product Strategy", description: "Choose where to play and how to win.", capabilities: ["Product Vision", "Strategic Narratives", "Roadmapping", "Portfolio Prioritization"] },
      { name: "Planning & Execution", description: "Align teams around valuable, feasible delivery.", capabilities: ["Requirements", "User Stories", "Acceptance Criteria", "Launch Readiness"] },
      { name: "Product Analytics", description: "Use evidence to steer product decisions.", capabilities: ["North Star Metrics", "Funnel Analysis", "Experiment Design", "Lifecycle Analysis"] },
      { name: "Innovation", description: "Create and test new value propositions.", capabilities: ["Ideation", "Business Model Innovation", "AI Product Discovery", "Concept Validation"] },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    color: "#ff735c",
    soft: "#ffe6e0",
    description: "Create demand by making product value clear, relevant, and memorable.",
    competencies: [
      { name: "Positioning", description: "Frame the product around a valuable market truth.", capabilities: ["Value Proposition", "Competitive Positioning", "Category Design", "Differentiation"] },
      { name: "Messaging", description: "Turn positioning into stories people understand.", capabilities: ["Message Architecture", "Brand Voice", "Storytelling", "Sales Narratives"] },
      { name: "Go-To-Market", description: "Coordinate the path from product to market.", capabilities: ["GTM Strategy", "Launch Planning", "Channel Strategy", "Sales Enablement"] },
      { name: "Demand & Growth", description: "Build repeatable acquisition and expansion loops.", capabilities: ["Demand Generation", "Growth Loops", "Lifecycle Marketing", "Conversion Optimization"] },
      { name: "Marketing Analytics", description: "Measure market response and improve investment.", capabilities: ["Attribution", "Campaign Measurement", "CAC & LTV", "Marketing Experiments"] },
    ],
  },
  {
    id: "business",
    name: "Business",
    color: "#d39b24",
    soft: "#fff1be",
    description: "Connect product choices to economic value and organizational health.",
    competencies: [
      { name: "Finance", description: "Understand how decisions affect financial performance.", capabilities: ["Financial Statements", "Unit Economics", "Budgeting", "Investment Analysis"] },
      { name: "Commercial Models", description: "Design how value is created and captured.", capabilities: ["Business Models", "Pricing Strategy", "Packaging", "Revenue Models"] },
      { name: "Market Economics", description: "Read the forces that shape market behavior.", capabilities: ["Supply & Demand", "Market Structures", "Network Effects", "Switching Costs"] },
      { name: "Sales", description: "Connect buyer needs to a repeatable commercial motion.", capabilities: ["Sales Process", "Pipeline Management", "Enterprise Buying", "Revenue Forecasting"] },
      { name: "Organization", description: "Understand how structures shape performance.", capabilities: ["Operating Models", "Incentive Design", "Organizational Behavior", "Team Effectiveness"] },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    color: "#2a9b86",
    soft: "#ddf1ec",
    description: "Turn raw information into decisions, forecasts, and measurable learning.",
    competencies: [
      { name: "Data Foundations", description: "Work confidently with structured business data.", capabilities: ["SQL", "Data Modeling", "Data Quality", "Metric Definitions"] },
      { name: "Statistics", description: "Reason clearly under uncertainty.", capabilities: ["Distributions", "Sampling", "Hypothesis Testing", "Regression"] },
      { name: "Business Intelligence", description: "Make performance visible and actionable.", capabilities: ["KPI Design", "Dashboard Design", "Self-Service BI", "Data Storytelling"] },
      { name: "Forecasting", description: "Build credible views of future performance.", capabilities: ["Trend Analysis", "Scenario Models", "Demand Forecasting", "Sensitivity Analysis"] },
      { name: "Experimentation", description: "Estimate causal impact and learn quickly.", capabilities: ["A/B Testing", "Experiment Design", "Guardrail Metrics", "Result Interpretation"] },
    ],
  },
  {
    id: "customer",
    name: "Customer",
    color: "#3f7bd6",
    soft: "#e4eefa",
    description: "Build a durable understanding of customer context, progress, and value.",
    competencies: [
      { name: "Customer Understanding", description: "Model who customers are and what matters to them.", capabilities: ["Personas", "Jobs to Be Done", "Needs Segmentation", "Customer Context"] },
      { name: "Customer Research", description: "Collect trustworthy evidence from customers.", capabilities: ["Customer Interviews", "Research Planning", "Survey Design", "Synthesis"] },
      { name: "Journey & Experience", description: "See the end-to-end experience through customer eyes.", capabilities: ["Journey Mapping", "Service Blueprints", "Moment Analysis", "Experience Measurement"] },
      { name: "Voice of Customer", description: "Turn feedback into a decision system.", capabilities: ["Feedback Programs", "Research Repositories", "Insight Prioritization", "Closed-Loop Learning"] },
      { name: "Success & Retention", description: "Help customers realize and expand value.", capabilities: ["Onboarding", "Health Scores", "Churn Analysis", "Expansion Strategy"] },
    ],
  },
  {
    id: "strategy",
    name: "Strategy",
    color: "#8a63bd",
    soft: "#eee6f8",
    description: "Make coherent choices about markets, advantage, and resource allocation.",
    competencies: [
      { name: "Market Intelligence", description: "Develop a grounded view of the external landscape.", capabilities: ["Market Research", "Market Sizing", "Trend Analysis", "Industry Structure"] },
      { name: "Competitive Strategy", description: "Understand alternatives and sources of advantage.", capabilities: ["Competitive Analysis", "Strategic Moats", "Scenario Planning", "Response Strategy"] },
      { name: "Strategic Planning", description: "Translate ambition into aligned choices.", capabilities: ["Strategic Goals", "Choice Cascades", "Resource Allocation", "Strategy Reviews"] },
      { name: "Decision Support", description: "Build evidence for consequential choices.", capabilities: ["Business Cases", "Opportunity Analysis", "Decision Memos", "Risk Analysis"] },
      { name: "Corporate Development", description: "Evaluate paths beyond organic growth.", capabilities: ["Partnership Strategy", "Build-Buy-Partner", "M&A Screening", "Integration Logic"] },
    ],
  },
  {
    id: "operations",
    name: "Operations",
    color: "#cc6a8e",
    soft: "#f8e4ed",
    description: "Design the systems that let teams execute reliably and improve continuously.",
    competencies: [
      { name: "Process Excellence", description: "Make work visible, repeatable, and improvable.", capabilities: ["Process Mapping", "Standard Work", "Root Cause Analysis", "Continuous Improvement"] },
      { name: "Program Delivery", description: "Coordinate complex work across teams.", capabilities: ["Project Management", "Program Management", "Dependency Management", "Risk Management"] },
      { name: "Knowledge Systems", description: "Create useful organizational memory.", capabilities: ["Documentation", "Decision Logs", "Knowledge Bases", "Operating Cadences"] },
      { name: "Automation", description: "Remove friction with thoughtful systems and tools.", capabilities: ["Workflow Automation", "AI Automation", "No-Code Systems", "Operational Metrics"] },
      { name: "Change Management", description: "Help people adopt new ways of working.", capabilities: ["Change Strategy", "Stakeholder Readiness", "Adoption Planning", "Benefits Realization"] },
    ],
  },
  {
    id: "leadership",
    name: "Leadership",
    color: "#e06f45",
    soft: "#fbe6dc",
    description: "Create clarity, trust, and momentum across boundaries and levels.",
    competencies: [
      { name: "Communication", description: "Make complex thinking clear and useful.", capabilities: ["Business Writing", "Executive Presentations", "Story Structure", "Facilitation"] },
      { name: "Influence", description: "Move decisions without relying on authority.", capabilities: ["Stakeholder Management", "Negotiation", "Conflict Navigation", "Coalition Building"] },
      { name: "Decision Making", description: "Improve the quality and pace of choices.", capabilities: ["Decision Framing", "Tradeoff Analysis", "Decision Rights", "Judgment Under Uncertainty"] },
      { name: "Executive Leadership", description: "Operate credibly at senior levels.", capabilities: ["Executive Presence", "Strategic Thinking", "Board Communication", "Organizational Context"] },
      { name: "Team Leadership", description: "Build conditions for sustained performance.", capabilities: ["Coaching", "Delegation", "Feedback", "Talent Development"] },
    ],
  },
];

const WORKFLOW = ["Learn", "Understand", "Practice", "Build", "Validate", "Reflect", "Master"];

const CAREER_PATHS = [
  { role: "Product Management", fit: "Selected", domains: "Product · Customer · Strategy · Leadership" },
  { role: "Product Marketing", fit: "Adjacent", domains: "Marketing · Customer · Strategy · Business" },
  { role: "Business Analytics", fit: "Adjacent", domains: "Analytics · Business · Strategy · Operations" },
  { role: "Product Analytics", fit: "Adjacent", domains: "Analytics · Product · Customer · Business" },
  { role: "Business Operations", fit: "Explore", domains: "Operations · Business · Analytics · Leadership" },
  { role: "Growth Marketing", fit: "Explore", domains: "Marketing · Analytics · Customer · Product" },
  { role: "Customer Success", fit: "Explore", domains: "Customer · Leadership · Business · Operations" },
  { role: "Strategy & Operations", fit: "Explore", domains: "Strategy · Operations · Business · Analytics" },
];

const PATH_MODULES = [
  { number: "01", title: "Understand the customer", description: "Build reliable customer evidence before shaping solutions.", progress: 58, capabilities: ["Jobs to Be Done", "Customer Interviews", "Journey Mapping", "Problem Validation"] },
  { number: "02", title: "Shape product direction", description: "Turn evidence into focused strategic choices.", progress: 25, capabilities: ["Opportunity Mapping", "Product Vision", "Portfolio Prioritization", "Roadmapping"] },
  { number: "03", title: "Create market pull", description: "Make value legible and coordinate a credible market entry.", progress: 0, capabilities: ["Positioning", "Value Proposition", "GTM Strategy", "Launch Planning"] },
  { number: "04", title: "Lead the business", description: "Connect outcomes, economics, and executive decisions.", progress: 0, capabilities: ["North Star Metrics", "Unit Economics", "Business Cases", "Executive Presentations"] },
];

const PORTFOLIO = [
  { type: "Research plan", title: "Customer interview study", capability: "Customer Interviews", status: "In progress", proof: "Plan · script · synthesis" },
  { type: "Decision artifact", title: "Opportunity solution tree", capability: "Opportunity Mapping", status: "Draft", proof: "Evidence · choices · tradeoffs" },
  { type: "Executive narrative", title: "New market recommendation", capability: "Market Sizing", status: "Planned", proof: "Model · memo · presentation" },
];

const NAV: { id: View; label: string; short: string }[] = [
  { id: "home", label: "Home", short: "H" },
  { id: "path", label: "My path", short: "P" },
  { id: "map", label: "Knowledge map", short: "K" },
  { id: "portfolio", label: "Portfolio", short: "E" },
];

const CAPABILITY_CONTENT: Record<string, { summary: string; outcome: string; lessons: string[]; concepts: string[]; methods: string[]; tools: string[]; deliverables: string[] }> = {
  "Customer Interviews": {
    summary: "Learn to plan, run, and synthesize conversations that reveal customer context without leading the witness.",
    outcome: "Produce a defensible insight brief that changes or strengthens a product decision.",
    lessons: ["Writing neutral questions", "Running a discovery interview", "Capturing evidence", "Synthesizing themes"],
    concepts: ["Observed behavior", "Stated preference", "Interview bias", "Signal strength"],
    methods: ["Five-act interview", "Laddering", "Critical incident", "Affinity mapping"],
    tools: ["Research plan", "Interview guide", "Evidence repository", "Synthesis board"],
    deliverables: ["Interview plan", "Discussion guide", "Insight brief", "Decision recommendation"],
  },
};

function capabilityContent(name: string) {
  return CAPABILITY_CONTENT[name] ?? {
    summary: `Develop practical command of ${name.toLowerCase()} and apply it to a consequential commercial product decision.`,
    outcome: `Create an evidence-backed ${name.toLowerCase()} artifact you can explain, defend, and improve.`,
    lessons: [`Foundations of ${name}`, `Choosing the right approach`, `Applying ${name}`, `Reviewing quality`],
    concepts: ["Context", "Quality criteria", "Tradeoffs", "Decision impact"],
    methods: ["Frame", "Analyze", "Apply", "Review"],
    tools: ["Working template", "Decision log", "Review checklist", "AI copilot"],
    deliverables: ["Brief", "Working analysis", "Recommendation", "Executive summary"],
  };
}

function Logo() {
  return (
    <div className="brand" aria-label="Jada home">
      <span className="brand-mark">J</span>
      <span><strong>Jada</strong><small>Knowledge OS</small></span>
    </div>
  );
}

function AppHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-greeting">{title}</h1>
      </div>
      <div className="profile-card" aria-label="Learner profile">
        <span><strong>Jada</strong><small>Product leadership path</small></span>
        <span className="avatar" aria-hidden="true">JD</span>
      </div>
    </header>
  );
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress-wrap" aria-label={label ?? `${value}% complete`}>
      <div className="progress-track"><span style={{ width: `${value}%` }} /></div>
      {label ? <div className="progress-label"><span>{label}</span><strong>{value}%</strong></div> : null}
    </div>
  );
}

function DomainMap({ onSelect }: { onSelect: (domain: Domain) => void }) {
  return (
    <div className="domain-map" aria-label="Eight-domain commercial product leadership map">
      <div className="map-core" aria-hidden="true"><small>One discipline</small><strong>Commercial Product Leadership</strong></div>
      {DOMAINS.map((domain, index) => (
        <button
          className={`map-domain map-domain-${index + 1}`}
          key={domain.id}
          style={{ "--domain": domain.color, "--domain-soft": domain.soft } as React.CSSProperties}
          onClick={() => onSelect(domain)}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{domain.name}</strong>
          <small>{domain.competencies.length} competencies</small>
        </button>
      ))}
    </div>
  );
}

function HomeView({ onView, onDomain, onCapability }: { onView: (view: View) => void; onDomain: (domain: Domain) => void; onCapability: (name: string) => void }) {
  return (
    <>
      <AppHeader eyebrow="Thursday · July 16" title="Good morning, Jada" />
      <section className="home-grid">
        <article className="hero-card">
          <div className="hero-orbit" aria-hidden="true" />
          <p className="section-kicker">Your professional field guide</p>
          <h2>Build the judgment to lead products.</h2>
          <p className="hero-copy">A living map of the knowledge, practice, and evidence behind exceptional commercial product leadership.</p>
          <div className="next-block">
            <div>
              <p className="micro-label">Continue next</p>
              <h3>Customer Interviews</h3>
              <p>Product Discovery · Practice</p>
            </div>
            <button className="icon-action" onClick={() => onCapability("Customer Interviews")} aria-label="Continue Customer Interviews">→</button>
          </div>
          <ProgressBar value={42} label="Capability progress" />
        </article>

        <article className="map-card">
          <div className="section-heading">
            <div><p className="eyebrow">The profession at a glance</p><h2>Your knowledge map</h2><p>Eight connected domains. Start anywhere; always see how the pieces connect.</p></div>
            <button className="text-button" onClick={() => onView("map")}>Explore all <span>→</span></button>
          </div>
          <DomainMap onSelect={onDomain} />
        </article>
      </section>

      <section className="workflow-band" aria-labelledby="workflow-title">
        <div><p className="eyebrow">A repeatable mastery loop</p><h2 id="workflow-title">From knowing to doing</h2></div>
        <ol>
          {WORKFLOW.map((step, index) => <li className={index < 3 ? "is-active" : ""} key={step}><span>{index + 1}</span><strong>{step}</strong></li>)}
        </ol>
      </section>

      <section className="signal-row">
        <button className="signal-card" onClick={() => onView("path")}><span className="signal-icon indigo">42%</span><span><small>Current path</small><strong>Product leadership foundations</strong></span><b>→</b></button>
        <button className="signal-card" onClick={() => onView("portfolio")}><span className="signal-icon coral">03</span><span><small>Evidence in motion</small><strong>Portfolio artifacts</strong></span><b>→</b></button>
        <button className="signal-card" onClick={() => onCapability("Executive Presentations")}><span className="signal-icon aqua">01</span><span><small>Recommended stretch</small><strong>Executive communication</strong></span><b>→</b></button>
      </section>
    </>
  );
}

function PathView({ onCapability }: { onCapability: (name: string) => void }) {
  return (
    <>
      <AppHeader eyebrow="Directed development" title="Your path to product leadership" />
      <section className="path-intro card-shell">
        <div><p className="section-kicker">Current destination</p><h2>Commercial Product Leader</h2><p>Build from customer truth to product direction, market activation, and senior-level influence.</p></div>
        <div className="path-score"><strong>42%</strong><span>path complete</span><ProgressBar value={42} /></div>
      </section>
      <section className="path-layout">
        <div className="module-list">
          <div className="section-heading compact"><div><p className="eyebrow">Four connected modules</p><h2>Your directed path</h2></div></div>
          {PATH_MODULES.map((module) => (
            <article className="path-module" key={module.number}>
              <span className="module-number">{module.number}</span>
              <div className="module-main"><h3>{module.title}</h3><p>{module.description}</p><div className="capability-chip-row">{module.capabilities.map((capability) => <button key={capability} onClick={() => onCapability(capability)}>{capability}</button>)}</div></div>
              <div className="module-progress"><strong>{module.progress}%</strong><ProgressBar value={module.progress} /></div>
            </article>
          ))}
        </div>
        <aside className="career-panel card-shell">
          <p className="eyebrow">Role lenses</p><h2>One map, many careers</h2><p className="panel-copy">Each role changes the priority—not the underlying body of knowledge.</p>
          <div className="role-list">
            {CAREER_PATHS.map((path) => <button className={path.fit === "Selected" ? "selected" : ""} key={path.role}><span><strong>{path.role}</strong><small>{path.domains}</small></span><em>{path.fit}</em></button>)}
          </div>
        </aside>
      </section>
    </>
  );
}

function MapView({ selectedDomain, onDomain, onCapability }: { selectedDomain: Domain; onDomain: (domain: Domain) => void; onCapability: (name: string) => void }) {
  return (
    <>
      <AppHeader eyebrow="Track · Commercial Product Leadership" title="Explore the knowledge map" />
      <section className="map-explorer">
        <aside className="domain-index card-shell" aria-label="Domains">
          <div className="domain-index-head"><p className="eyebrow">8 domains</p><h2>Profession map</h2></div>
          {DOMAINS.map((domain, index) => (
            <button className={domain.id === selectedDomain.id ? "selected" : ""} key={domain.id} onClick={() => onDomain(domain)} style={{ "--domain": domain.color, "--domain-soft": domain.soft } as React.CSSProperties}>
              <span>{String(index + 1).padStart(2, "0")}</span><strong>{domain.name}</strong><small>{domain.competencies.length}</small>
            </button>
          ))}
        </aside>
        <div className="domain-detail card-shell" style={{ "--domain": selectedDomain.color, "--domain-soft": selectedDomain.soft } as React.CSSProperties}>
          <div className="domain-hero"><div className="domain-symbol">{selectedDomain.name.slice(0, 2)}</div><div><p className="eyebrow">Domain</p><h2>{selectedDomain.name}</h2><p>{selectedDomain.description}</p></div><span className="domain-stat"><strong>{selectedDomain.competencies.length}</strong> competencies</span></div>
          <div className="competency-grid">
            {selectedDomain.competencies.map((competency, index) => (
              <article className="competency-card" key={competency.name}>
                <div className="competency-head"><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{competency.name}</h3><p>{competency.description}</p></div></div>
                <div className="capability-list">{competency.capabilities.map((capability) => <button onClick={() => onCapability(capability)} key={capability}><span>{capability}</span><b>→</b></button>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function PortfolioView({ onCapability }: { onCapability: (name: string) => void }) {
  return (
    <>
      <AppHeader eyebrow="Proof of practice" title="Your evidence portfolio" />
      <section className="portfolio-hero card-shell">
        <div><p className="section-kicker">Make your judgment visible</p><h2>Work that proves what you can do.</h2><p>Every capability produces evidence: not busywork, but decision-ready artifacts you can explain, defend, and improve.</p></div>
        <div className="portfolio-total"><strong>3</strong><span>active artifacts</span></div>
      </section>
      <section className="portfolio-layout">
        <div className="artifact-column">
          <div className="section-heading compact"><div><p className="eyebrow">Current work</p><h2>Evidence in motion</h2></div><button className="primary-button" onClick={() => onCapability("Customer Interviews")}>Continue building</button></div>
          <div className="artifact-grid">
            {PORTFOLIO.map((artifact, index) => (
              <button className="artifact-card" onClick={() => onCapability(artifact.capability)} key={artifact.title}>
                <span className={`artifact-number artifact-${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
                <span className="artifact-type">{artifact.type}</span><strong>{artifact.title}</strong><small>{artifact.capability}</small>
                <span className="artifact-proof">{artifact.proof}</span><span className={`status status-${index + 1}`}>{artifact.status}</span>
              </button>
            ))}
          </div>
        </div>
        <aside className="proof-panel card-shell"><p className="eyebrow">Senior-proof standard</p><h2>Every artifact should show</h2><ol>{["Context and the decision at hand", "Evidence, not just assertions", "Tradeoffs and alternatives", "A clear recommendation", "Measures of success", "Reflection and next improvement"].map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></aside>
      </section>
    </>
  );
}

function CapabilityWorkspace({ name, completed, onToggle, onBack }: { name: string; completed: string[]; onToggle: (step: string) => void; onBack: () => void }) {
  const content = capabilityContent(name);
  const currentIndex = WORKFLOW.findIndex((step) => !completed.includes(`${name}:${step}`));
  const activeIndex = currentIndex === -1 ? WORKFLOW.length - 1 : currentIndex;
  const progress = Math.round((completed.filter((item) => item.startsWith(`${name}:`)).length / WORKFLOW.length) * 100);
  return (
    <div className="capability-workspace">
      <button className="back-button" onClick={onBack}>← Back to your map</button>
      <header className="capability-hero">
        <div><p className="eyebrow">Capability workspace · Product Discovery</p><h1>{name}</h1><p>{content.summary}</p></div>
        <div className="mastery-score"><span>Mastery progress</span><strong>{progress}%</strong><ProgressBar value={progress} /></div>
      </header>
      <nav className="capability-workflow" aria-label="Mastery workflow">
        {WORKFLOW.map((step, index) => { const done = completed.includes(`${name}:${step}`); return <button key={step} className={done ? "done" : index === activeIndex ? "current" : ""} onClick={() => onToggle(step)}><span>{done ? "✓" : index + 1}</span><strong>{step}</strong><small>{done ? "Complete" : index === activeIndex ? "Up next" : "Not started"}</small></button>; })}
      </nav>
      <section className="capability-body">
        <main>
          <article className="learning-brief card-shell"><p className="section-kicker">Learning brief</p><h2>What good looks like</h2><p className="outcome">{content.outcome}</p><div className="brief-grid"><div><h3>Theory & concepts</h3>{content.concepts.map((item) => <span key={item}>{item}</span>)}</div><div><h3>Methods</h3>{content.methods.map((item) => <span key={item}>{item}</span>)}</div><div><h3>Tools</h3>{content.tools.map((item) => <span key={item}>{item}</span>)}</div></div></article>
          <article className="lesson-panel card-shell"><div className="section-heading compact"><div><p className="eyebrow">Learn</p><h2>Four focused lessons</h2></div><span className="time-badge">48 min total</span></div><ol>{content.lessons.map((lesson, index) => <li key={lesson}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{lesson}</strong><small>{10 + index * 2} min · Lesson</small></div><button aria-label={`Open ${lesson}`}>→</button></li>)}</ol></article>
        </main>
        <aside>
          <article className="build-panel"><p className="eyebrow">Build</p><h2>Your evidence pack</h2><p>Turn learning into work a hiring manager or executive could inspect.</p>{content.deliverables.map((deliverable, index) => <button key={deliverable}><span>{index + 1}</span><strong>{deliverable}</strong><small>{index === 0 ? "In progress" : "Not started"}</small></button>)}</article>
          <article className="validation-panel card-shell"><p className="eyebrow">Validate</p><h2>Eight ways to prove mastery</h2><div>{["Explain it", "Apply it", "Analyze it", "Build it", "Measure it", "Improve it", "Communicate it", "Teach it"].map((lens, index) => <span className={index < 2 ? "active" : ""} key={lens}>{index < 2 ? "✓" : "○"} {lens}</span>)}</div></article>
        </aside>
      </section>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [selectedDomainId, setSelectedDomainId] = useState("product");
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>(["Customer Interviews:Learn", "Customer Interviews:Understand"]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("jada-mastery-progress");
      if (saved) {
        try { setCompleted(JSON.parse(saved)); } catch { /* use the starter progress */ }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem("jada-mastery-progress", JSON.stringify(completed));
  }, [completed, ready]);

  const selectedDomain = useMemo(() => DOMAINS.find((domain) => domain.id === selectedDomainId) ?? DOMAINS[0], [selectedDomainId]);

  function openDomain(domain: Domain) {
    setSelectedDomainId(domain.id);
    setSelectedCapability(null);
    setView("map");
  }

  function navigate(next: View) {
    setSelectedCapability(null);
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleWorkflow(step: string) {
    if (!selectedCapability) return;
    const key = `${selectedCapability}:${step}`;
    setCompleted((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key]);
  }

  if (selectedCapability) {
    return <CapabilityWorkspace name={selectedCapability} completed={completed} onToggle={toggleWorkflow} onBack={() => setSelectedCapability(null)} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <p className="nav-label">Workspace</p>
        <nav className="side-nav" aria-label="Primary navigation">
          {NAV.map((item) => <button className={view === item.id ? "active" : ""} key={item.id} onClick={() => navigate(item.id)}><span>{item.short}</span><strong>{item.label}</strong></button>)}
        </nav>
        <div className="sidebar-note"><span className="note-spark">✦</span><div><strong>One idea at a time.</strong><p>The map holds the complexity so you can focus on the next meaningful step.</p></div></div>
      </aside>
      <main className="main-content">
        {view === "home" && <HomeView onView={navigate} onDomain={openDomain} onCapability={setSelectedCapability} />}
        {view === "path" && <PathView onCapability={setSelectedCapability} />}
        {view === "map" && <MapView selectedDomain={selectedDomain} onDomain={setSelectedDomainId} onCapability={setSelectedCapability} />}
        {view === "portfolio" && <PortfolioView onCapability={setSelectedCapability} />}
      </main>
    </div>
  );
}
