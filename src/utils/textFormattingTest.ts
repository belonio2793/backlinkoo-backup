/**
 * Test utility to demonstrate enhanced text formatting
 * This is for development testing only
 */

import { formatBlogContent, capitalizeSentences } from './textFormatting';

export function testFormattingDemo() {
  // Sample problematic content like what was shown in the DOM
  const problematicContent = `
<h1>what is sushi?</h1>

<p>sushi is a beloved culinary delight that has captured the hearts and taste buds. understanding its origins helps us appreciate the craftsmanship.</p>

<h2>types and varieties</h2>
<p>There are numerous varieties of sushi, each with unique characteristics: - Traditional varieties: Classic preparations that honor original recipes - Modern interpretations: Contemporary twists on traditional favorites - Regional specialties: Unique local variations worth exploring - Fusion styles: Creative combinations with other culinary traditions</p>

<h2>how to enjoy sushi</h2>
<p>getting the most out of your sushi experience involves understanding proper etiquette. whether dining out or preparing at home, these tips will enhance your enjoyment.</p>
  `;

  console.log('=== BEFORE FORMATTING ===');
  console.log(problematicContent);
  
  const formatted = formatBlogContent(problematicContent);
  
  console.log('\n=== AFTER FORMATTING ===');
  console.log(formatted);
  
  return formatted;
}

// Test specific bullet point formatting
export function testBulletPointFormatting() {
  const testContent = `
<p>Here are the key benefits: - improved performance - better results - cost savings - long term growth</p>

<ul>
<li>traditional methods: old school approaches</li>
<li>modern techniques: new innovative solutions</li>
</ul>

<p>additional points: - first point - second point - third point that continues the list</p>
  `;

  console.log('=== BULLET POINT TEST BEFORE ===');
  console.log(testContent);
  
  const formatted = formatBlogContent(testContent);
  
  console.log('\n=== BULLET POINT TEST AFTER ===');
  console.log(formatted);
  
  return formatted;
}
