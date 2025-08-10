export function AuthFooter() {
  return (
    <div className="text-muted-foreground hover:[a]:*:text-primary text-center text-xs text-balance [a]:*:underline [a]:*:underline-offset-4">
      By clicking continue, you agree to our{' '}
      <a href="/terms">Terms of Service</a> and{' '}
      <a href="/privacy">Privacy Policy</a>.
    </div>
  );
}