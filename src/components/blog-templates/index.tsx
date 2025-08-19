export { default as MinimalCleanTemplate } from './MinimalCleanTemplate';
export { default as ModernBusinessTemplate } from './ModernBusinessTemplate';
export { default as ElegantEditorialTemplate } from './ElegantEditorialTemplate';
export { default as TechFocusTemplate } from './TechFocusTemplate';

// Template registry for easy access
import MinimalCleanTemplate from './MinimalCleanTemplate';
import ModernBusinessTemplate from './ModernBusinessTemplate';
import ElegantEditorialTemplate from './ElegantEditorialTemplate';
import TechFocusTemplate from './TechFocusTemplate';

export const TEMPLATE_REGISTRY = {
  minimal: MinimalCleanTemplate,
  modern: ModernBusinessTemplate,
  elegant: ElegantEditorialTemplate,
  tech: TechFocusTemplate,
} as const;

export type TemplateId = keyof typeof TEMPLATE_REGISTRY;
