export const PORTRAIT_RELATION_NAMES = ["portraitImage", "coverImage", "portrait", "heroImage"] as const;

export function isPortraitRelationName(name: string): boolean {
  return PORTRAIT_RELATION_NAMES.includes(name as (typeof PORTRAIT_RELATION_NAMES)[number]);
}
