export type LessonBrief = {
  goal: string;
  objective: string;
  conceptDefinition: string;
  partLabel: string;
  sectionTitle: string;
  explanation: string[];
  researchTitle: string;
  researchSteps: string[];
  exampleLabel: string;
  example: string;
  practice: string[];
  notePrompt: string;
  checkQuestion: string;
  options: string[];
  correctAnswer: string;
  correctFeedback: string;
  retryFeedback: string;
  remember: string[];
};

type LessonContext = {
  capability: string;
  lessonTitle: string;
  lessonIndex: number;
  domain: string;
  competency: string;
  competencyDescription: string;
};

const CAPABILITY_DEFINITIONS: Record<string, string> = {
  // Product
  "Customer Interviews": "Customer interviews are structured conversations that uncover real behavior, context, needs, and tradeoffs without leading people toward a preferred answer.",
  "Problem Validation": "Problem validation tests whether a problem is real, frequent, important, and worth solving before a team invests in a solution.",
  "Opportunity Mapping": "Opportunity mapping organizes customer outcomes, needs, and evidence so a team can compare where product effort may create the most value.",
  "Solution Testing": "Solution testing exposes an early concept or prototype to realistic use so the team can find comprehension, value, and usability risks before building fully.",
  "Product Vision": "A product vision describes the meaningful future the product is trying to create and gives teams a durable direction for making tradeoffs.",
  "Strategic Narratives": "A strategic narrative connects a changing world, an important customer tension, and a credible company response into a story that helps people act.",
  "Roadmapping": "Roadmapping communicates an adaptable sequence of outcomes, learning, and investments rather than promising a fixed list of features.",
  "Portfolio Prioritization": "Portfolio prioritization compares initiatives across value, evidence, strategic fit, cost, risk, and timing to decide where limited resources should go.",
  "Requirements": "Requirements state the customer, business, technical, and operational conditions a solution must satisfy without prematurely prescribing every implementation detail.",
  "User Stories": "User stories express a small unit of desired value from a user’s perspective and create a starting point for shared understanding, not a substitute for conversation.",
  "Acceptance Criteria": "Acceptance criteria define observable conditions that must be true for a piece of work to be considered complete and fit for its intended purpose.",
  "Launch Readiness": "Launch readiness evaluates whether the product, market motion, support system, measurement, and risk controls are prepared for release.",
  "North Star Metrics": "A North Star metric captures the recurring customer value created by a product and helps align teams around sustainable progress rather than isolated activity.",
  "Funnel Analysis": "Funnel analysis measures how people move through a sequence of meaningful behaviors and locates where progress, friction, or abandonment changes.",
  "Experiment Design": "Experiment design specifies a causal hypothesis, treatment, comparison, measures, population, and decision rule before results are observed.",
  "Lifecycle Analysis": "Lifecycle analysis studies how customer behavior and value change from acquisition through activation, retention, expansion, and departure.",
  "Ideation": "Ideation deliberately produces and reshapes multiple possible responses to a well-framed problem before the team narrows to a solution.",
  "Business Model Innovation": "Business model innovation changes how an organization creates, delivers, or captures value rather than only changing the product itself.",
  "AI Product Discovery": "AI product discovery investigates where machine capabilities can solve a valuable problem while testing data, reliability, usability, and responsible-use assumptions.",
  "Concept Validation": "Concept validation tests whether an intended audience understands, values, and believes a proposed product idea before major delivery investment.",

  // Marketing
  "Positioning": "Positioning defines the market context in which a product is most valuable, who it serves, what alternative it replaces, and why its difference matters.",
  "Value Proposition": "A value proposition explains the specific customer outcome a product enables, the pain or effort it reduces, and the credible reason to choose it.",
  "Competitive Positioning": "Competitive positioning clarifies how a product should be understood relative to the alternatives customers actually consider.",
  "Category Design": "Category design shapes the language, problem frame, and rules of a market so customers can recognize a new kind of solution and its value.",
  "Differentiation": "Differentiation identifies a meaningful, provable advantage that matters to a chosen customer rather than a feature that is merely different.",
  "Message Architecture": "Message architecture arranges a central promise, supporting benefits, proof, and audience-specific messages into one coherent communication system.",
  "Brand Voice": "Brand voice defines the consistent personality, language choices, and communication principles that make a brand recognizable across situations.",
  "Storytelling": "Business storytelling organizes context, tension, evidence, choice, and resolution so an audience can understand why action matters.",
  "Sales Narratives": "A sales narrative helps a buyer understand a changing situation, the cost of staying the same, and a credible path to a better outcome.",
  "GTM Strategy": "A go-to-market strategy coordinates target customers, positioning, channels, pricing, sales motion, launch sequence, and measures of market adoption.",
  "Launch Planning": "Launch planning turns a go-to-market strategy into timed decisions, owners, dependencies, enablement, communications, and feedback loops.",
  "Channel Strategy": "Channel strategy chooses how a product will reach, educate, convert, and support customers across direct, partner, product-led, and paid pathways.",
  "Sales Enablement": "Sales enablement equips revenue teams with the knowledge, tools, proof, and practice needed to guide a buyer’s decision effectively.",
  "Demand Generation": "Demand generation builds awareness, interest, and qualified buying intent through coordinated programs tied to a defined audience and problem.",
  "Growth Loops": "Growth loops create a repeating system in which one user action or outcome generates inputs that attract, activate, or retain additional users.",
  "Lifecycle Marketing": "Lifecycle marketing adapts communication and offers to the customer’s current relationship, behavior, needs, and next valuable action.",
  "Conversion Optimization": "Conversion optimization uses evidence and controlled learning to reduce friction and increase the share of people completing a valuable action.",
  "Attribution": "Attribution estimates how marketing touchpoints contributed to an outcome while acknowledging that models distribute credit rather than reveal perfect causality.",
  "Campaign Measurement": "Campaign measurement connects a campaign’s objective to leading indicators, business outcomes, cost, and an explicit decision about what to change next.",
  "CAC & LTV": "Customer acquisition cost and lifetime value compare the investment required to acquire customers with the contribution expected from their relationship over time.",
  "Marketing Experiments": "Marketing experiments isolate a change in audience, message, offer, or channel and measure whether it caused a meaningful outcome.",

  // Business
  "Financial Statements": "Financial statements provide linked views of performance, position, and cash through the income statement, balance sheet, and cash-flow statement.",
  "Unit Economics": "Unit economics measures the revenue, variable cost, contribution, and payback associated with one customer, order, product, or other useful unit.",
  "Budgeting": "Budgeting translates priorities and assumptions into an accountable plan for allocating money, people, and operating capacity over time.",
  "Investment Analysis": "Investment analysis compares expected return, timing, uncertainty, strategic value, and opportunity cost before committing resources.",
  "Business Models": "A business model describes who receives value, how that value is delivered, what resources and partners are required, and how the organization captures value.",
  "Pricing Strategy": "Pricing strategy determines how price will reflect customer value, segmentation, competitive context, costs, and the organization’s commercial goals.",
  "Packaging": "Packaging groups capabilities, usage, service, or outcomes into offers that help different customers choose an appropriate level of value.",
  "Revenue Models": "Revenue models specify what customers pay for, when payment occurs, and how revenue grows through transactions, subscriptions, usage, licensing, or other mechanisms.",
  "Supply & Demand": "Supply and demand explains how availability, willingness to buy, price, substitutes, and constraints interact to shape market quantities and behavior.",
  "Market Structures": "Market structures describe how competition behaves under different numbers of sellers, barriers to entry, information conditions, and sources of power.",
  "Network Effects": "Network effects occur when the value of a product changes as more participants, connections, data, or complements join the system.",
  "Switching Costs": "Switching costs are the financial, operational, learning, relational, or data burdens a customer faces when moving to an alternative.",
  "Sales Process": "A sales process defines the evidence-based stages, responsibilities, and exit criteria used to move from qualified need to a buying decision.",
  "Pipeline Management": "Pipeline management evaluates deal quality, stage movement, capacity, risk, and next actions to improve both execution and forecast reliability.",
  "Enterprise Buying": "Enterprise buying is a multi-person decision process shaped by business value, risk, procurement, security, budget, politics, and implementation readiness.",
  "Revenue Forecasting": "Revenue forecasting estimates future revenue from explicit assumptions about pipeline, conversion, timing, retention, expansion, and uncertainty.",
  "Operating Models": "An operating model defines how structure, roles, decision rights, processes, information, and measures work together to execute strategy.",
  "Incentive Design": "Incentive design aligns rewards, measures, and consequences with desired behavior while guarding against gaming and unintended effects.",
  "Organizational Behavior": "Organizational behavior examines how individual motivation, group dynamics, culture, power, and structure influence performance.",
  "Team Effectiveness": "Team effectiveness is the ability to produce valuable outcomes repeatedly through clarity, trust, complementary roles, healthy conflict, and learning.",

  // Analytics
  "SQL": "SQL is a language for selecting, joining, aggregating, and transforming structured data so a business question can be answered reproducibly.",
  "Data Modeling": "Data modeling defines entities, relationships, grain, and business logic so data can support consistent analysis and operations.",
  "Data Quality": "Data quality evaluates whether data is accurate, complete, timely, consistent, valid, and fit for the decision being made.",
  "Metric Definitions": "Metric definitions specify exactly what is counted, the unit and grain, inclusion rules, time window, source, owner, and intended interpretation.",
  "Distributions": "A distribution describes how values are spread, including their typical level, variation, shape, and unusual observations.",
  "Sampling": "Sampling selects observations from a population and determines how confidently findings can represent the larger group.",
  "Hypothesis Testing": "Hypothesis testing evaluates whether observed data is sufficiently inconsistent with a stated baseline while controlling known error risks.",
  "Regression": "Regression estimates how an outcome changes with one or more predictors while making assumptions that must be checked before interpretation.",
  "KPI Design": "KPI design selects a small set of measures that connect strategy to performance, ownership, thresholds, and action.",
  "Dashboard Design": "Dashboard design organizes measures, comparisons, context, and visual hierarchy so a specific audience can notice change and decide what to do.",
  "Self-Service BI": "Self-service business intelligence enables people to answer recurring questions safely through governed data, reusable definitions, and understandable tools.",
  "Data Storytelling": "Data storytelling combines a decision frame, trustworthy evidence, visual explanation, and recommendation so analysis leads to action.",
  "Trend Analysis": "Trend analysis separates direction, seasonality, cycles, noise, and structural shifts to understand how a measure changes over time.",
  "Scenario Models": "Scenario models compare coherent possible futures by changing a small set of consequential assumptions rather than pretending to predict one exact outcome.",
  "Demand Forecasting": "Demand forecasting estimates future customer demand from historical patterns, drivers, constraints, and explicitly stated uncertainty.",
  "Sensitivity Analysis": "Sensitivity analysis changes important assumptions one at a time or in combinations to reveal which inputs most affect a conclusion.",
  "A/B Testing": "A/B testing randomly assigns comparable units to variants so the causal effect of a specific change can be estimated.",
  "Guardrail Metrics": "Guardrail metrics monitor important harms or tradeoffs that must not deteriorate while a primary outcome improves.",
  "Result Interpretation": "Result interpretation translates estimates, uncertainty, practical importance, limitations, and context into an appropriately cautious decision.",

  // Customer
  "Personas": "Personas are evidence-based representations of meaningful customer patterns that help teams reason about goals, contexts, behaviors, and constraints.",
  "Jobs to Be Done": "Jobs to Be Done describes the progress a person seeks in a specific situation and the forces that shape whether they change behavior or choose a solution.",
  "Needs Segmentation": "Needs segmentation groups customers by similar desired outcomes, problems, behaviors, or constraints rather than only demographic traits.",
  "Customer Context": "Customer context captures the environment, workflow, pressures, alternatives, and constraints surrounding a customer’s decision or behavior.",
  "Research Planning": "Research planning connects a decision and uncertainty to appropriate participants, methods, questions, analysis, ethics, and timing.",
  "Survey Design": "Survey design creates questions, response choices, sampling, and sequencing that minimize bias and produce interpretable quantitative evidence.",
  "Synthesis": "Research synthesis turns observations into traceable patterns, tensions, insights, and implications without erasing contradictory evidence.",
  "Journey Mapping": "Journey mapping visualizes a customer’s end-to-end stages, goals, actions, thoughts, emotions, touchpoints, and friction in a defined scenario.",
  "Service Blueprints": "Service blueprints connect the customer-facing journey to backstage people, processes, systems, policies, and dependencies that make the experience possible.",
  "Moment Analysis": "Moment analysis studies a high-impact point in an experience to understand expectations, behavior, emotion, failure, and opportunity.",
  "Experience Measurement": "Experience measurement combines perception, behavior, and outcome signals to evaluate whether an experience helps customers make desired progress.",
  "Feedback Programs": "Feedback programs create repeatable ways to collect, route, interpret, respond to, and learn from customer input.",
  "Research Repositories": "Research repositories preserve evidence, metadata, findings, and decisions so teams can retrieve learning and avoid repeating work.",
  "Insight Prioritization": "Insight prioritization compares customer importance, evidence strength, reach, strategic relevance, and actionability before escalating a finding.",
  "Closed-Loop Learning": "Closed-loop learning connects feedback to action, communicates the response, measures the result, and feeds the outcome into the next decision.",
  "Onboarding": "Onboarding guides a customer from initial expectation to the first meaningful realization of value while reducing uncertainty and setup friction.",
  "Health Scores": "Health scores combine leading indicators of value, engagement, relationship, risk, and support into a testable view of customer condition.",
  "Churn Analysis": "Churn analysis identifies which customers leave, when, under what conditions, and which signals or causes may support prevention.",
  "Expansion Strategy": "Expansion strategy grows an account by connecting additional use, users, products, or services to demonstrated customer outcomes.",

  // Strategy
  "Market Research": "Market research combines customer, competitor, category, channel, and contextual evidence to support a defined commercial decision.",
  "Market Sizing": "Market sizing estimates a credible range for an opportunity using clear boundaries, multiple methods, explicit assumptions, and sensitivity checks.",
  "Industry Structure": "Industry structure analyzes competitors, buyers, suppliers, substitutes, entrants, complements, and regulation to understand where power and profit may concentrate.",
  "Competitive Analysis": "Competitive analysis evaluates how customers solve a problem today and compares alternatives across strategy, capabilities, economics, proof, and likely response.",
  "Strategic Moats": "Strategic moats are reinforcing advantages that make valuable performance difficult for competitors to copy, substitute, or neutralize over time.",
  "Scenario Planning": "Scenario planning builds several plausible external futures and identifies choices, signals, and contingencies that remain useful across them.",
  "Response Strategy": "Response strategy determines whether and how to react to a competitor or market move based on customer impact, advantage, cost, timing, and likely countermoves.",
  "Strategic Goals": "Strategic goals translate chosen direction into a small number of outcome commitments that guide resource allocation and measurement.",
  "Choice Cascades": "A choice cascade links aspiration, where-to-play, how-to-win, required capabilities, and management systems into one coherent strategy.",
  "Resource Allocation": "Resource allocation directs money, people, time, and leadership attention toward priorities while making opportunity costs explicit.",
  "Strategy Reviews": "Strategy reviews revisit assumptions, evidence, progress, external change, and tradeoffs so a strategy can adapt without losing coherence.",
  "Business Cases": "A business case frames a decision and compares value, cost, risk, timing, alternatives, assumptions, and measures to support an investment choice.",
  "Opportunity Analysis": "Opportunity analysis assesses a possible move through customer value, market attractiveness, strategic fit, feasibility, economics, risk, and timing.",
  "Decision Memos": "Decision memos present the decision, context, evidence, options, tradeoffs, recommendation, risks, and next steps in a concise written form.",
  "Risk Analysis": "Risk analysis identifies uncertain events, estimates likelihood and impact, examines exposure, and plans prevention, mitigation, transfer, or acceptance.",
  "Partnership Strategy": "Partnership strategy determines where another organization can create mutual advantage through complementary assets, reach, capabilities, or credibility.",
  "Build-Buy-Partner": "Build-buy-partner analysis compares internal development, acquisition, and partnership through speed, control, capability, cost, risk, and strategic importance.",
  "M&A Screening": "M&A screening applies strategic, financial, capability, market, cultural, and integration criteria to identify acquisition candidates worth deeper diligence.",
  "Integration Logic": "Integration logic explains which capabilities, systems, teams, or customer experiences should combine after a deal and which should remain distinct.",

  // Operations
  "Process Mapping": "Process mapping makes the sequence, decisions, handoffs, waits, inputs, outputs, and failure points of work visible.",
  "Standard Work": "Standard work documents the current best-known safe and effective method while creating a baseline for training and improvement.",
  "Root Cause Analysis": "Root cause analysis moves beyond symptoms to test the conditions and mechanisms that repeatedly produce an unwanted result.",
  "Continuous Improvement": "Continuous improvement uses small, repeated cycles of observation, change, measurement, and learning to improve a system over time.",
  "Project Management": "Project management coordinates scope, work, owners, schedule, resources, risks, and communication to deliver a defined outcome.",
  "Program Management": "Program management coordinates related initiatives, dependencies, benefits, decisions, and stakeholders to achieve an outcome larger than any one project.",
  "Dependency Management": "Dependency management identifies work or decisions that rely on one another and actively manages sequence, ownership, risk, and communication.",
  "Risk Management": "Risk management continuously identifies, assesses, owns, treats, and monitors uncertainty that could affect objectives.",
  "Documentation": "Documentation records information in a structured, findable, current, and audience-appropriate form so work can be understood and repeated.",
  "Decision Logs": "Decision logs preserve what was decided, why, by whom, from which evidence, with what assumptions, and when the decision should be revisited.",
  "Knowledge Bases": "Knowledge bases organize reusable guidance, evidence, answers, and ownership so people can find trustworthy information when needed.",
  "Operating Cadences": "Operating cadences establish recurring forums, inputs, decisions, owners, and follow-through that keep a business aligned and learning.",
  "Workflow Automation": "Workflow automation uses rules and integrations to move predictable work between people and systems while preserving exceptions and accountability.",
  "AI Automation": "AI automation assigns probabilistic language, perception, or reasoning tasks to AI with human review, quality controls, and clear escalation paths.",
  "No-Code Systems": "No-code systems combine configurable data, interfaces, rules, and integrations to support workflows without conventional software development.",
  "Operational Metrics": "Operational metrics reveal the flow, quality, speed, cost, capacity, and reliability of a process so teams can manage performance.",
  "Change Strategy": "Change strategy defines the case for change, affected groups, adoption barriers, sponsorship, communication, enablement, and reinforcement needed for a new way of working.",
  "Stakeholder Readiness": "Stakeholder readiness assesses awareness, understanding, willingness, capability, and local conditions that influence adoption.",
  "Adoption Planning": "Adoption planning sequences communication, training, support, feedback, incentives, and reinforcement so people can use a change successfully.",
  "Benefits Realization": "Benefits realization defines, owns, measures, and sustains the outcomes an initiative was intended to create after delivery.",

  // Leadership
  "Business Writing": "Business writing helps a specific audience understand context, evidence, reasoning, and requested action with clarity and economy.",
  "Executive Presentations": "Executive presentations compress complex material into a decision-centered narrative with credible evidence, tradeoffs, and a clear ask.",
  "Story Structure": "Story structure sequences context, tension, insight, choice, and resolution so information has meaning and momentum.",
  "Facilitation": "Facilitation designs and guides a group process so participants can contribute, understand one another, and reach a useful outcome.",
  "Stakeholder Management": "Stakeholder management identifies interests, influence, concerns, dependencies, and engagement needs so decisions and execution can move responsibly.",
  "Negotiation": "Negotiation explores interests, alternatives, options, standards, and tradeoffs to reach a workable agreement without giving away unnecessary value.",
  "Conflict Navigation": "Conflict navigation surfaces differences safely, separates people from problems, clarifies interests, and creates a path toward resolution or productive disagreement.",
  "Coalition Building": "Coalition building creates a network of credible supporters with aligned interests who can help a change gain understanding, resources, and momentum.",
  "Decision Framing": "Decision framing defines the choice, objective, constraints, stakeholders, time horizon, options, and evidence needed before analysis begins.",
  "Tradeoff Analysis": "Tradeoff analysis compares options across explicit criteria and makes clear which benefits are gained, sacrificed, delayed, or made uncertain.",
  "Decision Rights": "Decision rights clarify who recommends, contributes, decides, executes, and can reopen a decision under specified conditions.",
  "Judgment Under Uncertainty": "Judgment under uncertainty combines evidence, base rates, assumptions, ranges, reversibility, and learning plans when no option is fully known.",
  "Executive Presence": "Executive presence is the ability to bring calm, clarity, credibility, and constructive challenge to consequential senior-level conversations.",
  "Strategic Thinking": "Strategic thinking connects systems, external change, second-order effects, choices, advantage, and long-term consequences.",
  "Board Communication": "Board communication gives directors concise oversight-level information about performance, risk, strategy, governance, and decisions requiring attention.",
  "Organizational Context": "Organizational context is the history, incentives, power, culture, constraints, and informal networks that shape what decisions are possible.",
  "Coaching": "Coaching uses listening, questions, observation, challenge, and reflection to help another person develop judgment and choose their own next action.",
  "Delegation": "Delegation transfers an outcome with context, authority, boundaries, resources, checkpoints, and accountability—not merely a task.",
  "Feedback": "Feedback describes observable behavior and impact, invites perspective, and supports a specific adjustment or continuation.",
  "Talent Development": "Talent development identifies future capability needs and creates experiences, support, feedback, and opportunities that help people grow toward them.",
};

