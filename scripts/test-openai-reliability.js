#!/usr/bin/env node

/**
 * OpenAI Reliability Test Script
 * Run this to test the enhanced OpenAI integration
 */

import { openAIReliabilityTester } from '../src/utils/openaiReliabilityTest.js';

async function main() {
  console.log('🚀 OpenAI Reliability Test');
  console.log('==========================');
  
  try {
    // Run comprehensive test
    const results = await openAIReliabilityTester.runCompleteTest();
    
    console.log('\n📋 Full Test Results:');
    console.log(JSON.stringify(results, null, 2));
    
    if (results.overallSuccess) {
      console.log('\n🎉 SUCCESS: OpenAI integration is 100% reliable!');
      process.exit(0);
    } else {
      console.log('\n⚠️ WARNING: Some reliability issues detected.');
      console.log('Check the test results above for details.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to run reliability test:');
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
