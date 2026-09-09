// src/engine/exemplarStore.ts
// Phase 0.5: Few-Shot Exemplar Store with Cross-Device Reuse (§6.2, Test 2)
// Manages exemplars, appendable baseline fields, and training queue with rejection retention

import {
  BaselineFieldDefinition,
  FewShotExemplar,
  INITIAL_BASELINE_FIELDS,
  SupportedVendor,
  TrainingQueueItem,
} from "../types/canonical";

const LOCAL_STORAGE_KEY_EXEMPLARS = "apexnet_exemplars_v1";
const LOCAL_STORAGE_KEY_FIELDS = "apexnet_baseline_fields_v1";
const LOCAL_STORAGE_KEY_QUEUE = "apexnet_training_queue_v1";

export const INITIAL_EXEMPLARS: FewShotExemplar[] = [
  {
    id: "fse-sonic-01",
    vendor: "sonic",
    rawLinePattern: "idle_timeout",
    mappedFieldKey: "sessionIdleTimeoutMinutes",
    mappedValue: 10,
    approvedBy: "SecOps Admin (NTRO)",
    approvedAt: "2026-08-28 10:14:22",
    timesReused: 3,
  },
  {
    id: "fse-forti-02",
    vendor: "fortinet_fortios",
    rawLinePattern: "set admin-telnet-service disable",
    mappedFieldKey: "telnetEnabled",
    mappedValue: false,
    approvedBy: "Lead Network Engineer",
    approvedAt: "2026-08-29 16:30:11",
    timesReused: 2,
  },
  {
    id: "fse-junos-03",
    vendor: "juniper_junos",
    rawLinePattern: "protocol-version v2",
    mappedFieldKey: "sshVersion",
    mappedValue: 2,
    approvedBy: "Compliance Auditor",
    approvedAt: "2026-09-01 09:05:44",
    timesReused: 4,
  },
];

export const INITIAL_QUEUE_ITEMS: TrainingQueueItem[] = [
  {
    id: "tq-sonic-01",
    deviceId: "sonic-leaf-01",
    vendor: "sonic",
    rawCommandBlock: '"fast_reboot_watchdog": "enabled"',
    lineNumbers: "Line 41",
    suggestedField: "httpServerEnabled",
    suggestedValue: false,
    confidence: 0.48,
    status: "pending",
    timestamp: "2026-09-07T08:15:00Z",
  },
  {
    id: "tq-arista-02",
    deviceId: "arista-leaf-02",
    vendor: "arista_eos",
    rawCommandBlock: "transceiver qsfp default-mode 4x10G",
    lineNumbers: "Line 4",
    suggestedField: "loginBannerConfigured",
    suggestedValue: true,
    confidence: 0.52,
    status: "pending",
    timestamp: "2026-09-07T08:22:00Z",
  },
  {
    id: "tq-junos-03",
    deviceId: "juniper-srx345-gateway",
    vendor: "juniper_junos",
    rawCommandBlock: "telnet {\n    /* legacy maintenance port */\n}",
    lineNumbers: "Lines 33-35",
    suggestedField: "telnetEnabled",
    suggestedValue: true,
    confidence: 0.61,
    status: "pending",
    timestamp: "2026-09-07T09:00:00Z",
  },
];

