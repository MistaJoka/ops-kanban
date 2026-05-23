export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function isShortcutModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}

export function matchShortcut(
  event: KeyboardEvent,
  key: string,
  opts?: { meta?: boolean; ctrl?: boolean; shift?: boolean },
): boolean {
  if (event.key.toLowerCase() !== key.toLowerCase()) {
    return false;
  }

  if (opts?.meta && !event.metaKey) return false;
  if (opts?.ctrl && !event.ctrlKey) return false;
  if (opts?.shift && !event.shiftKey) return false;

  if (opts?.meta || opts?.ctrl) {
    return true;
  }

  return !isShortcutModifier(event);
}
