import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

export async function sendInterviewCompletedEmail(input: {
  to: string;
  candidateName: string;
  interviewTitle: string;
  submittedAt: string;
  sessionDetailUrl: string;
}) {
  if (!apiKey || !fromEmail) {
    console.warn("Resend not configured (RESEND_API_KEY / RESEND_FROM_EMAIL missing), skipping email.");
    return;
  }

  const resend = new Resend(apiKey);
  const submittedAtText = new Date(input.submittedAt).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  });

  await resend.emails.send({
    from: `InterviewHub <${fromEmail}>`,
    to: input.to,
    subject: `${input.candidateName} 已完成面試 - ${input.interviewTitle}`,
    html: `
      <div style="font-family: sans-serif; color: #111;">
        <h2>候選人已完成面試</h2>
        <p><strong>候選人：</strong>${escapeHtml(input.candidateName)}</p>
        <p><strong>面試：</strong>${escapeHtml(input.interviewTitle)}</p>
        <p><strong>提交時間：</strong>${submittedAtText}</p>
        <p><a href="${input.sessionDetailUrl}" style="color: #7c3aed;">查看面試詳情 →</a></p>
      </div>
    `,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
