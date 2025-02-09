import React from 'react';
import { Resend } from 'resend';
import MagicLinkEmail, { type MagicLinkEmailProps } from './magic-link.email';

React;

type SendEmailProps<TemplateProps> = TemplateProps & {
  to: string;
  from?: string;
};

export class EmailService {
  private readonly resend: Resend;

  constructor(resendApiKey: string) {
    this.resend = new Resend(resendApiKey);
  }

  async sendMagicLinkEmail(opts: SendEmailProps<MagicLinkEmailProps>) {
    const { to, from, ...props } = opts;

    return await this.resend.emails.send({
      from: from ?? 'noreply@email.krolebord.com',
      to,
      subject: 'Your login link',
      react: <MagicLinkEmail {...props} />,
    });
  }
}
