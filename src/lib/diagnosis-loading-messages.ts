const GENERAL_MESSAGES = [
  "Consulting Dr. Google… professionally.",
  "Performing a totally-not-panicked differential diagnosis.",
  "Trying to remember what the consultant would ask next.",
  "Loading… because medicine apparently can't be solved with Ctrl+F.",
  "Searching for zebras after ruling out horses.",
  "Reading 14 years of medical education in 4 seconds.",
  "Checking if it's lupus. It's probably not lupus.",
  "Pretending we already know the answer.",
  "Crossing fingers for a straightforward case.",
  "Translating symptoms into medical student anxiety.",
  "Generating differentials faster than your group discussion.",
  "Finding diagnoses your consultant will ask about.",
  "Making educated guesses look professional.",
  "Trying not to miss the one diagnosis that appears in exams.",
  "Asking the universal question: 'What else could this be?'",
  "Loading… please remain clinically calm.",
  "Searching UpToDate mentally.",
  "Performing evidence-based wizardry.",
  "Calculating how many investigations are too many investigations.",
  "Turning patient complaints into consultant presentations.",
  "Double-checking that everything isn't just dehydration.",
  "Trying very hard not to diagnose stress.",
  "Finding the diagnosis before the patient Googles it.",
  "Converting chaos into a management plan.",
  "Looking for the diagnosis hiding in plain sight.",
  "Running a bedside-to-boards speedrun.",
  "Channeling every ward round you've ever survived.",
  "Organizing symptoms into something vaguely defensible.",
  "Applying textbook logic to real-world chaos.",
  "Summoning the confidence of a fourth-year on finals week.",
];

const RARE_MESSAGES = [
  "Have you considered becoming a dermatologist?",
  "The consultant is approaching. Think faster.",
  "The answer is not 'observe and review later.'",
  "If this loads slowly, blame the hospital Wi-Fi.",
  "Generating confidence. Accuracy sold separately.",
  "Running differential.exe…",
  "Please wait while we respectfully overthink everything.",
  "This differential is brought to you by caffeine and denial.",
  "Somewhere, a medical student just said 'interesting case.'",
  "Recalibrating the overconfidence module.",
];

const NAME_TEMPLATES = [
  "Meanwhile, thank {{name}} for creating today's teaching opportunity.",
  "{{name}} has unknowingly become part of medical education.",
  "Attempting to impress {{name}} with diagnostic competence.",
  "{{name}} provided symptoms. We're providing panic and analysis.",
  "Building a management plan worthy of {{name}}'s trust.",
  "{{name}} deserves answers. We're assembling our best guesses.",
];

const CONTEXT_MESSAGES: Record<string, string[]> = {
  chest: [
    "Attempting not to call every chest pain an MI.",
    "Differentiating cardiac drama from musculoskeletal theatre.",
    "Checking if this chest pain is 'just anxiety' (it never is, until it is).",
    "Running the chest pain algorithm at medically unsafe speeds.",
    "Troponin thoughts loading…",
  ],
  fever: [
    "It's either an infection… or medicine trying to be interesting.",
    "Fever workup: infection, inflammation, or inconvenient timing.",
    "Calculating how many cultures one patient can reasonably provide.",
    "Separating viral vibes from bacterial bad news.",
    "Asking the timeless question: where is the source?",
  ],
  abdominal: [
    "Somewhere, an appendix is sweating.",
    "Mapping abdominal pain to organs with questionable confidence.",
    "Deciding if this needs surgery, fluids, or both.",
    "Performing the sacred art of abdominal exam interpretation.",
    "Ruling out surgical emergencies with academic enthusiasm.",
  ],
  headache: [
    "Checking whether the patient needs paracetamol or a neurology textbook.",
    "Sorting benign headaches from the ones that ruin your afternoon.",
    "Applying the 'worst headache of their life' filter.",
    "Neurology referral thoughts intensifying.",
    "Differentiating migraine from 'maybe just needs sleep.'",
  ],
  breath: [
    "Counting respirations and existential dread simultaneously.",
    "Deciding if this is lungs, heart, or panic with oxygen saturations.",
    "Preparing a differential that respects the airway.",
    "Shortness of breath: always simple until it isn't.",
  ],
  cough: [
    "Building a cough differential longer than your revision notes.",
    "Separating post-viral nuisance from something worth admitting.",
    "Listening to the cough in your head. Clinical, obviously.",
  ],
  rash: [
    "Consulting the dermatology corner of your brain.",
    "Is it allergic, infectious, or mysteriously educational?",
    "Describing this rash using words you half remember.",
  ],
  dizzy: [
    "Sorting vertigo from near-syncope from 'stood up too fast.'",
    "Running the dizziness flowchart at student velocity.",
  ],
  nausea: [
    "Tracing nausea back to one of seventeen organ systems.",
    "GI, metabolic, or medication? The eternal student trilogy.",
  ],
};

