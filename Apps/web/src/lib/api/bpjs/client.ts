import crypto from 'crypto';

export interface BPJSEligibilityResponse {
  response: {
    peserta: {
      cob: {
        nmAsuransi: string;
        noAsuransi: string;
        tglTAT: string;
        tglTMT: string;
      };
      informasi: {
        dinsos: string;
        noSKTM: string;
        prolanisPRB: string;
      };
      jenisPeserta: {
        keterangan: string;
      };
      mr: {
        noMR: string;
        noTelepon: string;
      };
      nama: string;
      nik: string;
      noKartu: string;
      pisa: string;
      provUmum: {
        kdProvider: string;
        nmProvider: string;
      };
      sex: string;
      statusPeserta: {
        keterangan: string;
        kode: string;
      };
      tglCetakKartu: string;
      tglLahir: string;
      tglTAT: string;
      tglTMT: string;
      umur: {
        umurSaatPelayanan: string;
        umurSekarang: string;
      };
    };
  };
  metaData: {
    code: string;
    message: string;
  };
}

export interface SEPRequest {
  noKartu: string;
  tglSep: string; // YYYY-MM-DD
  ppkPelayanan: string; // Kode PPK
  jnsPelayanan: string; // "1" = Rawat Inap, "2" = Rawat Jalan
  klsRawat: string; // "1", "2", "3"
  noMR: string;
  rujukan: {
    asalRujukan: string; // "1" = Faskes 1, "2" = Faskes 2(RS)
    tglRujukan: string;
    noRujukan: string;
    ppkRujukan: string;
  };
  catatan: string;
  diagAwal: string; // Kode ICD-10
  poli: {
    tujuan: string; // Kode poli
    eksekutif: string; // "0" = Tidak, "1" = Ya
  };
  cob: {
    cob: string; // "0" = Tidak, "1" = Ya
  };
  katarak: {
    katarak: string; // "0" = Tidak, "1" = Ya
  };
  jaminan: {
    lakaLantas: string; // "0" = Bukan, "1" = KLL, "2" = KLK
    noLP: string; // No. Laporan Polisi (jika KLL)
    penjamin: {
      tglKejadian: string;
      keterangan: string;
      suplesi: {
        suplesi: string; // "0" = Tidak, "1" = Ya
        noSepSuplesi: string;
        lokasiLaka: {
          kdPropinsi: string;
          kdKabupaten: string;
          kdKecamatan: string;
        };
      };
    };
  };
  tujuanKunj: string; // "0" = Normal, "1" = Prosedur, "2" = Konsul Dokter
  flagProcedure: string; // "" atau "1"
  kdPenunjang: string; // "" atau kode
  assesmentPel: string; // "" atau kode
  skdp: {
    noSurat: string;
    kodeDPJP: string;
  };
  dpjpLayan: string; // Kode DPJP
  noTelp: string;
  user: string; // Username pembuat SEP
}

export interface SEPResponse {
  response: {
    sep: {
      catatan: string;
      diagAwal: string;
      kelasRawat: string;
      noSep: string;
      peserta: {
        asuransi: string;
        hakKelas: string;
        jnsPeserta: string;
        kelamin: string;
        nama: string;
        noKartu: string;
        noMr: string;
        tglLahir: string;
      };
      poli: string;
      poliEksekutif: string;
      tglSep: string;
    };
  };
  metaData: {
    code: string;
    message: string;
  };
}

export class BPJSClient {
  private consID: string;
  private secretKey: string;
  private baseURL: string;
  private userKey: string;

  constructor() {
    this.consID = process.env.BPJS_CONS_ID || '';
    this.secretKey = process.env.BPJS_SECRET_KEY || '';
    this.userKey = process.env.BPJS_USER_KEY || '';
    this.baseURL = process.env.BPJS_BASE_URL || '';
  }

  private generateSignature(timestamp: string): string {
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(`${this.consID}&${timestamp}`);
    return hmac.digest('base64');
  }

  private getHeaders(): Record<string, string> {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = this.generateSignature(timestamp);
    return {
      'X-cons-id': this.consID,
      'X-timestamp': timestamp,
      'X-signature': signature,
      'user_key': this.userKey,
      'Content-Type': 'application/json',
    };
  }

  async checkEligibility(
    bpjsNumber: string,
    serviceDate: string
  ): Promise<BPJSEligibilityResponse> {
    const res = await fetch(
      `${this.baseURL}/Peserta/${bpjsNumber}/tglSEP/${serviceDate}`,
      { headers: this.getHeaders() }
    );
    if (!res.ok) {
      throw new Error(`BPJS API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async createSEP(request: SEPRequest): Promise<SEPResponse> {
    const res = await fetch(`${this.baseURL}/SEP/2.0/insert`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ request }),
    });
    if (!res.ok) {
      throw new Error(`BPJS SEP creation error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async getSEP(sepNumber: string): Promise<SEPResponse> {
    const res = await fetch(`${this.baseURL}/SEP/2.0/${sepNumber}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`BPJS get SEP error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async deleteSEP(sepNumber: string, user: string): Promise<{ metaData: { code: string; message: string } }> {
    const res = await fetch(`${this.baseURL}/SEP/2.0/delete`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({
        request: {
          t_sep: {
            noSep: sepNumber,
            user,
          },
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`BPJS delete SEP error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async getReferenceList(
    type: 'poli' | 'diagnosa' | 'faskes' | 'dpjp',
    keyword?: string
  ): Promise<{ response: { list: unknown[] }; metaData: { code: string; message: string } }> {
    let endpoint = '';
    switch (type) {
      case 'poli':
        endpoint = '/referensi/poli';
        break;
      case 'diagnosa':
        endpoint = `/referensi/diagnosa/${keyword || ''}`;
        break;
      case 'faskes':
        endpoint = `/referensi/faskes/${keyword || ''}/2`; // 2 = FKRTL
        break;
      case 'dpjp':
        endpoint = `/referensi/dokter/pelayanan/2/tglPelayanan/${keyword || ''}/0`; // 2 = Rawat Jalan
        break;
    }
    const res = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`BPJS reference error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }
}
