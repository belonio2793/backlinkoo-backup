/**
 * Quick Function Check Utility
 * 
 * Provides a fast way to check if Netlify functions are deployed
 * without running full diagnostics
 */

export interface QuickCheckResult {
  anyFunctionsAvailable: boolean;
  availableFunctions: string[];
  missingFunctions: string[];
  recommendedAction: 'use_functions' | 'use_manual' | 'deploy_functions';
  statusMessage: string;
}

export class QuickFunctionCheck {
  
  /**
   * Check if key domain management functions are available
   */
  static async checkDomainFunctions(): Promise<QuickCheckResult> {
    const functionsToCheck = [
      'netlify-domain-validation',
      'add-domain-to-netlify',
      'validate-domain'
    ];

    const results = await Promise.allSettled(
      functionsToCheck.map(async (funcName) => {
        try {
          const response = await fetch(`/.netlify/functions/${funcName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
          });
          
          return { name: funcName, available: response.status !== 404 };
        } catch (error) {
          return { name: funcName, available: false };
        }
      })
    );

    const functionStatus = results.map(result => 
      result.status === 'fulfilled' ? result.value : { name: 'unknown', available: false }
    );

    const availableFunctions = functionStatus
      .filter(f => f.available)
      .map(f => f.name);
      
    const missingFunctions = functionStatus
      .filter(f => !f.available)
      .map(f => f.name);

    const anyFunctionsAvailable = availableFunctions.length > 0;

    let recommendedAction: 'use_functions' | 'use_manual' | 'deploy_functions';
    let statusMessage: string;

    if (anyFunctionsAvailable) {
      if (availableFunctions.length === functionsToCheck.length) {
        recommendedAction = 'use_functions';
        statusMessage = 'All domain management functions are deployed and working.';
      } else {
        recommendedAction = 'use_functions';
        statusMessage = `${availableFunctions.length} of ${functionsToCheck.length} functions available. Using fallbacks as needed.`;
      }
    } else {
      recommendedAction = 'deploy_functions';
      statusMessage = 'No domain management functions are deployed. Manual addition or function deployment required.';
    }

    return {
      anyFunctionsAvailable,
      availableFunctions,
      missingFunctions,
      recommendedAction,
      statusMessage
    };
  }

  /**
   * Get a simple boolean for whether domain management should work
   */
  static async isDomainManagementAvailable(): Promise<boolean> {
    try {
      const check = await this.checkDomainFunctions();
      return check.anyFunctionsAvailable;
    } catch (error) {
      console.warn('Function availability check failed:', error);
      return false;
    }
  }

  /**
   * Get status message for UI display
   */
  static async getStatusForUI(): Promise<{
    status: 'working' | 'limited' | 'manual';
    message: string;
    color: 'green' | 'yellow' | 'red';
  }> {
    try {
      const check = await this.checkDomainFunctions();
      
      if (check.recommendedAction === 'use_functions' && check.availableFunctions.length >= 2) {
        return {
          status: 'working',
          message: 'Domain management is fully functional',
          color: 'green'
        };
      } else if (check.anyFunctionsAvailable) {
        return {
          status: 'limited', 
          message: 'Some functions available, using fallbacks',
          color: 'yellow'
        };
      } else {
        return {
          status: 'manual',
          message: 'Manual domain addition required',
          color: 'red'
        };
      }
    } catch (error) {
      return {
        status: 'manual',
        message: 'Function check failed, manual addition recommended',
        color: 'red'
      };
    }
  }
}

export default QuickFunctionCheck;
