// Next.js Turbopack'in çökmesini engellemek için require ile çağırıyoruz
// @ts-ignore
const Iyzipay = require('iyzipay');

export const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com'
});

export default Iyzipay;