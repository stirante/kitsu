const errors = {
  backToLogin() {
    if (!['/login', '/login/2fa'].includes(window.location.pathname)) {
      window.location.replace('/login')
    }
  }
}
export default errors
