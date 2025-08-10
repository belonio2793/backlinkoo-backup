import React from 'react';
import { useFormattedText } from '@/hooks/useTextFormatter';
import { cn } from '@/lib/utils';

interface FormattedTextProps {
  children: string;
  type?: 'title' | 'description' | 'label' | 'button' | 'link';
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  [key: string]: any;
}

/**
 * Component that automatically formats text content
 */
export function FormattedText({
  children,
  type = 'description',
  as: Component = 'span',
  className,
  ...props
}: FormattedTextProps) {
  // Validate children prop
  if (!children || typeof children !== 'string') {
    return <Component className={className} {...props}>{children || ''}</Component>;
  }

  const formattedText = useFormattedText(children, type);

  return (
    <Component className={className} {...props}>
      {formattedText}
    </Component>
  );
}

/**
 * Specialized components for different text types
 */
export function FormattedTitle({ children, className, ...props }: Omit<FormattedTextProps, 'type' | 'as'>) {
  const formattedText = useFormattedText(children, 'title');
  
  return (
    <h2 className={cn("text-xl font-semibold", className)} {...props}>
      {formattedText}
    </h2>
  );
}

export function FormattedDescription({ children, className, ...props }: Omit<FormattedTextProps, 'type' | 'as'>) {
  const formattedText = useFormattedText(children, 'description');

  return (
    <span className={cn("text-gray-600", className)} {...props}>
      {formattedText}
    </span>
  );
}

export function FormattedLabel({ children, className, ...props }: Omit<FormattedTextProps, 'type' | 'as'>) {
  const formattedText = useFormattedText(children, 'label');
  
  return (
    <label className={cn("text-sm font-medium", className)} {...props}>
      {formattedText}
    </label>
  );
}

export function FormattedButton({ children, className, ...props }: Omit<FormattedTextProps, 'type' | 'as'>) {
  const formattedText = useFormattedText(children, 'button');
  
  return (
    <span className={className} {...props}>
      {formattedText}
    </span>
  );
}

export function FormattedLink({ children, className, ...props }: Omit<FormattedTextProps, 'type' | 'as'>) {
  const formattedText = useFormattedText(children, 'link');
  
  return (
    <span className={cn("text-blue-600 hover:text-blue-800", className)} {...props}>
      {formattedText}
    </span>
  );
}

export default FormattedText;
