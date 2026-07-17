import { getCapabilityDefinition } from "@/lib/lessonBriefs";

export type CapabilityContext = {
  capability: string;
  domain: string;
  competency: string;
  competencyDescription: string;
};

export type CapabilityEngine = {
  description: string;
  position: string;
  mentalModel: string;
  outcome: string;
  guidingQuestions: string[];
  guidedPath: { title: string; body: string }[];
  completion: string;
  concepts: string[];
  methods: string[];
  tools: string[];
  signals: string[];
  evidence: { title: string; description: string }[];
  validation: { title: string; instruction: string; evidence: string }[];
};

type DomainKit = {
  decision: string;
  boundary: string;
  analogy: string;
  methods: string[];
  tools: string[];
  signals: string[];
};

const DOMAIN_KITS: Record<string, DomainKit> = {
  Product: {
    decision: "which customer problem, product direction, or delivery bet deserves commitment",
    boundary: "customer value, business value, feasibility, and product outcomes",
    analogy: "a navigation chart: evidence locates the team, strategy chooses a destination, and experiments test the route before the full journey",
    methods: ["Frame the product decision", "Gather customer and product evidence", "Compare options and tradeoffs", "Test the riskiest assumption"],
    tools: ["Decision brief", "Research repository", "Opportunity map", "Experiment plan"],
    signals: ["observed customer behavior", "product outcome", "assumption confidence"],
  },
  Marketing: {
    decision: "which audience, promise, channel, or market action can create qualified demand",
    boundary: "audience need, market alternatives, credible proof, and commercial response",
    analogy: "a translation system that turns product value into language and experiences a chosen audience can recognize, believe, and act on",
    methods: ["Define the audience and decision", "Study language and alternatives", "Build and compare messages", "Measure market response"],
    tools: ["Positioning brief", "Message map", "Channel plan", "Campaign scorecard"],
    signals: ["customer language", "conversion behavior", "commercial outcome"],
  },
  Business: {
    decision: "how the organization should create, fund, price, or capture value",
    boundary: "customer value, economic drivers, operating constraints, and opportunity cost",
    analogy: "a value engine whose inputs, costs, choices, and outputs must balance before the organization can sustain the result",
    methods: ["Frame the economic decision", "Model assumptions and drivers", "Compare viable scenarios", "Test sensitivity and risk"],
    tools: ["Assumption sheet", "Economic model", "Scenario table", "Investment memo"],
    signals: ["unit contribution", "cash or revenue effect", "sensitivity to assumptions"],
  },
  Analytics: {
    decision: "how to turn a business question into trustworthy measurement, analysis, or prediction",
    boundary: "metric meaning, data quality, comparison logic, uncertainty, and practical significance",
    analogy: "a calibrated instrument panel: each measure needs a definition, a trustworthy sensor, context, and a decision it can actually inform",
    methods: ["Define the question and grain", "Inspect data and assumptions", "Analyze with an appropriate comparison", "Interpret uncertainty for action"],
    tools: ["Metric specification", "SQL or analysis notebook", "Decision chart", "Interpretation memo"],
    signals: ["data quality", "effect or pattern", "uncertainty and limitation"],
  },
  Customer: {
    decision: "how to understand customer progress, behavior, friction, or realized value",
    boundary: "situation, desired progress, observable behavior, alternatives, and outcome",
    analogy: "a field investigation: the customer’s real context is the scene, behavior is the evidence, and patterns—not assumptions—support the conclusion",
    methods: ["Frame the learning decision", "Collect behavior and context", "Synthesize patterns and contradictions", "Translate insight into a choice"],
    tools: ["Research plan", "Evidence repository", "Journey or job map", "Insight brief"],
    signals: ["specific past behavior", "repeated pattern", "customer outcome"],
  },
  Strategy: {
    decision: "where to play, how to win, and what the organization will deliberately not pursue",
    boundary: "market structure, customer value, advantage, capabilities, economics, and risk",
    analogy: "a choice system: every committed direction closes other doors and must connect evidence, advantage, resources, and consequences",
    methods: ["Frame the strategic choice", "Research the landscape", "Compare coherent options", "Record triggers that could reverse the choice"],
    tools: ["Market model", "Choice cascade", "Scenario matrix", "Decision memo"],
    signals: ["market evidence", "source of advantage", "decision trigger"],
  },
  Operations: {
    decision: "how work, decisions, and information should flow to produce reliable outcomes",
    boundary: "actors, steps, handoffs, constraints, ownership, exceptions, and benefits",
    analogy: "a living production system: flow becomes understandable when the work, queues, handoffs, controls, and feedback are made visible",
    methods: ["Map the current system", "Find the first constraint", "Design a controlled change", "Measure adoption and benefit"],
    tools: ["Process map", "Responsibility map", "Change experiment", "Operating scorecard"],
    signals: ["flow time", "quality or failure rate", "adoption and benefit"],
  },
  Leadership: {
    decision: "how to create clarity, alignment, accountability, or growth across people",
    boundary: "interests, evidence, power, trust, decision rights, and follow-through",
    analogy: "a shared decision table: people can move together when the question, evidence, interests, tradeoffs, and ownership are visible",
    methods: ["Frame the people and decision context", "Listen for interests and constraints", "Make reasoning and tradeoffs visible", "Confirm ownership and follow-through"],
    tools: ["Stakeholder map", "Decision memo", "Conversation plan", "Commitment log"],
    signals: ["shared understanding", "decision commitment", "observable follow-through"],
  },
  General: {
    decision: "how to make a consequential commercial product choice with sound reasoning",
    boundary: "context, evidence, assumptions, alternatives, tradeoffs, and outcome",
    analogy: "a decision laboratory where assumptions are labeled, evidence is inspected, and conclusions remain open to revision",
    methods: ["Frame the decision", "Research credible approaches", "Apply and compare", "Review evidence and tradeoffs"],
    tools: ["Research notes", "Decision brief", "Working model", "Review checklist"],
    signals: ["evidence quality", "decision usefulness", "learning gained"],
  },
};

