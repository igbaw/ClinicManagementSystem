export class SatuSehatClient {
  private clientId: string;
  private clientSecret: string;
  private baseURL: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor() {
    this.clientId = process.env.SATUSEHAT_CLIENT_ID || '';
    this.clientSecret = process.env.SATUSEHAT_CLIENT_SECRET || '';
    this.baseURL = process.env.SATUSEHAT_BASE_URL || '';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) return this.accessToken;
    const res = await fetch(`${this.baseURL}/oauth2/v1/accesstoken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret }),
    });
    if (!res.ok) throw new Error('SATUSEHAT token error');
    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken!
  }

  async createPatient(patient: Record<string, unknown>): Promise<unknown> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseURL}/fhir-r4/v1/Patient`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) throw new Error('SATUSEHAT create patient error');
    return res.json();
  }
}
