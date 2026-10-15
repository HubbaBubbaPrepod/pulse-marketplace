import { Developers } from '../../../components/developers';
import { copy } from '../../../lib/copy.mjs';
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: copy[lang]?.developers };
}
export default async function Page({ params }) {
  const { lang } = await params;
  return (
    <div className="page-container">
      <Developers lang={lang} />
    </div>
  );
}