export function getCapabilityDefinition(capability: string) {
  return CAPABILITY_DEFINITIONS[capability]
    ?? `${capability} is a structured professional practice used to improve a specific decision, make reasoning visible, and create evidence that another person can inspect.`;
}

const DOMAIN_CUES: Record<string, { decision: string; evidence: string; scenario: string; commonTrap: string; quality: string }> = {
  Product: {
    decision: "choose which customer problem, product direction, or delivery bet deserves commitment",
    evidence: "customer behavior, product outcomes, feasibility constraints, and the assumptions most likely to change the choice",
    scenario: "A product team has several plausible ideas but cannot fund all of them.",
    commonTrap: "turning an untested preference into a feature commitment",
    quality: "the work links a customer or business outcome to evidence, tradeoffs, and a reversible next step",
  },
  Marketing: {
    decision: "choose the audience, promise, channel, or market action most likely to create qualified demand",
    evidence: "customer language, response behavior, competitive alternatives, conversion, and commercial outcomes",
    scenario: "A team is preparing to introduce an offer to a market that already has familiar alternatives.",
    commonTrap: "mistaking louder communication for a clearer or more relevant value proposition",
    quality: "the work names a specific audience, meaningful value, credible proof, and a measurable response",
  },
  Business: {
    decision: "choose how the organization should create, fund, price, or capture value",
    evidence: "financial drivers, customer willingness, unit behavior, capacity, timing, and opportunity cost",
    scenario: "Leaders must decide whether a commercial opportunity is attractive enough to justify scarce resources.",
    commonTrap: "presenting a precise number while hiding the assumptions that produced it",
    quality: "the work makes economic logic, assumptions, alternatives, uncertainty, and decision thresholds visible",
  },
  Analytics: {
    decision: "turn a business question into a trustworthy measurement, model, or interpretation",
    evidence: "well-defined data, appropriate comparisons, uncertainty, limitations, and practical significance",
    scenario: "Two teams are reading the same performance data and reaching different conclusions.",
    commonTrap: "treating correlation, precision, or a dashboard as proof of causality or importance",
    quality: "the analysis is reproducible, correctly scoped, honest about uncertainty, and tied to a decision",
  },
  Customer: {
    decision: "understand customer progress, behavior, friction, or value well enough to choose a helpful response",
    evidence: "specific behavior, context, direct observation, repeated patterns, contradictions, and outcome signals",
    scenario: "Customers say they want improvement, but the team does not yet understand the situation producing the need.",
    commonTrap: "substituting assumptions, opinions, or a single memorable quote for a pattern of evidence",
    quality: "the insight is traceable to customer evidence and clearly changes a product or service decision",
  },
  Strategy: {
    decision: "choose where to play, how to win, and what the organization will deliberately not pursue",
    evidence: "market structure, customer value, competitive response, capabilities, economics, risks, and scenarios",
    scenario: "An organization sees several attractive directions but needs one coherent allocation of attention and capital.",
    commonTrap: "calling a list of ambitions a strategy without making an integrated choice",
    quality: "the recommendation connects external evidence, advantage, tradeoffs, required capabilities, and triggers for review",
  },
  Operations: {
    decision: "improve how work flows, decisions happen, and outcomes are delivered reliably",
    evidence: "observed steps, wait time, defects, handoffs, capacity, ownership, adoption, and benefit measures",
    scenario: "A recurring workflow is slow and frustrating, but each team sees only its own part of the system.",
    commonTrap: "automating or documenting a broken process before understanding its cause",
    quality: "the change addresses a verified constraint, clarifies ownership, handles exceptions, and measures the intended benefit",
  },
  Leadership: {
    decision: "create clarity, alignment, accountability, or growth across people with different perspectives and power",
    evidence: "stakeholder interests, observable behavior, decision quality, commitments, follow-through, and learning",
    scenario: "A consequential decision requires support from people who do not share the same incentives or interpretation.",
    commonTrap: "using confidence, authority, or polished language in place of listening and sound reasoning",
    quality: "the interaction makes the decision and reasoning clearer while preserving trust, agency, and accountability",
  },
  General: {
    decision: "make a consequential commercial product choice with clearer reasoning",
    evidence: "relevant observations, explicit assumptions, alternatives, and measures of success",
    scenario: "Jada needs to move a real decision forward without pretending uncertainty has disappeared.",
    commonTrap: "completing a template without improving the underlying decision",
    quality: "the work is specific, evidence-based, transparent about tradeoffs, and useful to another person",
  },
};