class ExemplarStoreManager {
  private exemplars: FewShotExemplar[] = [];
  private fields: BaselineFieldDefinition[] = [];
  private queue: TrainingQueueItem[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const storedEx = localStorage.getItem(LOCAL_STORAGE_KEY_EXEMPLARS);
        this.exemplars = storedEx ? JSON.parse(storedEx) : [...INITIAL_EXEMPLARS];

        const storedFields = localStorage.getItem(LOCAL_STORAGE_KEY_FIELDS);
        this.fields = storedFields ? JSON.parse(storedFields) : [...INITIAL_BASELINE_FIELDS];

        const storedQueue = localStorage.getItem(LOCAL_STORAGE_KEY_QUEUE);
        this.queue = storedQueue ? JSON.parse(storedQueue) : [...INITIAL_QUEUE_ITEMS];
        return;
      }
    } catch {
      // Ignore fallback
    }
    this.exemplars = [...INITIAL_EXEMPLARS];
    this.fields = [...INITIAL_BASELINE_FIELDS];
    this.queue = [...INITIAL_QUEUE_ITEMS];
  }

  private persist() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(LOCAL_STORAGE_KEY_EXEMPLARS, JSON.stringify(this.exemplars));
        localStorage.setItem(LOCAL_STORAGE_KEY_FIELDS, JSON.stringify(this.fields));
        localStorage.setItem(LOCAL_STORAGE_KEY_QUEUE, JSON.stringify(this.queue));
      }
    } catch {
      // Fallback
    }
  }

  public getExemplars(vendor?: SupportedVendor): FewShotExemplar[] {
    if (vendor) {
      return this.exemplars.filter((e) => e.vendor === vendor);
    }
    return [...this.exemplars];
  }

  public getBaselineFields(): BaselineFieldDefinition[] {
    return [...this.fields];
  }

  // §6.1 Extensible baseline field creation on the fly
  public registerBaselineField(field: Omit<BaselineFieldDefinition, "createdBy" | "createdAt">): BaselineFieldDefinition {
    const existing = this.fields.find((f) => f.key === field.key);
    if (existing) return existing;

    const newField: BaselineFieldDefinition = {
      ...field,
      createdBy: "admin",
      createdAt: new Date().toISOString(),
    };
    this.fields.push(newField);
    this.persist();
    return newField;
  }

  // §6.2 Store approved exemplar + update training queue
  public approveAndSaveExemplar(
    queueItemId: string,
    mappedFieldKey: string,
    mappedValue: boolean | number | string,
    author: string = "SecOps Admin (NTRO Active Learning)"
  ): FewShotExemplar | null {
    const item = this.queue.find((q) => q.id === queueItemId);
    if (!item) return null;

    const exemplarId = `fse-${item.vendor}-${Date.now()}`;
    const newExemplar: FewShotExemplar = {
      id: exemplarId,
      vendor: item.vendor,
      rawLinePattern: item.rawCommandBlock.trim(),
      mappedFieldKey,
      mappedValue,
      approvedBy: author,
      approvedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      timesReused: 0,
    };

    this.exemplars.unshift(newExemplar);
    item.status = "mapped";
    this.persist();
    return newExemplar;
  }

  // Direct exemplar creation (e.g. for testing or direct mapping)
  public addExemplar(exemplar: FewShotExemplar) {
    this.exemplars.unshift(exemplar);
    this.persist();
  }

  // §6.8 Rejected training items audit retention
  public rejectQueueItem(id: string, reason: string = "Not compliance relevant"): boolean {
    const item = this.queue.find((q) => q.id === id);
    if (!item) return false;

    item.status = "rejected";
    item.rejectionReason = reason;
    this.persist();
    return true;
  }

  public recordReuse(exemplarId: string) {
    const ex = this.exemplars.find((e) => e.id === exemplarId);
    if (ex) {
      ex.timesReused += 1;
      this.persist();
    }
  }

  public getQueue(confidenceThreshold: number = 0.80): TrainingQueueItem[] {
    // Only return pending items whose confidence is strictly lower than confidence threshold
    return this.queue.filter((q) => q.status === "pending" && q.confidence < confidenceThreshold);
  }

  public getAllQueueItems(): TrainingQueueItem[] {
    return [...this.queue];
  }

  public getRejectedAuditLog(): TrainingQueueItem[] {
    return this.queue.filter((q) => q.status === "rejected");
  }

  public enqueueItem(item: Omit<TrainingQueueItem, "id" | "status" | "timestamp">): TrainingQueueItem {
    const newItem: TrainingQueueItem = {
      ...item,
      id: `tq-${item.vendor}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: "pending",
      timestamp: new Date().toISOString(),
    };
    this.queue.push(newItem);
    this.persist();
    return newItem;
  }

  public resetToDefaults() {
    this.exemplars = [...INITIAL_EXEMPLARS];
    this.fields = [...INITIAL_BASELINE_FIELDS];
    this.queue = [...INITIAL_QUEUE_ITEMS];
    this.persist();
  }
}

export const exemplarStore = new ExemplarStoreManager();
