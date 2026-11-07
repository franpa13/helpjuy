import { Landing } from '@/features/landing/components/Landing';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const { cuenta } = await searchParams;
  return <Landing accountDeleted={cuenta === 'borrada'} />;
}
