/**
 * AI Content Test Page
 * Minimal buffer testing interface
 */

import { MinimalAITest } from '@/components/MinimalAITest';
import { OpenAITestComponent } from '@/components/OpenAITestComponent';
import { OpenAITestRunner } from '@/components/OpenAITestRunner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AIContentTest() {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="openai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="openai">OpenAI Only Generator</TabsTrigger>
          <TabsTrigger value="minimal">Minimal AI Test</TabsTrigger>
        </TabsList>
        <TabsContent value="openai">
          <OpenAITestComponent />
        </TabsContent>
        <TabsContent value="minimal">
          <MinimalAITest />
        </TabsContent>
      </Tabs>
    </div>
  );
}
