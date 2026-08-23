import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { verifyCertificate } from "../../actions"
import { CertificateView } from "@/components/certificate-view"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const cert = await verifyCertificate(id)

  if (!cert) {
    return { title: "Certificate Not Found — TypeMaster" }
  }

  return {
    title: `${cert.name} — ${cert.tier.charAt(0).toUpperCase()}${cert.tier.slice(1)} Certificate | TypeMaster`,
    description: `TypeMaster ${cert.tier} certificate for ${cert.name}: ${cert.wpm} WPM at ${cert.accuracy}% accuracy.`,
    openGraph: {
      title: `${cert.name}'s TypeMaster Certificate`,
      description: `${cert.tier} tier · ${cert.wpm} WPM · ${cert.accuracy}% accuracy`,
    },
  }
}

export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params
  const cert = await verifyCertificate(id)

  if (!cert) {
    notFound()
  }

  return <CertificateView cert={cert} />
}
