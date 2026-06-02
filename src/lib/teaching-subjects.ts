export interface TeachingSubject {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const teachingSubjects: TeachingSubject[] = [
  {
    id: "pediatrics",
    name: "Pediatrics",
    description: "Childhood infections, growth, development",
    icon: "👶",
  },
  {
    id: "internal-medicine",
    name: "Internal Medicine",
    description: "Adult medicine, chronic disease, multisystem",
    icon: "🫀",
  },
  {
    id: "surgery",
    name: "Surgery",
    description: "Acute abdomen, trauma, pre/post-op",
    icon: "🔪",
  },
  {
    id: "obgyn",
    name: "Obstetrics & Gynecology",
    description: "Pregnancy, labor, gynecologic disease",
    icon: "🤰",
  },
  {
    id: "infectious-disease",
    name: "Infectious Disease",
    description: "Fever, sepsis, antimicrobial therapy",
    icon: "🦠",
  },
  {
    id: "cardiology",
    name: "Cardiology",
    description: "Chest pain, heart failure, arrhythmias",
    icon: "💓",
  },
  {
    id: "neurology",
    name: "Neurology",
    description: "Headache, stroke, seizures, weakness",
    icon: "🧠",
  },
  {
    id: "emergency-medicine",
    name: "Emergency Medicine",
    description: "Resuscitation, toxicology, acute presentations",
    icon: "🚑",
  },
  {
    id: "psychiatry",
    name: "Psychiatry",
    description: "Mood, psychosis, substance use",
    icon: "🧩",
  },
  {
    id: "dermatology",
    name: "Dermatology",
    description: "Rashes, lesions, skin infections",
    icon: "🩹",
  },
];

export function getSubject(id: string) {
  return teachingSubjects.find((s) => s.id === id);
}
