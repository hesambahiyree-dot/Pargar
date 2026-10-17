export type Layer = { id: number; close: () => void };

export class BackStack {
  entries: Layer[] = [];
  skip = 0;
  seq = 1;

  push(close: () => void): number {
    const id = this.seq++;
    this.entries.push({ id, close });
    return id;
  }

  /** مرورگر یک پله به عقب رفته است. */
  popEvent(): void {
    if (this.skip > 0) {
      this.skip -= 1;
      return;
    }
    this.entries.pop()?.close();
  }

  drop(id: number, revert: boolean, goBack: () => void): void {
    const index = this.entries.findIndex((e) => e.id === id);
    if (index < 0) return;
    const wasTop = index === this.entries.length - 1;
    this.entries.splice(index, 1);
    if (wasTop && revert) {
      this.skip += 1;
      goBack();
    }
  }
}

export const backStack = new BackStack();

let wired = false;

export function initBackStack(): void {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("popstate", () => backStack.popEvent());
}

export function pushLayer(close: () => void): number {
  initBackStack();
  const id = backStack.push(close);
  window.history.pushState({ pargarLayer: id }, "");
  return id;
}

export function dropLayer(id: number, revert: boolean): void {
  backStack.drop(id, revert, () => window.history.back());
}
