export class MidtransClient {
  private serverKey: string;
  private baseURL: string;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    this.baseURL = process.env.MIDTRANS_BASE_URL || "https://api.sandbox.midtrans.com";
  }

  // TODO: implement charge/create QRIS if needed later
}
