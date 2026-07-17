"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FocusNotice, ProgressBar, ProgressValue, SectionHeader, SubconceptCard, Surface } from "@/components/design-system";
import { DomainTutorPrompt } from "@/components/learning/DomainTutorPrompt";
import { buildLessonBrief } from "@/lib/lessonBriefs";

type View = "home" | "path" | "map" | "projects" | "portfolio";

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

type PathModule = {
  number: string;
  title: string;
  description: string;
  progress: number;
  capabilities: string[];
};

type RolePath = {
  role: string;
  domains: string;
  destination: string;
  description: string;
  progress: number;
  modules: PathModule[];
};

type Project = {
  id: string;
  title: string;
  stage: "Foundation" | "Applied" | "Integrated" | "Capstone";
  domain: string;
  difficulty: string;
  time: string;
  summary: string;
  capabilities: string[];
  deliverables: string[];
  steps: string[];
};

type LessonSelection = {
  capability: string;
  title: string;
  index: number;
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

const ROLE_PATHS: RolePath[] = [
  {
    role: "Product Management", domains: "Product · Customer · Strategy · Leadership", destination: "Commercial Product Leader", progress: 42,
    description: "Build from customer truth to product direction, market activation, and senior-level influence.",
    modules: [
      { number: "01", title: "Understand the customer", description: "Build reliable customer evidence before shaping solutions.", progress: 58, capabilities: ["Jobs to Be Done", "Customer Interviews", "Journey Mapping", "Problem Validation"] },
      { number: "02", title: "Shape product direction", description: "Turn evidence into focused strategic choices.", progress: 25, capabilities: ["Opportunity Mapping", "Product Vision", "Portfolio Prioritization", "Roadmapping"] },
      { number: "03", title: "Create market pull", description: "Make value legible and coordinate a credible market entry.", progress: 0, capabilities: ["Positioning", "Value Proposition", "GTM Strategy", "Launch Planning"] },
      { number: "04", title: "Lead the business", description: "Connect outcomes, economics, and executive decisions.", progress: 0, capabilities: ["North Star Metrics", "Unit Economics", "Business Cases", "Executive Presentations"] },
    ],
  },
  {
    role: "Product Marketing", domains: "Marketing · Customer · Strategy · Business", destination: "Strategic Product Marketer", progress: 28,
    description: "Translate market truth into positioning, launches, demand, and commercial alignment.",
    modules: [
      { number: "01", title: "Read the market", description: "Understand customers, alternatives, and market structure.", progress: 44, capabilities: ["Market Research", "Customer Interviews", "Competitive Analysis", "Needs Segmentation"] },
      { number: "02", title: "Define the story", description: "Make product value clear and differentiated.", progress: 31, capabilities: ["Positioning", "Value Proposition", "Message Architecture", "Storytelling"] },
      { number: "03", title: "Activate the market", description: "Coordinate a launch and create demand.", progress: 18, capabilities: ["GTM Strategy", "Launch Planning", "Demand Generation", "Sales Enablement"] },
      { number: "04", title: "Measure impact", description: "Connect programs to commercial outcomes.", progress: 0, capabilities: ["Attribution", "CAC & LTV", "Campaign Measurement", "Executive Presentations"] },
    ],
  },
  {
    role: "Business Analytics", domains: "Analytics · Business · Strategy · Operations", destination: "Business Analytics Leader", progress: 24,
    description: "Turn business questions into trustworthy models, insight, and decision support.",
    modules: [
      { number: "01", title: "Build data fluency", description: "Create reliable foundations for analysis.", progress: 52, capabilities: ["SQL", "Data Modeling", "Data Quality", "Metric Definitions"] },
      { number: "02", title: "Explain performance", description: "Make operating signals visible and useful.", progress: 24, capabilities: ["KPI Design", "Dashboard Design", "Funnel Analysis", "Data Storytelling"] },
      { number: "03", title: "Model the future", description: "Build forecasts and compare scenarios.", progress: 12, capabilities: ["Trend Analysis", "Scenario Models", "Demand Forecasting", "Sensitivity Analysis"] },
      { number: "04", title: "Influence decisions", description: "Turn analysis into executive action.", progress: 0, capabilities: ["Business Cases", "Decision Memos", "Tradeoff Analysis", "Executive Presentations"] },
    ],
  },
  {
    role: "Product Analytics", domains: "Analytics · Product · Customer · Business", destination: "Product Analytics Leader", progress: 19,
    description: "Connect user behavior, experimentation, and product strategy through evidence.",
    modules: [
      { number: "01", title: "Instrument the product", description: "Define events, metrics, and trustworthy data.", progress: 38, capabilities: ["Metric Definitions", "Data Quality", "North Star Metrics", "SQL"] },
      { number: "02", title: "Understand behavior", description: "Diagnose journeys, funnels, and retention.", progress: 25, capabilities: ["Funnel Analysis", "Lifecycle Analysis", "Journey Mapping", "Churn Analysis"] },
      { number: "03", title: "Run experiments", description: "Estimate impact and make causal claims carefully.", progress: 12, capabilities: ["Experiment Design", "A/B Testing", "Guardrail Metrics", "Result Interpretation"] },
      { number: "04", title: "Shape product choices", description: "Bring evidence into planning and prioritization.", progress: 0, capabilities: ["Opportunity Analysis", "Portfolio Prioritization", "Data Storytelling", "Decision Memos"] },
    ],
  },
  {
    role: "Business Operations", domains: "Operations · Business · Analytics · Leadership", destination: "Business Operations Leader", progress: 21,
    description: "Design operating systems that make strategy executable and improvement continuous.",
    modules: [
      { number: "01", title: "See the system", description: "Make work, constraints, and outcomes visible.", progress: 41, capabilities: ["Process Mapping", "Operating Models", "Operational Metrics", "Root Cause Analysis"] },
      { number: "02", title: "Run the business", description: "Create effective cadences and decision flows.", progress: 27, capabilities: ["Operating Cadences", "Program Management", "Decision Rights", "Resource Allocation"] },
      { number: "03", title: "Improve the system", description: "Remove friction and scale better practices.", progress: 10, capabilities: ["Workflow Automation", "Continuous Improvement", "AI Automation", "Benefits Realization"] },
      { number: "04", title: "Lead change", description: "Build alignment and durable adoption.", progress: 0, capabilities: ["Change Strategy", "Stakeholder Readiness", "Facilitation", "Executive Presentations"] },
    ],
  },
  {
    role: "Growth Marketing", domains: "Marketing · Analytics · Customer · Product", destination: "Growth Marketing Leader", progress: 17,
    description: "Build measurable acquisition, activation, retention, and expansion systems.",
    modules: [
      { number: "01", title: "Find growth insight", description: "Understand motivation, behavior, and friction.", progress: 35, capabilities: ["Needs Segmentation", "Customer Interviews", "Funnel Analysis", "Journey Mapping"] },
      { number: "02", title: "Design growth loops", description: "Connect channels, product behavior, and value.", progress: 20, capabilities: ["Growth Loops", "Lifecycle Marketing", "Channel Strategy", "Value Proposition"] },
      { number: "03", title: "Experiment rigorously", description: "Test changes with trustworthy measures.", progress: 12, capabilities: ["Conversion Optimization", "A/B Testing", "Guardrail Metrics", "Marketing Experiments"] },
      { number: "04", title: "Scale investment", description: "Allocate spend using commercial evidence.", progress: 0, capabilities: ["CAC & LTV", "Attribution", "Campaign Measurement", "Scenario Models"] },
    ],
  },
  {
    role: "Customer Success", domains: "Customer · Leadership · Business · Operations", destination: "Customer Success Leader", progress: 23,
    description: "Build systems that help customers realize, retain, and expand value.",
    modules: [
      { number: "01", title: "Define customer value", description: "Understand progress, needs, and success conditions.", progress: 45, capabilities: ["Jobs to Be Done", "Customer Interviews", "Journey Mapping", "Experience Measurement"] },
      { number: "02", title: "Guide value realization", description: "Design onboarding and proactive support.", progress: 29, capabilities: ["Onboarding", "Service Blueprints", "Health Scores", "Feedback Programs"] },
      { number: "03", title: "Protect retention", description: "Detect risk and improve the experience.", progress: 14, capabilities: ["Churn Analysis", "Closed-Loop Learning", "Root Cause Analysis", "Lifecycle Analysis"] },
      { number: "04", title: "Grow accounts", description: "Connect customer outcomes to expansion.", progress: 0, capabilities: ["Expansion Strategy", "Unit Economics", "Stakeholder Management", "Executive Presentations"] },
    ],
  },
  {
    role: "Strategy & Operations", domains: "Strategy · Operations · Business · Analytics", destination: "Strategy and Operations Leader", progress: 26,
    description: "Frame consequential choices and build the operating path to deliver them.",
    modules: [
      { number: "01", title: "Read the landscape", description: "Understand markets, trends, and strategic constraints.", progress: 48, capabilities: ["Market Sizing", "Competitive Analysis", "Trend Analysis", "Industry Structure"] },
      { number: "02", title: "Frame the choice", description: "Compare options using clear decision logic.", progress: 31, capabilities: ["Opportunity Analysis", "Scenario Planning", "Business Cases", "Risk Analysis"] },
      { number: "03", title: "Build the operating plan", description: "Translate choices into accountable execution.", progress: 17, capabilities: ["Strategic Goals", "Resource Allocation", "Program Management", "Operating Cadences"] },
      { number: "04", title: "Drive alignment", description: "Move decisions through senior stakeholders.", progress: 0, capabilities: ["Decision Memos", "Stakeholder Management", "Facilitation", "Executive Presentations"] },
    ],
  },
];

const PORTFOLIO = [
  { type: "Research plan", title: "Customer interview study", capability: "Customer Interviews", status: "In progress", proof: "Plan · script · synthesis" },
  { type: "Decision artifact", title: "Opportunity solution tree", capability: "Opportunity Mapping", status: "Draft", proof: "Evidence · choices · tradeoffs" },
  { type: "Executive narrative", title: "New market recommendation", capability: "Market Sizing", status: "Planned", proof: "Model · memo · presentation" },
];

const PROJECTS: Project[] = [
  { id: "interview-sprint", title: "Customer interview sprint", stage: "Foundation", domain: "Customer", difficulty: "Guided", time: "2–3 hours", summary: "Plan and run two interviews, then turn raw notes into one useful product insight.", capabilities: ["Customer Interviews", "Research Planning", "Synthesis"], deliverables: ["Research plan", "Interview guide", "Insight summary"], steps: ["Choose a focused learning goal", "Write six neutral questions", "Run two practice interviews", "Group evidence into themes", "Write one decision implication"] },
  { id: "kpi-audit", title: "KPI quality audit", stage: "Foundation", domain: "Analytics", difficulty: "Guided", time: "2 hours", summary: "Review a metric set and identify unclear definitions, missing owners, and misleading signals.", capabilities: ["KPI Design", "Metric Definitions", "Data Quality"], deliverables: ["Metric inventory", "Quality scorecard", "Recommended definitions"], steps: ["Inventory the current metrics", "Check each metric definition", "Identify behavior the metric may distort", "Assign owners and review rhythm", "Recommend a smaller core set"] },
  { id: "positioning-teardown", title: "Positioning teardown", stage: "Foundation", domain: "Marketing", difficulty: "Guided", time: "2 hours", summary: "Compare three products and explain how each frames its audience, category, and difference.", capabilities: ["Positioning", "Competitive Positioning", "Differentiation"], deliverables: ["Comparison grid", "Positioning critique", "Rewritten statement"], steps: ["Select three alternatives", "Capture the claims each makes", "Identify the implied audience", "Compare proof and differentiation", "Rewrite the weakest position"] },
  { id: "process-reset", title: "Process clarity reset", stage: "Foundation", domain: "Operations", difficulty: "Guided", time: "3 hours", summary: "Map a frustrating workflow and remove one source of delay, rework, or ambiguity.", capabilities: ["Process Mapping", "Root Cause Analysis", "Standard Work"], deliverables: ["Current-state map", "Root-cause note", "Future-state guide"], steps: ["Choose one recurring workflow", "Map steps and handoffs", "Mark waits and failure points", "Find the root cause", "Design and document the change"] },
  { id: "decision-memo", title: "One-page decision memo", stage: "Foundation", domain: "Leadership", difficulty: "Guided", time: "2 hours", summary: "Turn a messy discussion into a clear decision, recommendation, tradeoff, and next step.", capabilities: ["Business Writing", "Decision Framing", "Stakeholder Management"], deliverables: ["Decision frame", "One-page memo", "Stakeholder review note"], steps: ["Name the exact decision", "Summarize the relevant context", "Compare two realistic options", "Make one recommendation", "Ask a stakeholder to challenge the logic"] },
  { id: "market-sizing", title: "Market sizing range", stage: "Applied", domain: "Strategy", difficulty: "Independent", time: "3–4 days", summary: "Estimate an opportunity with top-down and bottom-up methods, then explain the uncertainty honestly.", capabilities: ["Market Sizing", "Market Research", "Sensitivity Analysis"], deliverables: ["Assumption sheet", "Sizing model", "Opportunity note"], steps: ["Define the market boundary", "Build a top-down estimate", "Build a bottom-up estimate", "Test the most sensitive assumptions", "Recommend a credible planning range"] },
  { id: "opportunity-map", title: "Evidence-led opportunity map", stage: "Applied", domain: "Product", difficulty: "Independent", time: "1 week", summary: "Turn customer evidence into prioritized outcomes and testable solution opportunities.", capabilities: ["Opportunity Mapping", "Problem Validation", "Portfolio Prioritization"], deliverables: ["Evidence repository", "Opportunity tree", "Priority rationale"], steps: ["Collect at least eight evidence points", "Cluster needs and outcomes", "Write opportunity statements", "Score evidence and strategic fit", "Recommend the next discovery bet"] },
  { id: "pricing-model", title: "Pricing and packaging model", stage: "Applied", domain: "Business", difficulty: "Independent", time: "1 week", summary: "Design three packaging options and compare value, willingness to pay, and unit economics.", capabilities: ["Pricing Strategy", "Packaging", "Unit Economics"], deliverables: ["Packaging architecture", "Scenario model", "Pricing recommendation"], steps: ["Define customer segments", "Map value to package boundaries", "Create three price scenarios", "Model unit economics", "Write a recommendation with risks"] },
  { id: "growth-experiment", title: "Activation experiment", stage: "Applied", domain: "Marketing", difficulty: "Independent", time: "4–5 days", summary: "Diagnose one activation drop-off and design an experiment with clear success and guardrail metrics.", capabilities: ["Funnel Analysis", "Experiment Design", "Conversion Optimization"], deliverables: ["Funnel diagnosis", "Experiment brief", "Measurement plan"], steps: ["Choose one activation moment", "Quantify the drop-off", "Form one causal hypothesis", "Design treatment and control", "Define success and guardrails"] },
  { id: "voc-system", title: "Voice of customer system", stage: "Applied", domain: "Customer", difficulty: "Independent", time: "1 week", summary: "Create a repeatable system that turns feedback from several channels into prioritized learning.", capabilities: ["Feedback Programs", "Research Repositories", "Insight Prioritization"], deliverables: ["Source map", "Tagging model", "Insight review cadence"], steps: ["Map feedback sources", "Create a simple taxonomy", "Define evidence standards", "Design a monthly synthesis", "Close the loop with teams"] },
  { id: "launch-room", title: "Commercial launch decision room", stage: "Integrated", domain: "Product + Marketing + Business", difficulty: "Complex", time: "2 weeks", summary: "Make a go or no-go launch recommendation using readiness, positioning, economics, and customer evidence.", capabilities: ["Launch Readiness", "GTM Strategy", "Positioning", "Unit Economics"], deliverables: ["Readiness scorecard", "GTM brief", "Executive decision memo"], steps: ["Define the launch decision", "Gather cross-functional evidence", "Score product and market readiness", "Model upside and downside", "Facilitate the decision review"] },
  { id: "retention-center", title: "Retention command center", stage: "Integrated", domain: "Customer + Analytics + Operations", difficulty: "Complex", time: "2 weeks", summary: "Combine journey evidence, behavioral metrics, and operating actions to reduce a retention risk.", capabilities: ["Churn Analysis", "Journey Mapping", "Health Scores", "Program Management"], deliverables: ["Retention diagnosis", "Health model", "90-day action plan"], steps: ["Choose a retention segment", "Combine qualitative and quantitative evidence", "Identify leading indicators", "Design intervention plays", "Set operating cadence and owners"] },
  { id: "new-market-case", title: "New market business case", stage: "Integrated", domain: "Strategy + Business + Analytics", difficulty: "Complex", time: "2 weeks", summary: "Evaluate a market opportunity and recommend enter, wait, partner, or decline.", capabilities: ["Market Sizing", "Competitive Analysis", "Scenario Models", "Business Cases"], deliverables: ["Market model", "Competitive landscape", "Investment memo"], steps: ["Frame the strategic question", "Size the market with ranges", "Assess competition and advantage", "Model three scenarios", "Recommend a course with triggers"] },
  { id: "zero-to-one", title: "Zero-to-one commercial launch", stage: "Capstone", domain: "Cross-domain", difficulty: "Senior proof", time: "4–6 weeks", summary: "Take an ambiguous customer problem from evidence through product strategy, economics, launch, and executive recommendation.", capabilities: ["Customer Interviews", "Product Vision", "Pricing Strategy", "GTM Strategy", "North Star Metrics", "Executive Presentations"], deliverables: ["Discovery evidence pack", "Product and commercial strategy", "Launch plan", "Executive presentation"], steps: ["Validate a meaningful customer problem", "Choose a product and market strategy", "Design solution and business model", "Build the go-to-market plan", "Define metrics and experiment plan", "Present and defend the full recommendation"] },
  { id: "portfolio-turnaround", title: "Product portfolio turnaround", stage: "Capstone", domain: "Cross-domain", difficulty: "Senior proof", time: "4–6 weeks", summary: "Diagnose an underperforming portfolio and recommend where to invest, repair, partner, or exit.", capabilities: ["Portfolio Prioritization", "Lifecycle Analysis", "Unit Economics", "Resource Allocation", "Stakeholder Management"], deliverables: ["Portfolio diagnosis", "Investment thesis", "Operating roadmap", "Board-style narrative"], steps: ["Define portfolio goals", "Analyze product and financial performance", "Assess strategic fit", "Create investment scenarios", "Recommend a sequenced portfolio move", "Lead a simulated executive review"] },
  { id: "ai-operating-model", title: "AI-enabled operating model", stage: "Capstone", domain: "Operations + Analytics + Leadership", difficulty: "Senior proof", time: "4 weeks", summary: "Redesign a commercial workflow with AI while protecting judgment, quality, adoption, and measurable value.", capabilities: ["AI Automation", "Operating Models", "Data Quality", "Change Strategy", "Benefits Realization"], deliverables: ["Current-state diagnosis", "AI workflow design", "Control and adoption plan", "Benefits case"], steps: ["Choose a high-friction workflow", "Separate judgment from repeatable work", "Design the human and AI handoffs", "Define quality and risk controls", "Plan adoption and measurement", "Defend the operating model"] },
];

const NAV: { id: View; label: string; short: string }[] = [
  { id: "home", label: "Home", short: "H" },
  { id: "path", label: "My path", short: "P" },
  { id: "map", label: "Knowledge map", short: "K" },
  { id: "projects", label: "Projects", short: "B" },
  { id: "portfolio", label: "Portfolio", short: "E" },
];

const VIEW_PATHS: Record<View, string> = {
  home: "/",
  path: "/my-path",
  map: "/knowledge-map",
  projects: "/projects",
  portfolio: "/portfolio",
};

function routeSlug(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function capabilityFromSlug(slug: string) {
  const names = new Set<string>();
  DOMAINS.forEach((domain) => domain.competencies.forEach((competency) => competency.capabilities.forEach((capability) => names.add(capability))));
  ROLE_PATHS.forEach((path) => path.modules.forEach((module) => module.capabilities.forEach((capability) => names.add(capability))));
  PROJECTS.forEach((project) => project.capabilities.forEach((capability) => names.add(capability)));
  PORTFOLIO.forEach((artifact) => names.add(artifact.capability));
  return [...names].find((name) => routeSlug(name) === slug) ?? null;
}

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

function capabilityLearningContext(name: string) {
  for (const domain of DOMAINS) {
    for (const competency of domain.competencies) {
      if (competency.capabilities.includes(name)) {
        return { domain: domain.name, competency: competency.name, competencyDescription: competency.description };
      }
    }
  }
  if (name === "Positioning") {
    return { domain: "Marketing", competency: "Positioning", competencyDescription: "Frame the product around a valuable market truth." };
  }
  return { domain: "General", competency: "Commercial Product Leadership", competencyDescription: "Connect evidence, judgment, and action across a consequential commercial product decision." };
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

function DomainMap({ onSelect }: { onSelect: (domain: Domain) => void }) {
  return (
    <div className="domain-map orbit-map" aria-label="Interactive eight-domain commercial product leadership map">
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

function PathView({ onCapability, selectedRole, onRole }: { onCapability: (name: string) => void; selectedRole: string; onRole: (role: string) => void }) {
  const path = ROLE_PATHS.find((item) => item.role === selectedRole) ?? ROLE_PATHS[0];
  return (
    <>
      <AppHeader eyebrow="Directed development" title={`Your ${path.role} path`} />
      <FocusNotice label="Selected role lens">
        <p><strong>{path.role}</strong> is now prioritizing the knowledge map below. Choose another role lens to rebuild this sequence instantly.</p>
      </FocusNotice>
      <section className="path-intro card-shell">
        <div><p className="section-kicker">Current destination</p><h2>{path.destination}</h2><p>{path.description}</p></div>
        <div className="path-score"><ProgressValue value={path.progress} /><span>Path complete</span><ProgressBar value={path.progress} /></div>
      </section>
      <section className="path-layout">
        <div className="module-list">
          <SectionHeader compact eyebrow="Four connected modules" title="Your directed path" description="Work from top to bottom, or open the sub-concept that matches your immediate need." />
          {path.modules.map((module, moduleIndex) => (
            <article className={`path-module path-module-${moduleIndex + 1}`} key={module.number}>
              <span className="module-number">{module.number}</span>
              <div className="module-main">
                <h3>{module.title}</h3><p>{module.description}</p>
                <div className="subconcept-grid">{module.capabilities.map((capability, index) => <SubconceptCard key={capability} index={index} title={capability} tone={(["indigo", "aqua", "butter", "coral"] as const)[moduleIndex]} status={module.progress > index * 25 ? "Ready to continue" : "Open concept"} onClick={() => onCapability(capability)} />)}</div>
              </div>
              <div className="module-progress"><ProgressValue value={module.progress} /><ProgressBar value={module.progress} /></div>
            </article>
          ))}
        </div>
        <aside className="career-panel card-shell">
          <p className="eyebrow">Role lenses</p><h2>One map, many careers</h2><p className="panel-copy">Each role changes the priority—not the underlying body of knowledge.</p>
          <div className="role-list">
            {ROLE_PATHS.map((item) => <button className={item.role === path.role ? "selected" : ""} aria-pressed={item.role === path.role} key={item.role} onClick={() => onRole(item.role)}><span><strong>{item.role}</strong><small>{item.domains}</small></span><em>{item.role === path.role ? "Selected" : "Choose"}</em></button>)}
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
          <DomainTutorPrompt domainId={selectedDomain.id} domainName={selectedDomain.name} />
        </div>
      </section>
    </>
  );
}

function ProjectStudioView({ onProject }: { onProject: (project: Project) => void }) {
  const [stage, setStage] = useState<string>("All stages");
  const [domain, setDomain] = useState<string>("All domains");
  const stages = ["All stages", "Foundation", "Applied", "Integrated", "Capstone"];
  const domains = ["All domains", "Product", "Marketing", "Business", "Analytics", "Customer", "Strategy", "Operations", "Leadership", "Cross-domain"];
  const visibleProjects = PROJECTS.filter((project) => (stage === "All stages" || project.stage === stage) && (domain === "All domains" || project.domain.includes(domain)));

  return (
    <>
      <AppHeader eyebrow="Practice, build, integrate" title="Project studio" />
      <FocusNotice label="Choose the right challenge">
        <p>Start with one domain project. Move to integrated work when you can explain your choices. Use capstones to prove senior-level judgment across domains.</p>
      </FocusNotice>
      <Surface className="project-intro" corner="bottom-left">
        <div><p className="section-kicker">Staged difficulty</p><h2>Build confidence in layers.</h2><p>Each stage asks you to combine more knowledge, manage more ambiguity, and produce stronger professional evidence.</p></div>
        <ol className="stage-ladder">
          {[
            ["01", "Foundation", "Follow a clear scaffold"],
            ["02", "Applied", "Work independently in one domain"],
            ["03", "Integrated", "Connect several domains"],
            ["04", "Capstone", "Defend a senior-level decision"],
          ].map(([number, title, copy]) => <li key={title}><span>{number}</span><div><strong>{title}</strong><small>{copy}</small></div></li>)}
        </ol>
      </Surface>

      <section className="project-library" aria-labelledby="project-library-title">
        <SectionHeader eyebrow={`${visibleProjects.length} projects shown`} title="Project library" description="Use the filters to reduce choices and keep one level of challenge in view." />
        <div className="project-filters" aria-label="Project filters">
          <fieldset><legend>Difficulty stage</legend><div>{stages.map((item) => <button key={item} className={stage === item ? "selected" : ""} aria-pressed={stage === item} onClick={() => setStage(item)}>{item}</button>)}</div></fieldset>
          <fieldset><legend>Knowledge domain</legend><div>{domains.map((item) => <button key={item} className={domain === item ? "selected" : ""} aria-pressed={domain === item} onClick={() => setDomain(item)}>{item}</button>)}</div></fieldset>
        </div>
        <div className="project-grid">
          {visibleProjects.map((project, index) => (
            <button className={`project-card stage-${project.stage.toLowerCase()}`} key={project.id} onClick={() => onProject(project)}>
              <span className="project-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="project-stage">{project.stage} · {project.difficulty}</span>
              <strong>{project.title}</strong>
              <p>{project.summary}</p>
              <span className="project-domain">{project.domain}</span>
              <span className="project-time">{project.time}</span>
              <b>Open project →</b>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function ProjectWorkspace({ project, completedSteps, onToggleStep, onBack, onCapability }: { project: Project; completedSteps: string[]; onToggleStep: (projectId: string, step: string) => void; onBack: () => void; onCapability: (name: string) => void }) {
  const doneCount = project.steps.filter((step) => completedSteps.includes(`${project.id}:${step}`)).length;
  const progress = Math.round((doneCount / project.steps.length) * 100);
  return (
    <div className="focused-workspace">
      <button className="back-button" onClick={onBack}>← Back to project studio</button>
      <header className="workspace-hero project-workspace-hero">
        <div><p className="eyebrow">{project.stage} project · {project.domain}</p><h1>{project.title}</h1><p>{project.summary}</p></div>
        <Surface className="workspace-progress" corner="bottom-left"><span>Project progress</span><ProgressValue value={progress} /><ProgressBar value={progress} /></Surface>
      </header>
      <FocusNotice label="Project goal"><p>Complete one step at a time. Keep your evidence in the deliverables listed below, then use the final review to defend your recommendation.</p></FocusNotice>
      <section className="project-workspace-grid">
        <main>
          <Surface className="project-steps" corner="bottom-left">
            <SectionHeader eyebrow={`${doneCount} of ${project.steps.length} steps complete`} title="Build sequence" description="Mark a step complete only when its evidence is saved in your project file." />
            <ol>{project.steps.map((step, index) => { const key = `${project.id}:${step}`; const done = completedSteps.includes(key); return <li key={step} className={done ? "done" : ""}><button onClick={() => onToggleStep(project.id, step)}><span>{done ? "✓" : index + 1}</span><strong>{step}</strong><small>{done ? "Complete. Select to reopen." : "Select when evidence is complete."}</small></button></li>; })}</ol>
          </Surface>
          <Surface className="project-capabilities" corner="top-right">
            <SectionHeader eyebrow="Knowledge connections" title="Capabilities used" description="Open a capability when you need a focused refresher." />
            <div>{project.capabilities.map((capability, index) => <SubconceptCard key={capability} index={index} title={capability} status="Open capability" onClick={() => onCapability(capability)} />)}</div>
          </Surface>
        </main>
        <aside>
          <Surface className="deliverable-panel" corner="top-right"><p className="eyebrow">Evidence pack</p><h2>What you will produce</h2><ol>{project.deliverables.map((item, index) => <li key={item}><span>{index + 1}</span><strong>{item}</strong></li>)}</ol></Surface>
          <Surface className="review-panel" corner="bottom-left"><p className="eyebrow">Final review</p><h2>Defend the work</h2><ul><li>Explain the context in plain language.</li><li>Show evidence behind the choice.</li><li>Name the strongest alternative.</li><li>Define success and the next learning step.</li></ul></Surface>
        </aside>
      </section>
    </div>
  );
}

function LessonWorkspace({ lesson, complete, onComplete, onBack }: { lesson: LessonSelection; complete: boolean; onComplete: () => void; onBack: () => void }) {
  const [answer, setAnswer] = useState<string | null>(null);
  const learningContext = capabilityLearningContext(lesson.capability);
  const brief = buildLessonBrief({
    capability: lesson.capability,
    lessonTitle: lesson.title,
    lessonIndex: lesson.index,
    ...learningContext,
  });

  return (
    <div className="focused-workspace lesson-workspace">
      <button className="back-button" onClick={onBack}>← Back to {lesson.capability}</button>
      <header className="workspace-hero lesson-hero">
        <div><p className="eyebrow">Lesson {lesson.index + 1} · {lesson.capability}</p><h1>{lesson.title}</h1><p>{brief.goal}</p></div>
        <div className={`lesson-status ${complete ? "complete" : ""}`}><span>{complete ? "✓" : lesson.index + 1}</span><strong>{complete ? "Complete" : "About 12 minutes"}</strong></div>
      </header>
      <FocusNotice label="Learning objective"><p>{brief.objective}</p></FocusNotice>
      <section className="lesson-layout">
        <main>
          <Surface className="lesson-reading" corner="bottom-left">
            <p className="eyebrow">{brief.partLabel}</p><h2>{brief.sectionTitle}</h2>
            <div className="concept-definition"><strong>{lesson.capability} in plain language</strong><p>{brief.conceptDefinition}</p></div>
            {brief.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <div className="research-quest"><p className="eyebrow">Research required</p><h3>{brief.researchTitle}</h3><ol>{brief.researchSteps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol><p className="research-rule">Save your sources. Do not complete the practice from this brief alone.</p></div>
            <div className="lesson-example"><strong>{brief.exampleLabel}</strong><p>{brief.example}</p></div>
          </Surface>
          <Surface className="lesson-practice" corner="top-right">
            <p className="eyebrow">Part 2 · Try it</p><h2>Practice in five minutes</h2>
            <ol>{brief.practice.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
            <label htmlFor="practice-note">Your practice note</label><textarea id="practice-note" rows={6} placeholder={brief.notePrompt} />
          </Surface>
        </main>
        <aside>
          <Surface className="knowledge-check" corner="top-right">
            <p className="eyebrow">Part 3 · Check</p><h2>{brief.checkQuestion}</h2>
            <div>{brief.options.map((option) => <button key={option} className={answer === option ? "selected" : ""} aria-pressed={answer === option} onClick={() => setAnswer(option)}>{option}</button>)}</div>
            {answer ? <p className={`answer-feedback ${answer === brief.correctAnswer ? "correct" : "retry"}`} role="status">{answer === brief.correctAnswer ? brief.correctFeedback : brief.retryFeedback}</p> : null}
          </Surface>
          <button className="lesson-complete-button" onClick={onComplete}>{complete ? "Mark lesson incomplete" : "Complete lesson"}<span>→</span></button>
          <Surface className="lesson-summary" corner="bottom-left"><p className="eyebrow">Remember</p><ul>{brief.remember.map((item) => <li key={item}>{item}</li>)}</ul></Surface>
        </aside>
      </section>
    </div>
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

function CapabilityWorkspace({ name, completed, onToggle, onBack, onLesson, onProject }: { name: string; completed: string[]; onToggle: (step: string) => void; onBack: () => void; onLesson: (lesson: LessonSelection) => void; onProject: (project: Project) => void }) {
  const content = capabilityContent(name);
  const relatedProject = PROJECTS.find((project) => project.capabilities.includes(name)) ?? PROJECTS[0];
  const currentIndex = WORKFLOW.findIndex((step) => !completed.includes(`${name}:${step}`));
  const activeIndex = currentIndex === -1 ? WORKFLOW.length - 1 : currentIndex;
  const progress = Math.round((completed.filter((item) => item.startsWith(`${name}:`)).length / WORKFLOW.length) * 100);
  return (
    <div className="capability-workspace">
      <button className="back-button" onClick={onBack}>← Back to your map</button>
      <header className="capability-hero">
        <div><p className="eyebrow">Capability workspace · Product Discovery</p><h1>{name}</h1><p>{content.summary}</p></div>
        <div className="mastery-score"><span>Mastery progress</span><ProgressValue value={progress} /><ProgressBar value={progress} /></div>
      </header>
      <nav className="capability-workflow" aria-label="Mastery workflow">
        {WORKFLOW.map((step, index) => { const done = completed.includes(`${name}:${step}`); return <button key={step} className={done ? "done" : index === activeIndex ? "current" : ""} onClick={() => onToggle(step)}><span>{done ? "✓" : index + 1}</span><strong>{step}</strong><small>{done ? "Complete" : index === activeIndex ? "Up next" : "Not started"}</small></button>; })}
      </nav>
      <section className="capability-body">
        <main>
          <article className="learning-brief card-shell"><p className="section-kicker">Learning brief</p><h2>What good looks like</h2><p className="outcome">{content.outcome}</p><div className="brief-grid"><div><h3>Theory & concepts</h3>{content.concepts.map((item) => <span key={item}>{item}</span>)}</div><div><h3>Methods</h3>{content.methods.map((item) => <span key={item}>{item}</span>)}</div><div><h3>Tools</h3>{content.tools.map((item) => <span key={item}>{item}</span>)}</div></div></article>
          <article className="lesson-panel card-shell"><div className="section-heading compact"><div><p className="eyebrow">Learn</p><h2>Four focused lessons</h2></div><span className="time-badge">48 min total</span></div><ol>{content.lessons.map((lesson, index) => <li key={lesson}><button className="lesson-row-button" onClick={() => onLesson({ capability: name, title: lesson, index })} aria-label={`Open ${lesson}`}><span>{String(index + 1).padStart(2, "0")}</span><span className="lesson-row-copy"><strong>{lesson}</strong><small>{10 + index * 2} min · Interactive lesson</small></span><b aria-hidden="true">→</b></button></li>)}</ol></article>
        </main>
        <aside>
          <article className="build-panel"><p className="eyebrow">Build</p><h2>Your evidence pack</h2><p>Turn learning into work a hiring manager or executive could inspect.</p>{content.deliverables.map((deliverable, index) => <div className="deliverable-row" key={deliverable}><span>{index + 1}</span><strong>{deliverable}</strong><small>{index === 0 ? "In progress" : "Not started"}</small></div>)}<button className="build-project-button" onClick={() => onProject(relatedProject)}>Open recommended project <span>→</span></button></article>
          <article className="validation-panel card-shell"><p className="eyebrow">Validate</p><h2>Eight ways to prove mastery</h2><div>{["Explain it", "Apply it", "Analyze it", "Build it", "Measure it", "Improve it", "Communicate it", "Teach it"].map((lens, index) => <span className={index < 2 ? "active" : ""} key={lens}>{index < 2 ? "✓" : "○"} {lens}</span>)}</div></article>
        </aside>
      </section>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [selectedDomainId, setSelectedDomainId] = useState("product");
  const [selectedRole, setSelectedRole] = useState("Product Management");
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonSelection | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [completed, setCompleted] = useState<string[]>(["Customer Interviews:Learn", "Customer Interviews:Understand"]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [completedProjectSteps, setCompletedProjectSteps] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("jada-learning-state");
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (Array.isArray(state.completed)) setCompleted(state.completed);
          if (Array.isArray(state.completedLessons)) setCompletedLessons(state.completedLessons);
          if (Array.isArray(state.completedProjectSteps)) setCompletedProjectSteps(state.completedProjectSteps);
          if (typeof state.selectedRole === "string") setSelectedRole(state.selectedRole);
        } catch { /* use the starter progress */ }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem("jada-learning-state", JSON.stringify({ completed, completedLessons, completedProjectSteps, selectedRole }));
  }, [completed, completedLessons, completedProjectSteps, selectedRole, ready]);

  const selectedDomain = useMemo(() => DOMAINS.find((domain) => domain.id === selectedDomainId) ?? DOMAINS[0], [selectedDomainId]);

  const applyRoute = useCallback((pathname: string) => {
    const segments = pathname.split("/").filter(Boolean);
    const [section, item, subsection, detail] = segments;

    setSelectedCapability(null);
    setSelectedLesson(null);
    setSelectedProject(null);

    if (!section) {
      setView("home");
      return;
    }
    if (section === "my-path") {
      setView("path");
      return;
    }
    if (section === "knowledge-map") {
      setView("map");
      if (item && DOMAINS.some((domain) => domain.id === item)) setSelectedDomainId(item);
      return;
    }
    if (section === "projects") {
      setView("projects");
      if (item) setSelectedProject(PROJECTS.find((project) => project.id === item) ?? null);
      return;
    }
    if (section === "portfolio") {
      setView("portfolio");
      return;
    }
    if (section === "capabilities" && item) {
      const capability = capabilityFromSlug(item);
      setView("map");
      setSelectedCapability(capability);
      if (capability && subsection === "lessons" && detail) {
        const lessonIndex = Number(detail);
        const lessons = capabilityContent(capability).lessons;
        if (Number.isInteger(lessonIndex) && lessons[lessonIndex]) {
          setSelectedLesson({ capability, title: lessons[lessonIndex], index: lessonIndex });
        }
      }
      return;
    }
    setView("home");
  }, []);

  useEffect(() => {
    const syncRoute = () => applyRoute(window.location.pathname);
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, [applyRoute]);

  function go(pathname: string) {
    if (window.location.pathname !== pathname) window.history.pushState({}, "", pathname);
    applyRoute(pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openDomain(domain: Domain) {
    go(`/knowledge-map/${domain.id}`);
  }

  function openCapability(name: string) {
    go(`/capabilities/${routeSlug(name)}`);
  }

  function openProject(project: Project) {
    go(`/projects/${project.id}`);
  }

  function navigate(next: View) {
    go(VIEW_PATHS[next]);
  }

  function openLesson(lesson: LessonSelection) {
    go(`/capabilities/${routeSlug(lesson.capability)}/lessons/${lesson.index}`);
  }

  function toggleWorkflow(step: string) {
    if (!selectedCapability) return;
    const key = `${selectedCapability}:${step}`;
    setCompleted((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key]);
  }

  function toggleLesson() {
    if (!selectedLesson) return;
    const key = `${selectedLesson.capability}:${selectedLesson.title}`;
    setCompletedLessons((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key]);
  }

  function toggleProjectStep(projectId: string, step: string) {
    const key = `${projectId}:${step}`;
    setCompletedProjectSteps((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key]);
  }

  if (selectedLesson) {
    const lessonKey = `${selectedLesson.capability}:${selectedLesson.title}`;
    return <LessonWorkspace lesson={selectedLesson} complete={completedLessons.includes(lessonKey)} onComplete={toggleLesson} onBack={() => openCapability(selectedLesson.capability)} />;
  }

  if (selectedProject) {
    return <ProjectWorkspace project={selectedProject} completedSteps={completedProjectSteps} onToggleStep={toggleProjectStep} onBack={() => navigate("projects")} onCapability={openCapability} />;
  }

  if (selectedCapability) {
    return <CapabilityWorkspace name={selectedCapability} completed={completed} onToggle={toggleWorkflow} onBack={() => navigate("map")} onLesson={openLesson} onProject={openProject} />;
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
        {view === "home" && <HomeView onView={navigate} onDomain={openDomain} onCapability={openCapability} />}
        {view === "path" && <PathView onCapability={openCapability} selectedRole={selectedRole} onRole={setSelectedRole} />}
        {view === "map" && <MapView selectedDomain={selectedDomain} onDomain={openDomain} onCapability={openCapability} />}
        {view === "projects" && <ProjectStudioView onProject={openProject} />}
        {view === "portfolio" && <PortfolioView onCapability={openCapability} />}
      </main>
    </div>
  );
}
