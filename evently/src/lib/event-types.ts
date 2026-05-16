export const EVENT_TYPES = [
  "wedding",
  "xv",
  "birthday",
  "baptism",
  "corporate",
  "sports",
  "meeting",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value);
}
