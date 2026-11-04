/**
 * Placeholder sample data for the mock API. Deliberately NOT real Dartmouth
 * records — names like "Technology A" make it obvious this is fake.
 */
import type { LinkEvidence, MatchFieldComparison, SourceRef } from "@/lib/api/types";

export interface RawTechnology {
  id: string;
  title: string;
  ttoCaseNumber: string;
  status: "available" | "licensed" | "unknown";
  summary: string;
  categories: string[];
  publishedAt: string | null;
}

export interface RawPatent {
  id: string;
  number: string;
  title: string;
  abstract: string;
  filedAt: string | null;
  grantedAt: string | null;
  assignees: string[];
  cpcCodes: string[];
  forwardCitations: number;
  governmentInterest: string | null;
  inventorIds: string[];
}

export interface RawInventor {
  id: string;
  name: string;
  affiliation: string | null;
}

export interface RawLink {
  technologyId: string;
  patentId: string;
  link: LinkEvidence;
}

export interface RawMatchCandidate {
  id: string;
  technologyId: string;
  patentId: string;
  method: LinkEvidence["method"];
  confidence: number;
  comparisons: MatchFieldComparison[];
  judgeRationale: string | null;
}

const DARTMOUTH = "Trustees of Dartmouth College";
const FUNDING = (n: string, agency: string) =>
  `This invention was made with government support under grant SAMPLE-${n} awarded by the ${agency}. The government has certain rights in the invention.`;

export const ttoSource = (caseNumber: string): SourceRef => ({
  kind: "tto",
  label: `TTO listing ${caseNumber} (sample PDF)`,
  url: `https://example.org/sample-tto/${caseNumber}.pdf`,
});

export const usptoSource = (number: string): SourceRef => ({
  kind: "uspto",
  label: `USPTO record ${number} (sample)`,
  url: `https://example.org/sample-uspto/${number.replace(/[^0-9A-Za-z]/g, "")}`,
});

export const technologies: RawTechnology[] = [
  {
    id: "tech-a",
    title: "Technology A",
    ttoCaseNumber: "TTO-0001",
    status: "available",
    summary:
      "Sample placeholder technology. An imaging method for medical devices that improves image contrast at lower dose.",
    categories: ["Medical devices", "Imaging"],
    publishedAt: "2024-03-01",
  },
  {
    id: "tech-b",
    title: "Technology B",
    ttoCaseNumber: "TTO-0002",
    status: "available",
    summary:
      "Sample placeholder technology. A coating material that increases battery electrode lifetime.",
    categories: ["Materials", "Energy"],
    publishedAt: "2023-09-15",
  },
  {
    id: "tech-c",
    title: "Technology C",
    ttoCaseNumber: "TTO-0003",
    status: "available",
    summary:
      "Sample placeholder technology. A machine learning model that flags anomalies in sensor data streams.",
    categories: ["Software", "Machine learning"],
    publishedAt: "2025-01-20",
  },
  {
    id: "tech-d",
    title: "Technology D",
    ttoCaseNumber: "TTO-0004",
    status: "licensed",
    summary:
      "Sample placeholder technology. A point-of-care diagnostic device for rapid blood testing.",
    categories: ["Medical devices", "Diagnostics"],
    publishedAt: "2021-06-10",
  },
  {
    id: "tech-e",
    title: "Technology E",
    ttoCaseNumber: "TTO-0005",
    status: "available",
    summary:
      "Sample placeholder technology. A thermal energy storage material for buildings.",
    categories: ["Energy", "Materials"],
    publishedAt: "2022-11-02",
  },
  {
    id: "tech-f",
    title: "Technology F",
    ttoCaseNumber: "TTO-0006",
    status: "unknown",
    summary:
      "Sample placeholder technology. Software that assists diagnostics by summarising lab results. No patent linked yet.",
    categories: ["Software", "Diagnostics"],
    publishedAt: null,
  },
];

