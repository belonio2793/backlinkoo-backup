/**
 * AI Content Test Page
 * Minimal buffer testing interface
 */

import { MinimalAITest } from '@/components/MinimalAITest';
import { OpenAITestComponent } from '@/components/OpenAITestComponent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AIContentTest() {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="internal-test" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="internal-test">Internal Test</TabsTrigger>
          <TabsTrigger value="openai">OpenAI Only Generator</TabsTrigger>
          <TabsTrigger value="minimal">Minimal AI Test</TabsTrigger>
        </TabsList>
        <TabsContent value="internal-test">
          <OpenAITestRunner />
        </TabsContent>
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
