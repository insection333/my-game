// Transactional email behind one small interface. Off until the owner switches it on; until then
// nothing is ever sent. The real sender (with the domain's SPF and DKIM) arrives with the switch.
import type { FastifyBaseLogger } from 'fastify';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/** Writes mail to the log instead of sending it: for development and while email is off. */
export class LogMailer implements Mailer {
  private log: FastifyBaseLogger | null;
  constructor(log: FastifyBaseLogger | null) {
    this.log = log;
  }
  send(mail: Mail): Promise<void> {
    this.log?.info(
      { to: mail.to.replace(/^(.).*@/, '$1***@'), subject: mail.subject },
      'email (not sent: email is off)',
    );
    return Promise.resolve();
  }
}

/** Keeps mail in memory, for tests. */
export class MemoryMailer implements Mailer {
  readonly sent: Mail[] = [];
  send(mail: Mail): Promise<void> {
    this.sent.push(mail);
    return Promise.resolve();
  }
}
