const handleLogin = async (e) => {
  e.preventDefault();

  if (isLoading) {
    console.log('Login already in progress, ignoring submit');
    return;
  }

  if (!loginEmail || !loginPassword) {
    toast({
      title: "Missing credentials",
      description: "Please enter both email and password.",
      variant: "destructive",
    });
    return;
  }

  setIsLoading(true);

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      console.error('❌ Login error:', error.message);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log('✅ Login successful');
      toast({
        title: "Welcome back!",
        description: "You’ve successfully logged in.",
      });
      // navigate or reload as needed
    }
  } catch (err) {
    console.error('❌ Unexpected login error:', err);
    toast({
      title: "Unexpected error",
      description: "Please try again later.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};