import { PageShell } from '@/components/PageShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Stepper';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

const faqs = [
  { question: 'How do I fund my DataSub wallet?', answer: 'Open your Wallet to create or view your BillStack virtual bank account. Transfer using its displayed details and fees. Only a confirmed BillStack transfer credits your DataSub wallet.' },
  { question: 'What networks are supported for airtime and data?', answer: 'We support MTN, Airtel, Glo, and T2 for both airtime top-up and data bundle purchases.' },
  { question: 'How long do transactions take?', answer: 'Completion time depends on the connected provider. Submitted purchases remain visible in your transaction history with their current status.' },
  { question: 'What happens if a transaction fails?', answer: 'Failed or unresolved transactions remain traceable by reference. Refund handling follows the status returned by the connected provider and the DataSub transaction workflow; contact support if a transaction needs review.' },
  { question: 'How do I become a reseller?', answer: 'Register for a reseller account, fund your wallet, and start purchasing at discounted rates. You can upgrade to higher tiers as your sales volume increases.' },
  { question: 'Is there a minimum wallet balance?', answer: 'No minimum balance is required. However, you need sufficient balance to cover any transaction you wish to make.' },
  { question: 'Can I use the API for my own platform?', answer: 'Yes. Sign up for an API Developer plan, generate your API key from the dashboard, and integrate using our RESTful API with full documentation.' },
  { question: 'How do I contact support?', answer: 'You can reach us via your support dashboard, email hassanisahassan12@gmail.com, call 0814 667 6278, or use the WhatsApp link available across the platform.' },
];

export function DataSubFaq() {
  return (
    <PageShell product="datasub">
      <div className="px-6 lg:px-10 py-12 max-w-[800px] mx-auto">
        <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">FAQ</Badge>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Frequently Asked Questions</h1>
        <p className="text-sm text-muted mb-8">Everything you need to know about IHLink DataSub.</p>
        <Accordion items={faqs} defaultOpen={0} />
        <Card padding="lg" className="mt-8 text-center bg-surface">
          <h3 className="text-lg font-bold text-ink mb-2">Still have questions?</h3>
          <p className="text-sm text-muted mb-4">Contact the IHLink support team for account, transaction and service assistance.</p>
          <Link to="/datasub/support"><Button themeClass="bg-emerald-500 hover:bg-emerald-600">Contact Support</Button></Link>
        </Card>
      </div>
    </PageShell>
  );
}