const COMPLAINT_KEYWORDS: Array<{ keys: string[]; context: string }> = [
  { keys: ["chest pain", "chest"], context: "chest" },
  { keys: ["fever", "pyrexia", "temperature"], context: "fever" },
  { keys: ["abdominal", "stomach", "belly", "gut"], context: "abdominal" },
  { keys: ["headache", "head pain", "migraine"], context: "headache" },
  { keys: ["shortness of breath", "breathless", "dyspnea", "dyspnoea", "sob"], context: "breath" },
  { keys: ["cough"], context: "cough" },
  { keys: ["rash", "skin", "lesion", "itch"], context: "rash" },
  { keys: ["dizz", "vertigo", "syncope", "faint"], context: "dizzy" },
  { keys: ["nausea", "vomit", "emesis"], context: "nausea" },
];

const DYNAMIC_OPENERS = [
  "Currently",
  "Right now",
  "At this moment",
  "Statistically speaking",
  "Medically speaking",
  "Between us",
];

const DYNAMIC_MIDDLES = [
  "we are overthinking",
  "we are heroically analyzing",
  "we are academically panicking about",
  "we are professionally guessing about",
  "we are evidence-basing",
  "we are differential-ing",
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function applyName(template: string, patientName?: string): string {
  const name = patientName?.trim();
  if (!name) return template;
  return template.replace(/\{\{name\}\}/g, name);
}

function detectContexts(complaints: string[]): string[] {
  const joined = complaints.join(" ").toLowerCase();
  const found = new Set<string>();

  for (const { keys, context } of COMPLAINT_KEYWORDS) {
    if (keys.some((key) => joined.includes(key))) {
      found.add(context);
    }
  }

  return [...found];
}

function generateDynamicMessage(complaints: string[], patientName?: string): string {
  const contexts = detectContexts(complaints);
  const complaintLabel = complaints.length
    ? pickRandom(complaints)
    : "this presentation";

  const variants = [
    `${pickRandom(DYNAMIC_OPENERS)}, ${pickRandom(DYNAMIC_MIDDLES)} ${complaintLabel.toLowerCase()}.`,
    `Running a ${complaintLabel.toLowerCase()} differential with maximum student energy.`,
    `Turning "${complaintLabel}" into something you can say on ward round.`,
  ];

  if (contexts.length > 0) {
    const contextPool = contexts.flatMap((c) => CONTEXT_MESSAGES[c] ?? []);
    if (contextPool.length) {
      variants.push(pickRandom(contextPool));
    }
  }

  if (patientName?.trim()) {
    variants.push(
      `${patientName.trim()} presented with ${complaintLabel.toLowerCase()}. We present: diagnostic chaos.`,
    );
  }

  return pickRandom(variants);
}

export function pickDiagnosisLoadingMessage(options: {
  patientName?: string;
  complaints?: string[];
  exclude?: string;
}): string {
  const complaints = options.complaints ?? [];
  const patientName = options.patientName?.trim();
  const exclude = options.exclude;
  const contexts = detectContexts(complaints);

  const pools: Array<{ weight: number; messages: string[] }> = [];

  if (Math.random() < 0.05) {
    pools.push({ weight: 100, messages: RARE_MESSAGES });
  } else {
    if (contexts.length > 0) {
      const contextMessages = contexts.flatMap((c) => CONTEXT_MESSAGES[c] ?? []);
      pools.push({ weight: 40, messages: contextMessages });
    }

    if (patientName) {
      pools.push({
        weight: 25,
        messages: NAME_TEMPLATES.map((t) => applyName(t, patientName)),
      });
    }

    pools.push({ weight: 35, messages: GENERAL_MESSAGES });
    pools.push({ weight: 15, messages: [generateDynamicMessage(complaints, patientName)] });
  }

  const totalWeight = pools.reduce((sum, pool) => sum + pool.weight, 0);
  let roll = Math.random() * totalWeight;

  let candidates: string[] = GENERAL_MESSAGES;
  for (const pool of pools) {
    roll -= pool.weight;
    if (roll <= 0) {
      candidates = pool.messages;
      break;
    }
  }

  const filtered = candidates.filter((m) => m !== exclude);
  const message = pickRandom(filtered.length ? filtered : candidates);
  return applyName(message, patientName);
}
