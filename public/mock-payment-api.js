// Mock payment API for development
window.mockPaymentAPI = {
  createPayment: async (data) => {
    console.log('🎯 Mock Payment API called with:', data);
    
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate successful payment session creation
    return {
      url: 'https://checkout.stripe.com/pay/mock-session-id#fidkdWxOYHwnPyd1blppbHNgWjA0YjwxZVNSSWJTc2F0RUgzZGZUYm5ATVZ1N3ZGQnU3YGBoMSdLZG5LYGZNbWI2YHwiP2F1cGJhZicpJ3VpbGZnYCcqJydDYlEwZGJNY3RxSnM8aGphSDBBJyknYGZkamgnKSdgZWpgJyknZUFnamBgYCcqJ2N3amgrdHIwaXNdJykndmpwZGJqYCcqJ3ViYmZnYCcqJ3dgZmh2aCcpKT1WZHFFN3Y3M1BMMmNXYUdLclgzcGBWZWJHbVFyYGpTMGZYZFZIVT16ZWY6TloxPXQ2YXRcb2FWZl8kdGJfYHdKJyknaXFgJyknY0REZ0VuNmZPZG1mNUlGTzdyY1dSR0ZnYVNYZG00T3Y1WWlHN2dkYTI9TzJcYW5zZSJcaEdcYm5cJyknaGh2aScpKWZkTFFAQWFoJXghYnJhYWFgYCdkY1JrcTE2Z293TnM8MlIzTjE5UGJudlI2TzdQbGhzJlZ2dj0mTGhzJmdNTncjMEIzMSdgY2Jga0p4PUJuZGJhPW1hNlZva0d3ZVdDMjYzWHdSRlp6PW50Y1gwPW9yQlRQTDZoYWtoZm5mMDJkYGBqJnAzJl9hZyknZVJkY0dJYVZdJ2p2UTJxNTBaZl4mZHBnY1ZlY2BESSUmdkB2YXElZjJjMDFgJnUxNEhLNEhBLzdlYllyRFt2NF1xUGNcM1JnN01zYVppMGBmOWBJdmNhNGQmNnN0JGNodkNXMzdAYGomJzJ2Q2NfJyknIGxkaWZnaXJncmZnNWhyJmpoJ2IkfGZLPyonYGtkZmdqJjI8MjUmZ0t5JyN2ZGJvNWpnZFpOZlNmZEJhYC0nY2xhYWg8d2BmZSQzbGI/dGNrZzxhMSB4RTdkYjN1Y2BjOVonJyonJVBsYysnJGdoL2phKzUnaGxhYWg8d2BmZSQzJWJZPTNnJy0nUlokKSdqJGpmYGpmPT9gZWNzJ1wyZjY3aGNONFE1MTYpJ2lSZzcmJE9DYzZkNGJgMzFEYmhnNn0zKzIzbSJtYTMzZ1AxM1Zla2hoX29hYVhncm04Y1Q1YmhOZ2BFUm9nYSZkTU9bMFhha2ZdPzlhZ01hPXwyfX19NWQnJT5xJ3wlanM3YltETGRlZGdyMSZhZU1qZyonMSZJNk8xNykk',
      sessionId: 'mock-session-' + Date.now()
    };
  }
};

console.log('🚀 Mock Payment API loaded for development');
