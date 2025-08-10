const testError = { code: '42P01', message: 'relation does not exist' };
console.log('Test 1 - Direct:', testError);
console.log('Test 2 - String concat:', 'Failed to fetch campaign metrics: ' + testError);
console.log('Test 3 - Template literal: Failed to fetch campaign metrics:', testError);
