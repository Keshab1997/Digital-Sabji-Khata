document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    alert('Login failed: ' + error.message);
  } else {
    window.location.href = '/';
  }
});
