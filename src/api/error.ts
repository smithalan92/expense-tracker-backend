import axios from 'axios';

const VERIFICATION_ID = process.env.NOTIFIER_IDENTITY_KEY!;

export function sendErrorNotification({ subject, content, error }: { subject: string; content: string; error: Error }) {
  const contentToSend = `${content}\n\n${error.message}`;

  axios
    .post('https://notifier.smithy.dev/alert', {
      subject,
      content: contentToSend,
      id: VERIFICATION_ID,
    })
    .catch((err) => {
      console.log('Failed to send error notification ', err);
    });
}