function contextPhrase(context: LessonContext) {
  const focus = context.competencyDescription.replace(/[.]$/, "");
  const plainFocus = focus ? `${focus.charAt(0).toLowerCase()}${focus.slice(1)}` : "connect this concept to a real decision";
  if (context.competency && context.competency !== context.domain) return `${context.capability} belongs to ${context.competency}. Here, Jada works to ${plainFocus}.`;
  return `In this domain, Jada works to ${plainFocus}.`;
}

export function buildLessonBrief(context: LessonContext): LessonBrief {
  const cue = DOMAIN_CUES[context.domain] ?? DOMAIN_CUES.General;
  const definition = getCapabilityDefinition(context.capability);
  const competencyContext = contextPhrase(context);
  const usefulWhen = `It is most useful when Jada needs to ${cue.decision} and can work with ${cue.evidence}.`;
  const correctFoundation = definition;
  const correctChoice = `Use ${context.capability} when it directly reduces uncertainty in the decision and the needed evidence can be gathered or examined.`;
  const correctApplication = `Start by writing the exact decision, then identify the evidence ${context.capability} must produce before choosing a method or format.`;
  const correctReview = `Check whether the ${context.capability} work is specific, traceable to evidence, clear about tradeoffs, and useful for the stated decision.`;

  if (context.lessonIndex === 0) {
    return {
      goal: `Understand what ${context.capability} means, why it matters, and what it is meant to change.`,
      objective: `Research how credible practitioners define ${context.capability}, compare their views, and form your own explanation before applying it.`,
      conceptDefinition: definition,
      partLabel: "Part 1 · Build the concept",
      sectionTitle: "The core idea",
      explanation: [`${competencyContext} The brief definition is only an orientation; Jada must research how the concept is used, debated, and limited before completing the task.`],
      researchTitle: `Investigate ${context.capability} before applying it`,
      researchSteps: [
        `Find two credible sources that define ${context.capability}. Save each title, author or organization, date, and link.`,
        "Write one point where the sources agree and one place where their emphasis differs.",
        `Find one real example or case. Explain what makes it an example of ${context.capability} using evidence from your sources.`,
      ],
      exampleLabel: "See the concept in context",
      example: `${cue.scenario} Jada uses ${context.capability} to make the decision and its assumptions visible. She avoids ${cue.commonTrap}; instead, she asks what evidence would change the choice.`,
      practice: [
        `Write your own two-sentence explanation of ${context.capability} without copying either source.`,
        `Name a real decision where the concept might help, and cite which source supports that use.`,
        "Write one question your research has not answered yet and identify where you will look next.",
      ],
      notePrompt: `Source 1… Source 2… They agree that… They differ on… In my own words… My unanswered question…`,
      checkQuestion: `Which explanation best captures ${context.capability}?`,
      options: [correctFoundation, `It is a polished document that proves the team has completed the ${context.competency.toLowerCase()} process.`, `It is a way to remove uncertainty so leaders can approve a decision without revisiting it.`],
      correctAnswer: correctFoundation,
      correctFeedback: `Correct. The definition describes the purpose and boundaries of ${context.capability}, not merely its output.`,
      retryFeedback: `Try again. Look for the option that explains what ${context.capability} does and how it improves a decision.`,
      remember: [definition, "Start with the decision, not the template.", `Avoid ${cue.commonTrap}.`, "Good work creates evidence another person can inspect."],
    };
  }

  if (context.lessonIndex === 1) {
    return {
      goal: `Recognize when ${context.capability} is the right approach and when another method would be more useful.`,
      objective: `Research when practitioners recommend ${context.capability}, find a meaningful limitation, and decide whether it fits a real situation.`,
      conceptDefinition: definition,
      partLabel: "Part 1 · Choose deliberately",
      sectionTitle: `When to use ${context.capability}`,
      explanation: [`${usefulWhen} This is a starting hypothesis, not a rule. Research should determine when the approach fits and where another method is stronger.`],
      researchTitle: `Find the boundaries of ${context.capability}`,
      researchSteps: [
        `Find one credible source explaining when to use ${context.capability} and one source describing a limitation, criticism, or common misuse.`,
        "Compare the evidence each source uses. Note whether the guidance is based on research, experience, a case study, or opinion.",
        `Find an alternative method that could address a similar decision. Record what that alternative does better than ${context.capability}.`,
      ],
      exampleLabel: "Compare the approaches",
      example: `${cue.scenario} Before beginning, Jada asks whether ${context.capability} can produce ${cue.evidence}. If it cannot, she selects a different method or combines approaches instead of forcing the work into a familiar template.`,
      practice: [
        "Write the decision and the single uncertainty blocking progress.",
        `Use your sources to argue why ${context.capability} is—or is not—the right tool for that uncertainty.`,
        "Name the strongest alternative and describe what new evidence would make you change your method choice.",
      ],
      notePrompt: `Use-case source… Limitation source… Alternative method… My decision… My method choice and evidence…`,
      checkQuestion: `When is ${context.capability} the strongest choice?`,
      options: [correctChoice, `Whenever a stakeholder requests a ${context.capability} deliverable, even if the decision is unclear.`, `Only after the team has already chosen an answer and needs evidence to support it.`],
      correctAnswer: correctChoice,
      correctFeedback: `Correct. The approach earns its place by reducing a named uncertainty with relevant evidence.`,
      retryFeedback: "Try again. Choose the option that connects the method to the decision and the evidence it can realistically produce.",
      remember: ["Name the uncertainty before choosing the method.", `Use ${context.capability} for a decision—not for ceremony.`, "Prefer the lightest credible approach.", "Combine methods when one evidence source is insufficient."],
    };
  }

  if (context.lessonIndex === 2) {
    return {
      goal: `Apply ${context.capability} to a real decision through a small, evidence-seeking sequence.`,
      objective: `Research a credible method and a real example, then adapt what you learn into a first draft for your own decision.`,
      conceptDefinition: definition,
      partLabel: "Part 1 · Apply the method",
      sectionTitle: `A guided ${context.capability} sequence`,
      explanation: [`Application should be adapted from evidence, not copied from a template. Jada must investigate how the method works in practice before choosing her own sequence.`],
      researchTitle: `Research how ${context.capability} is practiced`,
      researchSteps: [
        `Find one credible method, framework, or working guide for ${context.capability}. Record its steps and the assumptions behind them.`,
        "Find a case study or public example. Identify what the practitioner changed to fit the situation.",
        "Locate one caution about using the method poorly. Turn that caution into a check for your own draft.",
      ],
      exampleLabel: "Work one pass at a time",
      example: `${cue.scenario} Jada writes the decision first, marks assumptions separately from facts, and creates a small ${context.capability} draft. She asks a reviewer to challenge the evidence before expanding the work.`,
      practice: [
        "Frame the decision in one sentence, including who decides and by when.",
        `Adapt the researched method into the smallest ${context.capability} draft that could expose a weak assumption.`,
        "Annotate which parts came from research, which parts you adapted, and why.",
        "Ask a question that would test the draft before treating it as a recommendation.",
      ],
      notePrompt: `Method source… Case source… What I adapted… Why it fits my decision… Assumption to test…`,
      checkQuestion: `What should Jada do first when applying ${context.capability}?`,
      options: [correctApplication, `Complete the final artifact before showing it to anyone so early uncertainty does not distract stakeholders.`, `Choose the most sophisticated available framework and fill in every section.`],
      correctAnswer: correctApplication,
      correctFeedback: "Correct. Framing the decision and evidence need keeps the method focused on learning rather than output production.",
      retryFeedback: "Try again. The best first move clarifies what must be decided and what the work needs to reveal.",
      remember: ["Frame before building.", "Separate facts from assumptions.", "Make the first draft small enough to challenge.", "Let evidence determine the next step."],
    };
  }

  return {
    goal: `Evaluate the quality of ${context.capability} and improve the reasoning without taking the work away from its author.`,
    objective: `Research quality standards and contrasting examples, then use them to critique a draft and choose the most valuable revision.`,
    conceptDefinition: definition,
    partLabel: "Part 1 · Review quality",
    sectionTitle: `What strong ${context.capability} work looks like`,
    explanation: [`A strong result is not simply polished. Jada must research what credible sources consider high-quality ${context.capability} work, then defend the review criteria she chooses.`],
    researchTitle: `Build an evidence-based review standard`,
    researchSteps: [
      `Find two credible sources that describe quality criteria for ${context.capability}. Record where their criteria overlap and differ.`,
      "Find one strong or weak public example. Evaluate it against both sources rather than relying on first impressions.",
      "Find one criticism or limitation of the common review standard and decide whether your rubric should account for it.",
    ],
    exampleLabel: "Review the reasoning, not the person",
    example: `${cue.scenario} Jada reviews a ${context.capability} draft by asking what decision it supports, where each claim came from, which alternative was considered, and what new evidence would change the recommendation.`,
    practice: [
      `Choose one ${context.capability} draft—your own or a public example.`,
      "Create a short rubric from your research and cite the source behind each criterion.",
      "Use the rubric to identify one strength, one weak assumption, and one missing alternative.",
      "Choose one revision that would most improve the decision and defend it with research.",
    ],
    notePrompt: `Quality source 1… Quality source 2… My rubric… Evidence from the example… Revision and research-based rationale…`,
    checkQuestion: `Which review question best tests the quality of ${context.capability}?`,
    options: [correctReview, `Does the artifact use every section of the recommended template and look ready for executives?`, `Will the reviewer agree with the recommendation without asking for more information?`],
    correctAnswer: correctReview,
    correctFeedback: `Correct. Quality comes from traceable evidence, clear reasoning, visible tradeoffs, and usefulness to the decision.`,
    retryFeedback: "Try again. Look for the review question that tests reasoning and evidence rather than polish or agreement.",
    remember: ["Review the decision chain, not surface polish.", "Trace claims back to evidence.", "Make alternatives and tradeoffs visible.", "Revise the highest-risk weakness first."],
  };
}
