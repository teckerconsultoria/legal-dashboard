import nodemailer from 'nodemailer'

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('[mailer] SMTP não configurado — emails não serão enviados.')
}

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.EMAIL_FROM ?? 'alessandro.lemos@teckerconsulting.com.br'

export interface OrderEmailData {
  to: string
  orderNumber: string
  skuName: string
  dashboardUrl: string
}

export async function sendOrderPaid(data: OrderEmailData) {
  return transporter.sendMail({
    from: `"Tecker Consulting" <${FROM}>`,
    to: data.to,
    subject: `Pedido recebido — ${data.skuName}`,
    html: `
      <p>Olá,</p>
      <p>Recebemos seu pedido <strong>${data.orderNumber}</strong> (${data.skuName}).</p>
      <p>Em breve nossa equipe iniciará o processamento. Você pode acompanhar o andamento pelo link abaixo:</p>
      <p><a href="${data.dashboardUrl}">${data.dashboardUrl}</a></p>
      <p>Qualquer dúvida, responda este e-mail.</p>
      <p>Tecker Consulting</p>
    `,
  })
}

export async function sendOperatorAlert(data: { to: string; subject: string; body: string }) {
  return transporter.sendMail({
    from: `"Legal Dashboard" <${FROM}>`,
    to: data.to,
    subject: data.subject,
    text: data.body,
  })
}

export async function sendOrderDelivered(data: OrderEmailData) {
  return transporter.sendMail({
    from: `"Tecker Consulting" <${FROM}>`,
    to: data.to,
    subject: `Seu Report está pronto — ${data.skuName}`,
    html: `
      <p>Olá,</p>
      <p>Seu report <strong>${data.skuName}</strong> (pedido ${data.orderNumber}) foi concluído.</p>
      <p>Acesse o resultado pelo link abaixo:</p>
      <p><a href="${data.dashboardUrl}">${data.dashboardUrl}</a></p>
      <p>Tecker Consulting</p>
    `,
  })
}