function lowerFirst(text: string) {
  return text ? `${text[0].toLowerCase()}${text.slice(1)}` : text;
}

export function getCapabilityEngine(context: CapabilityContext): CapabilityEngine {
  const kit = DOMAIN_KITS[context.domain] ?? DOMAIN_KITS.General;
  const definition = getCapabilityDefinition(context.capability);
  const competencyFocus = context.competencyDescription.replace(/[.]$/, "");
  const firstTool = kit.tools[0];
  const firstSignal = kit.signals[0];

  return {
    description: definition,
    position: `${context.capability} sits inside ${context.competency}, within the ${context.domain} domain. ${context.competency} focuses on ${lowerFirst(competencyFocus)}.`,
    mentalModel: `Treat ${context.capability} like ${kit.analogy}. Use the analogy to find responsibilities and boundaries, then verify it against research and real evidence.`,
    outcome: `By the end, Jada should be able to explain ${context.capability} in her own words, research two credible approaches, apply one to a real ${context.domain.toLowerCase()} decision, produce evidence another person can inspect, and defend what would change her conclusion.`,
    guidingQuestions: [
      `What problem does ${context.capability} solve, and what remains outside its responsibility?`,
      `For a decision about ${kit.decision}, which actors, evidence, assumptions, and boundaries must be visible?`,
      `What would ${firstSignal} show if the reasoning were weak, and how could ${firstTool} help Jada inspect it?`,
      `Which credible source disagrees with or limits a common use of ${context.capability}, and what would make Jada change approaches?`,
    ],
    guidedPath: [
      { title: "Start with the boundary", body: `Research two credible definitions of ${context.capability}. Write a concise definition in your own words and name what the concept does not cover.` },
      { title: "Trace one real decision", body: `Choose a real decision involving ${kit.decision}. Map the actors, evidence, assumptions, alternatives, and the point where ${firstSignal} becomes visible.` },
      { title: "Test your explanation", body: `Use ${kit.methods.slice(0, 2).join(" and ")} to create a small working example. Ask someone to challenge one assumption and record what the evidence changes.` },
      { title: "Finish with a defended choice", body: `Compare two credible approaches to ${context.capability}. Choose one for the stated situation, name the tradeoff, cite the research, and state what new evidence would reverse the choice.` },
    ],
    completion: `Jada is finished when another person can use her research, model, and evidence to explain ${context.capability}, follow the decision logic, challenge an assumption, and understand why she chose the approach without receiving a prewritten answer.`,
    concepts: [
      `Decision: ${kit.decision}`,
      `Boundary: ${kit.boundary}`,
      `Primary signal: ${firstSignal}`,
      `Research requirement: two credible sources and one limitation`,
    ],
    methods: kit.methods,
    tools: kit.tools,
    signals: kit.signals,
    evidence: [
      { title: `${context.capability} concept and decision map`, description: `Explain the concept in your own words, cite two sources, and map one real decision with actors, assumptions, boundaries, and alternatives.` },
      { title: `${context.capability} research and application proof`, description: `Show the method you researched, the example you built, the evidence you gathered, one challenged assumption, and what changed.` },
      { title: `${context.capability} tradeoff and teaching brief`, description: `Compare two approaches, defend one for a named situation, state what you give up, and identify evidence that would reverse the decision.` },
    ],
    validation: [
      { title: "Explain it", instruction: `Define ${context.capability} plainly and distinguish it from a nearby concept.`, evidence: "A concise explanation with cited sources and a boundary statement." },
      { title: "Apply it", instruction: `Use ${context.capability} in one realistic decision.`, evidence: "A working example tied to a named situation and decision." },
      { title: "Analyze it", instruction: "Inspect assumptions, evidence quality, contradictions, and alternatives.", evidence: "An annotated analysis showing what is known, inferred, and unresolved." },
      { title: "Build it", instruction: "Create an artifact another person can inspect or reuse.", evidence: "A decision map, model, plan, or brief produced in Jada’s own words." },
      { title: "Measure it", instruction: `Choose signals that reveal whether the ${context.capability} work helped.`, evidence: `A measure using ${kit.signals.join(", ")}.` },
      { title: "Improve it", instruction: "Use critique or new evidence to revise the weakest part.", evidence: "A before-and-after revision with a reason for the change." },
      { title: "Communicate it", instruction: "Adapt the reasoning for a stakeholder who must decide or act.", evidence: "A concise recommendation with evidence, tradeoffs, and a clear ask." },
      { title: "Teach it", instruction: "Guide another person with questions rather than giving them the answer.", evidence: "A short teaching outline, example, and questions that reveal understanding." },
    ],
  };
}
