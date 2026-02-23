import React from 'react';
import { Head } from '@inertiajs/react';
import EmailVerification from '@/Components/EmailVerification';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface Props {
  userId: string;
  hash: string;
}

export default function EmailVerificationPage({ userId, hash }: Props) {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  return (
    <>
      <Head title={t.emailverification13} />
      <EmailVerification userId={userId} hash={hash} />
    </>
  );
}