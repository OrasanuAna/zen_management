/** Mesaje în română pentru coduri Firebase Auth uzuale. */
export function mapFirebaseAuthError(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Adresa de e-mail nu este validă.'
    case 'auth/user-disabled':
      return 'Acest cont a fost dezactivat.'
    case 'auth/user-not-found':
      return 'Nu există un cont cu această adresă de e-mail.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail sau parolă incorectă.'
    case 'auth/email-already-in-use':
      return 'Adresa de e-mail este deja folosită.'
    case 'auth/weak-password':
      return 'Parola este prea slabă. Folosește cel puțin 6 caractere.'
    case 'auth/network-request-failed':
      return 'Eroare de rețea. Verifică conexiunea la internet.'
    case 'auth/too-many-requests':
      return 'Prea multe încercări. Încearcă din nou mai târziu.'
    case 'auth/operation-not-allowed':
      return 'Această metodă de autentificare nu este activată în Firebase.'
    case 'auth/requires-recent-login':
      return 'Pentru această acțiune trebuie să te autentifici din nou. Deconectează-te și intră din nou în cont.'
    default:
      return 'A apărut o eroare la autentificare. Încearcă din nou.'
  }
}
