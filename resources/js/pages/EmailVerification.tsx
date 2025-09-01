import React from 'react';
import { Head } from '@inertiajs/react';
import EmailVerification from '@/Components/EmailVerification';

interface Props {
  userId: string;
  hash: string;
}

export default function EmailVerificationPage({ userId, hash }: Props) {
  return (
    <>
      <Head title="E-Mail bestätigen - Scoriet" />
      <EmailVerification userId={userId} hash={hash} />
    </>
  );
}