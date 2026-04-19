'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/otjm/SiteHeader'
import { SiteFooter } from '@/components/otjm/SiteFooter'

const SECTIONS = [
  {
    id: 'responsable',
    title: '1. Responsable du traitement',
    content: (
      <>
        <p>
          L&apos;Organisation Tunisienne des Jeunes Médecins (OTJM), association à but non lucratif dont le
          siège est situé Rue 9 avril, Bab Saadoun, Tunis 1002, est responsable du traitement des données
          personnelles collectées via le site <strong>otjm.shop</strong>.
        </p>
        <p className="mt-3">
          Contact : <a href="mailto:otjm.national@gmail.com" className="underline underline-offset-2 hover:text-[var(--otjm-red)] transition-colors">otjm.national@gmail.com</a>
        </p>
      </>
    ),
  },
  {
    id: 'donnees',
    title: '2. Données collectées',
    content: (
      <>
        <p className="font-medium mb-2">Newsletter</p>
        <p>
          Lors de l&apos;inscription à la newsletter, nous collectons uniquement votre adresse email, ainsi que
          la date et l&apos;heure de votre consentement. Aucune autre donnée n&apos;est conservée dans notre système.
        </p>

        <p className="font-medium mt-5 mb-2">Adhésion</p>
        <p>
          Le formulaire d&apos;adhésion est hébergé sur Google Forms (service tiers — voir section 7). Les données
          collectées à cette occasion incluent : nom complet, adresse email, numéro de CIN, date de naissance,
          numéro de téléphone, faculté d&apos;appartenance et statut professionnel (externe, interne, résident).
          Ces données sont nécessaires à l&apos;établissement de votre carte membre officielle.
        </p>

        <p className="font-medium mt-5 mb-2">Formulaire de contact</p>
        <p>
          Lorsque vous utilisez le formulaire de contact, nous collectons : nom, adresse email, sujet et
          message. Ces données sont conservées afin de traiter votre demande.
        </p>
      </>
    ),
  },
  {
    id: 'finalite',
    title: '3. Finalité et base légale',
    content: (
      <table className="w-full text-sm border-collapse mt-1">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--otjm-text-muted)', opacity: 0.4 }}>
            <th className="ltr:text-left rtl:text-right py-2 pr-4 font-semibold" style={{ color: 'var(--otjm-text)' }}>Traitement</th>
            <th className="ltr:text-left rtl:text-right py-2 pr-4 font-semibold" style={{ color: 'var(--otjm-text)' }}>Finalité</th>
            <th className="ltr:text-left rtl:text-right py-2 font-semibold" style={{ color: 'var(--otjm-text)' }}>Base légale</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: 'rgba(var(--otjm-text-muted-rgb), 0.1)' }}>
          <tr>
            <td className="py-3 pr-4">Newsletter</td>
            <td className="py-3 pr-4">Envoi de communiqués et actualités de l&apos;OTJM</td>
            <td className="py-3">Consentement explicite (art. 5 Loi 2004-63)</td>
          </tr>
          <tr>
            <td className="py-3 pr-4">Adhésion</td>
            <td className="py-3 pr-4">Gestion des membres, établissement de la carte membre</td>
            <td className="py-3">Exécution du contrat d&apos;adhésion</td>
          </tr>
          <tr>
            <td className="py-3 pr-4">Contact</td>
            <td className="py-3 pr-4">Traitement des demandes entrantes</td>
            <td className="py-3">Intérêt légitime de l&apos;organisation</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'conservation',
    title: '4. Durée de conservation',
    content: (
      <ul className="space-y-2">
        <li><span className="font-medium">Newsletter :</span> jusqu&apos;au désabonnement ou demande de suppression. En l&apos;absence d&apos;activité, les données sont supprimées après 3 ans.</li>
        <li><span className="font-medium">Adhésion :</span> durée de l&apos;adhésion active + 5 ans à des fins d&apos;archivage légal.</li>
        <li><span className="font-medium">Contact :</span> 1 an après clôture de la demande.</li>
      </ul>
    ),
  },
  {
    id: 'droits',
    title: '5. Vos droits',
    content: (
      <>
        <p>Conformément à la Loi organique tunisienne n°2004-63 du 27 juillet 2004 relative à la protection des données personnelles, vous disposez des droits suivants :</p>
        <ul className="mt-3 space-y-2">
          <li><span className="font-medium">Droit d&apos;accès :</span> obtenir une copie des données vous concernant.</li>
          <li><span className="font-medium">Droit de rectification :</span> corriger des données inexactes ou incomplètes.</li>
          <li><span className="font-medium">Droit d&apos;opposition :</span> vous opposer au traitement, notamment à des fins de communication.</li>
          <li><span className="font-medium">Droit à l&apos;effacement :</span> demander la suppression de vos données, sous réserve d&apos;obligations légales de conservation.</li>
        </ul>
        <p className="mt-4">
          Pour exercer ces droits, adressez votre demande par email à{' '}
          <a href="mailto:otjm.national@gmail.com" className="underline underline-offset-2 hover:text-[var(--otjm-red)] transition-colors">
            otjm.national@gmail.com
          </a>{' '}
          en précisant votre identité. Nous répondrons dans un délai maximum de 30 jours.
        </p>
        <p className="mt-3">
          Vous pouvez également adresser une réclamation auprès de l&apos;
          <a href="https://www.inpdp.nat.tn" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[var(--otjm-red)] transition-colors">
            Instance Nationale de Protection des Données Personnelles (INPDP)
          </a>.
        </p>
      </>
    ),
  },
  {
    id: 'securite',
    title: '6. Sécurité',
    content: (
      <p>
        Les données sont hébergées sur une base de données MongoDB Atlas en région Europe (Frankfurt), protégée
        par chiffrement au repos et en transit (TLS). L&apos;accès au panel d&apos;administration est restreint à un
        nombre limité de personnes habilitées, via une authentification sécurisée. Les mots de passe administrateurs
        sont hachés (bcrypt, 12 rounds). Les APIs publiques sont protégées par un système de limitation de
        débit (rate limiting).
      </p>
    ),
  },
  {
    id: 'tiers',
    title: '7. Prestataires tiers',
    content: (
      <>
        <p>Nous faisons appel aux prestataires suivants dans le cadre du traitement des données :</p>
        <ul className="mt-3 space-y-2">
          <li>
            <span className="font-medium">MongoDB Atlas (MongoDB, Inc.) :</span> hébergement de la base de
            données en région EU. Politique de confidentialité :{' '}
            <a href="https://www.mongodb.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[var(--otjm-red)] transition-colors">mongodb.com/legal/privacy-policy</a>
          </li>
          <li>
            <span className="font-medium">Google Forms (Google LLC) :</span> collecte des données d&apos;adhésion.
            Les données transmises via Google Forms sont soumises à la politique de Google. Politique de
            confidentialité :{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[var(--otjm-red)] transition-colors">policies.google.com/privacy</a>
          </li>
          <li>
            <span className="font-medium">Cha9a9a.tn :</span> traitement des paiements d&apos;adhésion. Aucune
            donnée de carte bancaire ne transite par nos serveurs.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'modifications',
    title: '8. Modifications',
    content: (
      <p>
        Cette politique peut être mise à jour pour refléter des évolutions légales ou organisationnelles. La
        date de dernière mise à jour est indiquée en bas de page. En cas de modification substantielle, un
        avis sera publié sur le site.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  const [isDark, setIsDark] = useState(true)

  return (
    <div className="min-h-screen font-body" style={{ background: 'var(--otjm-bg)' }}>
      <SiteHeader isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      <main id="main-content">
        <section className="relative bg-[var(--otjm-dark)] text-white overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--otjm-red)]" />
          <div className="relative container mx-auto px-4 max-w-4xl py-16">
            <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">OTJM — Données personnelles</span>
            <h1 className="font-editorial text-4xl md:text-5xl font-black leading-tight mt-3 mb-4">
              Politique de confidentialité
            </h1>
            <p className="text-white/60 max-w-xl leading-relaxed">
              Ce document décrit les données personnelles collectées par l&apos;OTJM, la manière dont elles sont
              utilisées, et les droits dont vous disposez conformément à la Loi organique tunisienne n°2004-63
              et au Règlement général sur la protection des données (RGPD).
            </p>
            <p className="text-white/40 text-sm mt-6">Dernière mise à jour : avril 2026</p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-[220px_1fr] gap-12">

              <nav className="hidden md:block">
                <ul className="space-y-1 sticky top-8">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="block text-sm py-1.5 transition-colors hover:text-[var(--otjm-red)]"
                        style={{ color: 'var(--otjm-text-muted)' }}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-12">
                {SECTIONS.map((s) => (
                  <div key={s.id} id={s.id} className="scroll-mt-8">
                    <h2
                      className="font-editorial text-xl font-bold mb-4 pb-3 border-b"
                      style={{ color: 'var(--otjm-text)', borderColor: 'var(--otjm-text-muted)', opacity: 1 }}
                    >
                      {s.title}
                    </h2>
                    <div className="text-sm leading-relaxed space-y-2" style={{ color: 'var(--otjm-text-muted)' }}>
                      {s.content}
                    </div>
                  </div>
                ))}

                <div className="pt-6 border-t text-xs" style={{ borderColor: 'var(--otjm-text-muted)', color: 'var(--otjm-text-muted)' }}>
                  Pour toute question relative à cette politique :{' '}
                  <a href="mailto:otjm.national@gmail.com" className="underline underline-offset-2 hover:text-[var(--otjm-red)] transition-colors">
                    otjm.national@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
