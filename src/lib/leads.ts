const KEY = "sherwood-leads";

export type Lead = {
  name: string;
  phone: string;
  service: string;
  createdAt: string;
};

export function saveLead(lead: Omit<Lead, "createdAt">): Lead {
  const next: Lead = { ...lead, createdAt: new Date().toISOString() };
  const prev = readLeads();
  const all = [next, ...prev].slice(0, 40);
  localStorage.setItem(KEY, JSON.stringify(all));
  return next;
}

export function readLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Lead[]) : [];
  } catch {
    return [];
  }
}
