declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, any> }
    ) => void;
  }
}

export function track(
  eventName: string,
  props?: Record<string, any>
) {
  try {
    window.plausible?.(
      eventName,
      props ? { props } : undefined
    );
  } catch {
    // analytics must never break the app
  }
}
