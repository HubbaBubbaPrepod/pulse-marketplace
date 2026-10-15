import { Login } from '../../../components/login';
import { api } from '../../../lib/server-api';

export const metadata = { robots: { index: false, follow: false } };
export default async function Page({ params }) {
  const { lang } = await params;
  return (
    <div className="page-container">
      <Login
        lang={lang}
        mode="verify-email"
        capabilities={await api('/auth/capabilities').catch(() => ({}))}
      />
    </div>
  );
}
