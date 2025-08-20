// Placeholder automation debugger - automation features removed
export interface AutomationDebugResult {
  success: boolean;
  message: string;
  details?: any;
}

export class AutomationDebugger {
  async runDiagnostics(): Promise<AutomationDebugResult> {
    return { success: false, message: 'Automation features have been removed' };
  }
}

export function getAutomationDebugger(): AutomationDebugger {
  return new AutomationDebugger();
}
