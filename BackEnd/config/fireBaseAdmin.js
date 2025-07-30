import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "medai-f6b21",
      clientEmail: "firebase-adminsdk-fbsvc@medai-f6b21.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD0RiLj52fR03CM\nzW1gNUKT9Z++n0vb4l2f6oFPf0VsukAuvcVdZRpxOKdMs8lGvfcm7eRYKOZ0mpGA\nKQKbzty3inqGgcYLjBpPk/9lmMMPKgb7Z+jzLqAKVYwPmnuau8dRMcv+TxNizAhC\nviZNfq8ODmlGMtII9NEG96139TDJy2T/RrIMJCGdGna8bXMSyINocVPOyLTUeFRq\n6H1DyJbM+Fz7gf6NQJXnHmtTH8BLLFyWQpbYNiZwI23rtDwiCfhC+4oqI5Sv6cYV\nshOc8xQV1tpoXmWC5R/dvaYJieXjDJ0XXnfjQKtjJcwLSiK1B86afKfaPCO0S1fc\n30+ae6HvAgMBAAECggEACfDMvK+PFwfevawidlbUhcbqIEzFPoaAvuBBMOYCAkG2\nGPDaFknmAJOIo2NxnnJem3P05e2MK1Sa9Tc2BvctHj8Ba3XehFvIOlLQgubrkTNp\no1OANF1CYAlJMN1diFd57gDzxz6akFuzPlwUnPS51P2bJSMuTvT/iKQNqCMPQDb1\nY6cy83S5Oa4/xE6bUWBEAXwY6iOL1EIEWB1kWhwa2kYWpUGOhVxh6f6JwjEJC5zQ\nMITcQPsPsNFC0LoeK4vhFJQwoTGfEPeAYs5N25VB+yCDPotX8KjrUP5eI62hxq1z\nj2HtSf+cdPtJfYJFNcEbdaqac0AuoJqZIkA1XvM/yQKBgQD8FBiPyAYiYxHF2vlz\nyT1ZM+PdwUgE8OdtozPZv4hjhj5lHHqmhpXO2VMUGLtRcEYUvm7XC+lhLHRnHQod\nEMz97gIRkM3pw/DRjHhideR3eK8sYkZvhXqJBI6FtOmxzjh0RqSMwMJSxQw+xlaX\nPIk6zDs+YaY2jg0myvZFGG4GHQKBgQD4EvVxZLA3oPvJHLzjWz7RWCd7yhMq9t/X\ngV8qI70uJw5ZdTsBvaEnAXblH9LL5rg5s3FiIQbsP0Xb5twkF0fcPmQwkjUaTrCL\n4S4cGBJlq/xagj7isizfCisU/+PtZ4xu/54dDj/pBcqauiz4/Zlu98/xZ3BoIWwA\nzXAh6fLaewKBgQDYg95Q6UqzkIp8ekgW9rv1+Yb4OwLEE7OETVDE8CmS6oR/ToXe\nsOzN3YbpVRDXs2rOeH81wKp1Z7yXsK62Jm8ckKlAMzNaXY1kP5ZLY92X7JXxtnuv\nYGPOepZ8K9cqfOmqnd7Kcuq2M0AAT1Wi00E/upoMS817QGn1bxE2afRe1QKBgBjf\ndcKP0OdS+cvZWMsG/A5rY1ITGcbmB92IuCz2dmJpQhQQIAF1rPHHQM+KWE1fbbtD\nVav8GcCYO33n8MyhlO/tRYhlMHPZzfPIeSIR+84750p/4qRCLyOR1m39ljHYfwkm\nEglhw2Cu1viakCXK75ZjvHK851VZfIW8E3EjDtl/AoGBAPbtTDEp0QGldqVAjN1Y\nDOQr8iveWrtHSeR6CrkmNBsLGJRL/CZWMdOZEy6r+WXRmhA/5BH7BNP8GSmV0OWH\nnCtlwRtpZgVmMQDxLSNQBBZ2gfI1WyiGHz8oupShMGgD+BhlGCZQLcL9VdSE+43p\nmpoGc4G4Zb146kMtU2c0+n7x\n-----END PRIVATE KEY-----\n",
    }),
  });
}

export default admin;
