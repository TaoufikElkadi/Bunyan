import { redirect } from 'next/navigation'

export default async function DonorDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/leden/${id}`)
}
