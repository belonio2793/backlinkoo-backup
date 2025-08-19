export interface BlogPost {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  publishDate?: string;
  readingTime?: string;
  tags?: string[];
  category?: string;
}

export interface ThemeStyles {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  accentColor: string;
}

export interface ThemeLayout {
  headerStyle: 'minimal' | 'bold' | 'centered' | 'sidebar';
  contentWidth: 'narrow' | 'medium' | 'wide';
  spacing: 'compact' | 'normal' | 'relaxed';
}

export interface BlogTemplateProps {
  post: BlogPost;
  styles: ThemeStyles;
  layout: ThemeLayout;
  customStyles?: Partial<ThemeStyles>;
  className?: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  styles: ThemeStyles;
  layout: ThemeLayout;
  features: string[];
  component: React.ComponentType<BlogTemplateProps>;
}
