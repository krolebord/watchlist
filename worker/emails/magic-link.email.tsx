import { Section } from '@react-email/components';
import React from 'react';
import { EmailLayout } from './layout.email';

React;

export type MagicLinkEmailProps = {
  link: string;
};
export const MagicLinkEmail = (props: MagicLinkEmailProps) => {
  const { link } = props;
  return (
    <EmailLayout heading="Your login link">
      <Section>
        <EmailLayout.Button href={link}>Login</EmailLayout.Button>
      </Section>
    </EmailLayout>
  );
};

MagicLinkEmail.PreviewProps = {
  link: 'https://example.com',
};

export default MagicLinkEmail;
