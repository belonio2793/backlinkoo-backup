/**
 * Force proper text spacing using non-breaking spaces and other techniques
 */

export function forceTextSpacing(text: string): string {
  if (!text) return text;
  
  let spacedText = text;
  
  // Force spaces around quotes with non-breaking spaces
  spacedText = spacedText.replace(/("[\w\s]+")([a-z])/gi, '$1\u00A0$2');
  
  // Force spaces around "in" before time
  spacedText = spacedText.replace(/([a-z])(in\s*\d+[hm])/gi, '$1\u00A0$2');
  
  // Force spaces in time patterns
  spacedText = spacedText.replace(/(\d+h)(\d+m)/gi, '$1\u00A0$2');
  spacedText = spacedText.replace(/(\d+[hm])(remaining)/gi, '$1\u00A0$2');
  spacedText = spacedText.replace(/(remaining)([a-z])/gi, '$1\u00A0$2');
  
  // Force spaces around "automatically deleted"
  spacedText = spacedText.replace(/(automatically)(deleted?)/gi, '$1\u00A0$2');
  spacedText = spacedText.replace(/(deleted?)(in)/gi, '$1\u00A0$2');
  
  // Force space after quote and before "will"
  spacedText = spacedText.replace(/"([^"]+)"will/gi, '"$1"\u00A0will');
  
  // Force space before time values
  spacedText = spacedText.replace(/in(\d+h)/gi, 'in\u00A0$1');
  
  return spacedText;
}

export function createSpacedElements(text: string): React.ReactNode[] {
  const parts = text.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.match(/^\s+$/)) {
      return <span key={index} style={{ marginRight: '0.25em' }}></span>;
    }
    return <span key={index} style={{ marginRight: '0.25em' }}>{part}</span>;
  });
}