export const inventors: RawInventor[] = [
  { id: "inv-1", name: "Inventor One", affiliation: "Dartmouth College (sample)" },
  { id: "inv-2", name: "Inventor Two", affiliation: "Dartmouth College (sample)" },
  { id: "inv-3", name: "Inventor Three", affiliation: "Dartmouth College (sample)" },
  { id: "inv-4", name: "Inventor Four", affiliation: "Geisel School of Medicine (sample)" },
  { id: "inv-5", name: "Inventor Five", affiliation: "Thayer School of Engineering (sample)" },
  { id: "inv-6", name: "Inventor Six", affiliation: null },
];

export const patents: RawPatent[] = [
  {
    id: "US-0000001",
    number: "US 0,000,001",
    title: "Patent 1 — imaging contrast method (sample)",
    abstract: "Sample abstract. A method of improving imaging contrast in medical devices.",
    filedAt: "2020-02-11",
    grantedAt: "2023-05-16",
    assignees: [DARTMOUTH],
    cpcCodes: ["A61B 6/00"],
    forwardCitations: 14,
    governmentInterest: FUNDING("0001", "National Institutes of Health"),
    inventorIds: ["inv-1", "inv-4"],
  },
  {
    id: "US-0000002",
    number: "US 0,000,002",
    title: "Patent 2 — low-dose imaging apparatus (sample)",
    abstract: "Sample abstract. An apparatus for low-dose medical imaging.",
    filedAt: "2021-07-30",
    grantedAt: "2024-09-03",
    assignees: [DARTMOUTH, "Sample Industry Co."],
    cpcCodes: ["A61B 6/03"],
    forwardCitations: 5,
    governmentInterest: null,
    inventorIds: ["inv-1"],
  },
  {
    id: "US-0000003",
    number: "US 0,000,003",
    title: "Patent 3 — electrode coating (sample)",
    abstract: "Sample abstract. A coating that extends battery electrode lifetime.",
    filedAt: "2019-04-02",
    grantedAt: "2022-01-11",
    assignees: [DARTMOUTH],
    cpcCodes: ["H01M 4/62"],
    forwardCitations: 22,
    governmentInterest: FUNDING("0002", "National Science Foundation"),
    inventorIds: ["inv-2", "inv-5"],
  },
  {
    id: "US-0000004",
    number: "US 0,000,004",
    title: "Patent 4 — anomaly detection model (sample)",
    abstract: "Sample abstract. A machine learning model for anomaly detection in sensor data.",
    filedAt: "2022-08-19",
    grantedAt: "2025-02-25",
    assignees: [DARTMOUTH],
    cpcCodes: ["G06N 20/00"],
    forwardCitations: 3,
    governmentInterest: null,
    inventorIds: ["inv-3"],
  },
  {
    id: "US-0000005",
    number: "US 0,000,005",
    title: "Patent 5 — streaming sensor pipeline (sample)",
    abstract: "Sample abstract. A pipeline for processing streaming sensor data.",
    filedAt: "2021-03-05",
    grantedAt: "2023-11-14",
    assignees: [DARTMOUTH, "Sample Industry Co."],
    cpcCodes: ["G06F 16/00"],
    forwardCitations: 9,
    governmentInterest: FUNDING("0003", "National Science Foundation"),
    inventorIds: ["inv-3", "inv-5"],
  },
  {
    id: "US-0000006",
    number: "US 0,000,006",
    title: "Patent 6 — point-of-care blood test (sample)",
    abstract: "Sample abstract. A point-of-care device for rapid blood diagnostics.",
    filedAt: "2016-10-21",
    grantedAt: "2019-08-06",
    assignees: [DARTMOUTH],
    cpcCodes: ["G01N 33/49"],
    forwardCitations: 41,
    governmentInterest: FUNDING("0004", "National Institutes of Health"),
    inventorIds: ["inv-4"],
  },
  {
    id: "US-0000007",
    number: "US 0,000,007",
    title: "Patent 7 — thermal storage composite (sample)",
    abstract: "Sample abstract. A composite material for storing thermal energy.",
    filedAt: "2018-01-09",
    grantedAt: "2020-12-01",
    assignees: [DARTMOUTH],
    cpcCodes: ["C09K 5/06"],
    forwardCitations: 7,
    governmentInterest: null,
    inventorIds: ["inv-2", "inv-6"],
  },
  {
    id: "US-0000008",
    number: "US 0,000,008",
    title: "Patent 8 — lab result summarisation (sample)",
    abstract: "Sample abstract. Software that summarises laboratory results for clinicians.",
    filedAt: "2023-02-14",
    grantedAt: "2025-07-08",
    assignees: [DARTMOUTH],
    cpcCodes: ["G16H 10/40"],
    forwardCitations: 1,
    governmentInterest: null,
    inventorIds: ["inv-6"],
  },
];

