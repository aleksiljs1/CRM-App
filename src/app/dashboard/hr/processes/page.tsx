"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  FolderOpen,
  X,
  Trash2,
  Users,
  Building2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface RequiredDocument {
  id: string;
  processTypeId: string;
  documentName: string;
  description: string | null;
  isMandatory: boolean;
  source: string;
}

interface ProcessType {
  id: string;
  name: string;
  department: string;
  description: string | null;
  isActive: boolean;
  requiredDocuments: RequiredDocument[];
  _count: { requiredDocuments: number };
}

interface DocFormRow {
  name: string;
  description: string;
  isMandatory: boolean;
}

export default function LegalProcessesPage() {
  const { data: session } = useSession();
  const userDept = session?.user?.department;
  const userRole = session?.user?.role;

  const [processes, setProcesses] = useState<ProcessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);

  // Clients
  const [clients, setClients] = useState<any[]>([]);
  const [showRegisterClient, setShowRegisterClient] = useState(false);
  const [regName, setRegName] = useState("");
  const [regContact, setRegContact] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regIndustry, setRegIndustry] = useState("");
  const [registering, setRegistering] = useState(false);

  // New process modal
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formClientId, setFormClientId] = useState<string>("");
  const [clientDocs, setClientDocs] = useState<DocFormRow[]>([]);
  const [internalDocs, setInternalDocs] = useState<DocFormRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Restrict to LEGAL managers or ADMIN
  const isAllowed = userRole === "ADMIN" || (userRole === "MANAGER" && userDept === "LEGAL");

  useEffect(() => {
    if (isAllowed) {
      fetchProcesses();
      fetchTemplates();
      fetchClients();
    }
  }, [isAllowed]);

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients?all=true");
      if (!res.ok) return;
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      // silent
    }
  }

  async function handleRegisterClient() {
    if (!regName.trim() || !regContact.trim() || !regEmail.trim()) return;
    setRegistering(true);
    try {
      const res = await fetch("/api/clients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: regName,
          contactName: regContact,
          contactEmail: regEmail,
          phone: regPhone || null,
          industry: regIndustry || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to register client");
        return;
      }
      setRegName(""); setRegContact(""); setRegEmail(""); setRegPhone(""); setRegIndustry("");
      setShowRegisterClient(false);
      fetchClients();
    } catch {
      alert("Failed to register client");
    } finally {
      setRegistering(false);
    }
  }

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) return;
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      // silent
    }
  }

  async function fetchProcesses() {
    try {
      setLoading(true);
      const deptParam = userRole === "ADMIN" ? "" : "?department=LEGAL";
      const res = await fetch(`/api/processes${deptParam}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProcesses(data.processes || []);
    } catch {
      console.error("Failed to load processes");
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setFormName("");
    setFormDesc("");
    setFormClientId("");
    setClientDocs([]);
    setInternalDocs([]);
    setSelectedTemplateId("");
    setShowModal(true);
  }

  // Pre-built process templates with full document lists
  const processTemplates = [
    {
      id: "tpl-company-reg",
      name: "Company Registration (SHPK - Limited Liability)",
      description: "Registration of a new SHPK (Shoqëri me Përgjegjësi të Kufizuar) with the National Business Center (QKB) in Albania, including tax registration, beneficial ownership filing, and all statutory requirements.",
      clientDocs: [
        { name: "Founder Identity Documents", description: "Valid passport or Albanian ID card (Kartë Identiteti) for each founder/shareholder. Must be clear scans, not expired.", isMandatory: true },
        { name: "Proof of Address (Founders)", description: "Utility bill, bank statement, or residence certificate (Vërtetim Vendbanimi) for each founder. Not older than 3 months.", isMandatory: true },
        { name: "Initial Capital Deposit Certificate", description: "Bank statement or certificate proving the minimum capital deposit has been made (minimum 100 ALL for SHPK). Must show the deposit was made in the company's formation name.", isMandatory: true },
        { name: "Lease Agreement or Property Title", description: "Signed lease agreement (Kontratë Qiraje) or property ownership deed (Çertifikatë Pronësie) for the company's registered office address. Must be notarized if lease.", isMandatory: true },
        { name: "Power of Attorney (Prokurë e Posaçme)", description: "Notarized authorization for Kreston Albania to act on behalf of the founders at QKB. We will provide the template - founders sign at a notary.", isMandatory: true },
        { name: "Business Activity Description", description: "Written description of the planned business activities for NACE code selection. Include primary and secondary activities.", isMandatory: true },
      ],
      internalDocs: [
        { name: "Articles of Association (Statuti)", description: "Drafted company charter including share structure, management rules, decision-making procedures, profit distribution, and dissolution terms. Must comply with Albanian Commercial Law (Ligji Nr. 9901).", isMandatory: true },
        { name: "Founding Decision (Vendimi i Themelimit)", description: "Formal founding decision document signed by all shareholders. Includes company name, capital, share distribution, administrator appointment, and registered address.", isMandatory: true },
        { name: "QKB Application Form (Formulari i Regjistrimit)", description: "Completed National Business Center registration form with correct NACE codes, company details, and founder information. Filed electronically via QKB portal.", isMandatory: true },
        { name: "Administrator Appointment Declaration", description: "Formal declaration appointing the company administrator/director with their acceptance of the role. Includes ID details and signature.", isMandatory: true },
        { name: "Tax Registration Filing (NIPT Application)", description: "Application for Tax Identification Number (Numri i Identifikimit të Personit të Tatueshëm) filed simultaneously with QKB registration.", isMandatory: true },
        { name: "Beneficial Ownership Declaration", description: "Declaration of ultimate beneficial owners as required by Albanian Anti-Money Laundering Law (Ligji Nr. 9917). Must identify all individuals with >25% ownership or control.", isMandatory: true },
        { name: "Legal Opinion on Compliance", description: "Internal legal review memo confirming all filings meet Albanian Commercial Law requirements, AML obligations, and QKB formatting standards.", isMandatory: true },
      ],
    },
    {
      id: "tpl-contract-review",
      name: "Contract Review & Legal Due Diligence",
      description: "Comprehensive legal review of commercial contracts, supplier agreements, partnership deals, or M&A documentation. Includes risk assessment, compliance check, and amendment recommendations.",
      clientDocs: [
        { name: "Draft Contract / Agreement", description: "The contract document to be reviewed. Can be Word or PDF format. Include all annexes, schedules, and appendices.", isMandatory: true },
        { name: "Counterparty Information", description: "Basic information about the other party: company name, registration number (NIPT), registered address, and representative details.", isMandatory: true },
        { name: "Previous Agreements (if any)", description: "Any existing contracts or amendments with the same counterparty for context and consistency review.", isMandatory: false },
        { name: "Internal Approval / Board Decision", description: "Board resolution or management approval authorizing the company to enter into this agreement.", isMandatory: true },
        { name: "Financial Terms Summary", description: "Summary of key financial terms: payment amounts, schedules, penalties, guarantees, and any security interests.", isMandatory: true },
      ],
      internalDocs: [
        { name: "Legal Review Memo", description: "Detailed clause-by-clause analysis of the contract identifying risks, ambiguities, non-standard terms, and Albanian law compliance issues.", isMandatory: true },
        { name: "Risk Assessment Report", description: "Summary of legal, financial, and operational risks with severity ratings (High/Medium/Low) and mitigation recommendations.", isMandatory: true },
        { name: "Redlined Contract Version", description: "Marked-up version of the contract with proposed amendments, deletions, and additions in track-changes format.", isMandatory: true },
        { name: "Compliance Checklist", description: "Verification that the contract complies with Albanian Commercial Law, Competition Law, Data Protection (GDPR equivalent), and sector-specific regulations.", isMandatory: true },
        { name: "Executive Summary for Client", description: "One-page summary for the client's management team highlighting key findings, recommended changes, and go/no-go recommendation.", isMandatory: true },
      ],
    },
    {
      id: "tpl-license-permit",
      name: "Business License & Permit Application",
      description: "Application for business licenses, sector-specific permits, or regulatory approvals required for operating in Albania. Covers municipal permits, sector licenses, and environmental approvals.",
      clientDocs: [
        { name: "Company Registration Extract (QKB)", description: "Current extract from the National Business Center showing active registration status, NIPT, and authorized activities.", isMandatory: true },
        { name: "Facility Documentation", description: "Floor plans, lease agreement, or ownership deed for the business premises. May need to include fire safety certificate.", isMandatory: true },
        { name: "Professional Qualifications", description: "Diplomas, certifications, or professional licenses of key personnel as required by the specific sector regulation.", isMandatory: false },
        { name: "Tax Compliance Certificate", description: "Certificate from the Tax Administration (Drejtoria e Tatimeve) confirming no outstanding tax obligations. Not older than 30 days.", isMandatory: true },
        { name: "Insurance Certificates", description: "Professional liability insurance, general liability insurance, or sector-specific insurance policies as required.", isMandatory: false },
      ],
      internalDocs: [
        { name: "License Application Form", description: "Completed application form for the relevant licensing authority with all required fields and supporting schedules.", isMandatory: true },
        { name: "Regulatory Compliance Analysis", description: "Analysis of applicable regulations, required conditions, and client's current compliance status with gap identification.", isMandatory: true },
        { name: "Cover Letter to Authority", description: "Formal cover letter addressed to the licensing authority explaining the application, referencing enclosed documents, and requesting processing.", isMandatory: true },
        { name: "Follow-up Tracking Document", description: "Internal tracking document for monitoring application status, authority correspondence, and deadline management.", isMandatory: true },
      ],
    },
  ];

  function loadTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    // Check pre-built process templates first
    const processTemplate = processTemplates.find((t) => t.id === templateId);
    if (processTemplate) {
      setFormName(processTemplate.name);
      setFormDesc(processTemplate.description);
      setClientDocs(processTemplate.clientDocs.map((d) => ({ name: d.name, description: d.description, isMandatory: d.isMandatory })));
      setInternalDocs(processTemplate.internalDocs.map((d) => ({ name: d.name, description: d.description, isMandatory: d.isMandatory })));
      return;
    }

    // Check DB templates
    const tmpl = templates.find((t: any) => t.id === templateId);
    if (tmpl) {
      setFormName(tmpl.name);
      setFormDesc(tmpl.description || "");
    }
  }

  function addDocRow(source: "CLIENT" | "INTERNAL") {
    const row: DocFormRow = { name: "", description: "", isMandatory: true };
    if (source === "CLIENT") {
      setClientDocs((prev) => [...prev, row]);
    } else {
      setInternalDocs((prev) => [...prev, row]);
    }
  }

  function updateDocRow(
    source: "CLIENT" | "INTERNAL",
    index: number,
    field: keyof DocFormRow,
    value: string | boolean
  ) {
    const setter = source === "CLIENT" ? setClientDocs : setInternalDocs;
    setter((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function removeDocRow(source: "CLIENT" | "INTERNAL", index: number) {
    const setter = source === "CLIENT" ? setClientDocs : setInternalDocs;
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateProcess() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const documents = [
        ...clientDocs
          .filter((d) => d.name.trim())
          .map((d) => ({
            name: d.name,
            description: d.description || undefined,
            source: "CLIENT",
            isMandatory: d.isMandatory,
          })),
        ...internalDocs
          .filter((d) => d.name.trim())
          .map((d) => ({
            name: d.name,
            description: d.description || undefined,
            source: "INTERNAL",
            isMandatory: d.isMandatory,
          })),
      ];

      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          department: "LEGAL",
          description: formDesc || null,
          clientId: formClientId || null,
          documents,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowModal(false);
      await fetchProcesses();
    } catch {
      console.error("Create process failed");
    } finally {
      setSaving(false);
    }
  }

  if (!isAllowed) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Access restricted to Legal department managers and administrators.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
          <p className="text-sm text-muted-foreground">Loading legal processes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-300">
            Legal Processes
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Manage legal service processes and their required documents
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Process
        </button>
      </div>

      {/* Process list */}
      {processes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <FolderOpen className="size-6 text-muted-foreground" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">No legal processes yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click &quot;New Process&quot; to create your first legal process.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {processes.map((p) => {
            const clientCount = p.requiredDocuments.filter(
              (d) => d.source === "CLIENT"
            ).length;
            const internalCount = p.requiredDocuments.filter(
              (d) => d.source === "INTERNAL"
            ).length;

            return (
              <div
                key={p.id}
                className="rounded-xl border bg-card shadow-sm overflow-hidden"
              >
                {/* Process row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === p.id ? null : p.id)
                    }
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expandedId === p.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      <Users className="h-2.5 w-2.5" />
                      {clientCount} client
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      <Building2 className="h-2.5 w-2.5" />
                      {internalCount} internal
                    </span>
                  </div>
                </div>

                {/* Expanded: required documents grouped by source */}
                {expandedId === p.id && (
                  <div className="border-t bg-muted/30 px-5 py-4 space-y-4">
                    {/* Client documents */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Users className="size-3 text-blue-600" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300">
                          Client Documents
                        </span>
                      </div>
                      {p.requiredDocuments.filter((d) => d.source === "CLIENT")
                        .length === 0 ? (
                        <p className="text-xs text-muted-foreground py-1 pl-4">
                          No client documents defined.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {p.requiredDocuments
                            .filter((d) => d.source === "CLIENT")
                            .map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center gap-3 rounded-lg bg-card border px-4 py-2.5"
                              >
                                <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {doc.documentName}
                                  </p>
                                  {doc.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {doc.description}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    doc.isMandatory
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {doc.isMandatory ? "Mandatory" : "Optional"}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Internal documents */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Building2 className="size-3 text-violet-600" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700 dark:text-violet-300">
                          Internal Documents
                        </span>
                      </div>
                      {p.requiredDocuments.filter((d) => d.source === "INTERNAL")
                        .length === 0 ? (
                        <p className="text-xs text-muted-foreground py-1 pl-4">
                          No internal documents defined.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {p.requiredDocuments
                            .filter((d) => d.source === "INTERNAL")
                            .map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center gap-3 rounded-lg bg-card border px-4 py-2.5"
                              >
                                <FileText className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {doc.documentName}
                                  </p>
                                  {doc.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {doc.description}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    doc.isMandatory
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {doc.isMandatory ? "Mandatory" : "Optional"}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Process Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-xl border bg-card shadow-xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-lg font-semibold text-foreground">
                New Legal Process
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-5">
              {/* Load from Template */}
              <div className="rounded-lg border border-dashed border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/30 p-4">
                <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-2">
                  Start from a template (optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => loadTemplate(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">— Start from scratch —</option>
                  <optgroup label="Pre-built Process Templates">
                    {processTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                  {templates.length > 0 && (
                    <optgroup label="Saved Document Templates">
                      {templates.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {selectedTemplateId && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Template loaded with all documents. Edit anything below before creating.
                  </p>
                )}
              </div>

              {/* Attach to Client */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-foreground">
                    Attach to Client (optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegisterClient(!showRegisterClient)}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    {showRegisterClient ? "Cancel" : "+ Register New Client"}
                  </button>
                </div>
                {showRegisterClient ? (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <input
                      type="text" placeholder="Company name *" value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" placeholder="Contact full name *" value={regContact}
                        onChange={(e) => setRegContact(e.target.value)}
                        className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <input
                        type="email" placeholder="Contact email *" value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" placeholder="Phone" value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <input
                        type="text" placeholder="Industry" value={regIndustry}
                        onChange={(e) => setRegIndustry(e.target.value)}
                        className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <button
                      type="button" onClick={handleRegisterClient} disabled={registering}
                      className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {registering ? "Registering..." : "Register Client"}
                    </button>
                  </div>
                ) : (
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">— No client (internal process) —</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} — {c.contactName} ({c.contactEmail})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Basic info */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Process Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Company Registration"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Optional description of this process..."
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Client Documents Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-4 text-blue-600" />
                    <span className="text-sm font-semibold text-foreground">
                      Client Documents
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (docs the client must provide)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addDocRow("CLIENT")}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                {clientDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 pl-5">
                    No client documents added yet. Click &quot;Add&quot; above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {clientDocs.map((row, idx) => (
                      <DocRowForm
                        key={idx}
                        row={row}
                        onChange={(field, value) =>
                          updateDocRow("CLIENT", idx, field, value)
                        }
                        onRemove={() => removeDocRow("CLIENT", idx)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Internal Documents Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-4 text-violet-600" />
                    <span className="text-sm font-semibold text-foreground">
                      Internal Documents
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (docs the legal team must produce)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addDocRow("INTERNAL")}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                {internalDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 pl-5">
                    No internal documents added yet. Click &quot;Add&quot; above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {internalDocs.map((row, idx) => (
                      <DocRowForm
                        key={idx}
                        row={row}
                        onChange={(field, value) =>
                          updateDocRow("INTERNAL", idx, field, value)
                        }
                        onRemove={() => removeDocRow("INTERNAL", idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProcess}
                disabled={!formName.trim() || saving}
                className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Process
              </button>
              {selectedTemplateId && (() => {
                const tmpl = templates.find((t: any) => t.id === selectedTemplateId);
                if (!tmpl) return null;
                return (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Template &quot;{tmpl.name}&quot; will be linked to this process.
                    Fill it from Dept Settings → Templates.
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocRowForm({
  row,
  onChange,
  onRemove,
}: {
  row: DocFormRow;
  onChange: (field: keyof DocFormRow, value: string | boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex-1 space-y-2">
        <input
          type="text"
          placeholder="Document name"
          value={row.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={row.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <label className="flex items-center gap-2 text-xs text-foreground">
          <button
            type="button"
            onClick={() => onChange("isMandatory", !row.isMandatory)}
            className="text-muted-foreground hover:text-foreground"
          >
            {row.isMandatory ? (
              <ToggleRight className="h-5 w-5 text-brand-600" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
          {row.isMandatory ? "Mandatory" : "Optional"}
        </label>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-red-600 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
