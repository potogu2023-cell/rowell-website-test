export interface InquiryListItem {
  productId: string;
  productName: string;
  productPartNumber?: string;
  specification?: string;
}

const STORAGE_KEY = "rowell.inquiry-list.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readInquiryList(): InquiryListItem[] {
  if (!canUseStorage()) return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is InquiryListItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<InquiryListItem>;
      return typeof candidate.productId === "string" && typeof candidate.productName === "string";
    });
  } catch {
    return [];
  }
}

export function writeInquiryList(items: InquiryListItem[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
    window.dispatchEvent(new CustomEvent("rowell:inquiry-list-updated"));
  } catch {
    // A blocked or full browser store must never interrupt product browsing.
  }
}

export function addToInquiryList(item: InquiryListItem): InquiryListItem[] {
  const current = readInquiryList();
  const existing = current.find((candidate) => candidate.productId === item.productId);
  if (existing) return current;
  const next = [...current, item];
  writeInquiryList(next);
  return next;
}

export function removeFromInquiryList(productId: string): InquiryListItem[] {
  const next = readInquiryList().filter((item) => item.productId !== productId);
  writeInquiryList(next);
  return next;
}

export function clearInquiryList(): void {
  writeInquiryList([]);
}
