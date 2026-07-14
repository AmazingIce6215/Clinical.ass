export interface TeachingSubject {
  id: string;
  name: string;
  description: string;
  icon: TeachingSubjectIconName;
}

export type TeachingSubjectIconName =
  | "activity"
  | "baby"
  | "brain"
  | "message-circle"
  | "microscope"
  | "person-standing"
  | "scan-line"
  | "scissors"
  | "siren"
  | "stethoscope";

export const teachingSubjects: TeachingSubject[] = [
  {
    id: "pediatrics",
    name: "Pediatrics",
    description: "Childhood infections, growth, development, and acute care",
    icon: "baby",
  },
  {
    id: "internal-medicine",
    name: "Internal Medicine",
    description: "Adult medicine, chronic disease, and multisystem presentations",
    icon: "stethoscope",
  },
  {
    id: "surgery",
    name: "Surgery",
    description: "Acute abdomen, trauma, and perioperative care",
    icon: "scissors",
  },
  {
    id: "obgyn",
    name: "Obstetrics & Gynecology",
    description: "Pregnancy, labour, and gynaecologic presentations",
    icon: "person-standing",
  },
  {
    id: "infectious-disease",
    name: "Infectious Disease",
    description: "Fever, sepsis, and antimicrobial decision-making",
    icon: "microscope",
  },
  {
    id: "cardiology",
    name: "Cardiology",
    description: "Chest pain, circulation, heart failure, and arrhythmias",
    icon: "activity",
  },
  {
    id: "neurology",
    name: "Neurology",
    description: "Headache, stroke, seizures, and focal weakness",
    icon: "brain",
  },
  {
    id: "emergency-medicine",
    name: "Emergency Medicine",
    description: "Resuscitation, toxicology, and acute presentations",
    icon: "siren",
  },
  {
    id: "psychiatry",
    name: "Psychiatry",
    description: "Mood, psychosis, risk assessment, and substance use",
    icon: "message-circle",
  },
  {
    id: "dermatology",
    name: "Dermatology",
    description: "Rashes, lesions, and common skin infections",
    icon: "scan-line",
  },
];

export function getSubject(id: string) {
  return teachingSubjects.find((s) => s.id === id);
}