/** Links already established by entity resolution. */
export const links: RawLink[] = [
  { technologyId: "tech-a", patentId: "US-0000001", link: { method: "patent_number", confidence: 1 } },
  { technologyId: "tech-a", patentId: "US-0000002", link: { method: "title_inventor", confidence: 0.86 } },
  { technologyId: "tech-b", patentId: "US-0000003", link: { method: "patent_number", confidence: 1 } },
  { technologyId: "tech-c", patentId: "US-0000004", link: { method: "patent_number", confidence: 1 } },
  { technologyId: "tech-c", patentId: "US-0000005", link: { method: "title_inventor", confidence: 0.81 } },
  { technologyId: "tech-d", patentId: "US-0000006", link: { method: "patent_number", confidence: 1 } },
  { technologyId: "tech-e", patentId: "US-0000007", link: { method: "title_inventor", confidence: 0.79 } },
];

/** Uncertain matches waiting for human review. */
export const matchCandidates: RawMatchCandidate[] = [
  {
    id: "match-1",
    technologyId: "tech-f",
    patentId: "US-0000008",
    method: "title_inventor",
    confidence: 0.62,
    comparisons: [
      { field: "Title", left: "Technology F (lab result summarisation software)", right: "Patent 8 — lab result summarisation", similarity: 0.71 },
      { field: "Inventors", left: "Inventor Six", right: "Inventor Six", similarity: 1 },
      { field: "Patent number", left: "(none listed in TTO PDF)", right: "US 0,000,008", similarity: 0 },
    ],
    judgeRationale:
      "Sample LLM-judge rationale: titles describe the same function and the inventor matches, but the TTO listing cites no patent number. Marked uncertain.",
  },
  {
    id: "match-2",
    technologyId: "tech-e",
    patentId: "US-0000003",
    method: "title_inventor",
    confidence: 0.55,
    comparisons: [
      { field: "Title", left: "Technology E (thermal energy storage material)", right: "Patent 3 — electrode coating", similarity: 0.38 },
      { field: "Inventors", left: "Inventor Two, Inventor Six", right: "Inventor Two, Inventor Five", similarity: 0.5 },
      { field: "Category", left: "Energy, Materials", right: "H01M (batteries)", similarity: 0.6 },
    ],
    judgeRationale:
      "Sample LLM-judge rationale: shared inventor and energy/materials domain, but the described inventions differ. Marked uncertain.",
  },
  {
    id: "match-3",
    technologyId: "tech-b",
    patentId: "US-0000008",
    method: "title_inventor",
    confidence: 0.41,
    comparisons: [
      { field: "Title", left: "Technology B (battery electrode coating)", right: "Patent 8 — lab result summarisation", similarity: 0.12 },
      { field: "Inventors", left: "Inventor Two, Inventor Five", right: "Inventor Six", similarity: 0 },
    ],
    judgeRationale: null,
  },
];
