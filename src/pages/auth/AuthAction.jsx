import { useSearchParams, Navigate } from 'react-router-dom';

/**
 * Firebase Auth action handler.
 * Firebase sends users here for password reset, email verification, etc.
 * We intercept and route to our custom branded pages.
 */
export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  switch (mode) {
    case 'resetPassword':
      return <Navigate to={`/auth/reset-password?oobCode=${oobCode}`} replace />;
    case 'verifyEmail':
      // Future: custom email verification page
      return <Navigate to="/auth/sign-in" replace />;
    default:
      return <Navigate to="/auth/sign-in" replace />;
  }
}
