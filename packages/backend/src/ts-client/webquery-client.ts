import axios, { AxiosInstance } from 'axios';
import http from 'http';
import https from 'https';
import { TSApiError } from '../middleware/error-handler.js';
import { config } from '../config.js';

export class WebQueryClient {
  private http: AxiosInstance;
  private agent: http.Agent | https.Agent;
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly useHttps: boolean;

  constructor(
    host: string,
    port: number,
    apiKey: string,
    useHttps: boolean = false,
  ) {
    const protocol = useHttps ? 'https' : 'http';
    this.baseURL = `${protocol}://${host}:${port}`;
    this.apiKey = apiKey;
    this.useHttps = useHttps;

    this.agent = this.createAgent();
    this.http = this.createHttpClient();
  }

  async execute(sid: number, command: string, params?: Record<string, any>): Promise<any> {
    return this.request('get', sid, command, params);
  }

  async executePost(sid: number, command: string, params?: Record<string, any>): Promise<any> {
    return this.request('post', sid, command, params);
  }

  private createAgent(): http.Agent | https.Agent {
    const common = {
      keepAlive: true,
      maxSockets: 1,
      maxFreeSockets: 1,
      keepAliveMsecs: 10_000,
    };

    return this.useHttps
      ? new https.Agent({ ...common, rejectUnauthorized: !config.tsAllowSelfSigned })
      : new http.Agent(common);
  }

  private createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.baseURL,
      headers: { 'x-api-key': this.apiKey },
      timeout: 20_000,
      httpAgent: this.useHttps ? undefined : this.agent,
      httpsAgent: this.useHttps ? this.agent : undefined,
    });
  }

  private isTransientNetworkError(error: any): boolean {
    return [
      'ECONNRESET',
      'ECONNREFUSED',
      'ECONNABORTED',
      'ETIMEDOUT',
      'EPIPE',
      'socket hang up',
      'read ECONNRESET',
      'connect ECONNREFUSED',
      'write EPIPE',
    ].some((needle) => String(error?.message || '').includes(needle) || error?.code === needle);
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private rebuildConnection(): void {
    this.agent.destroy();
    this.agent = this.createAgent();
    this.http = this.createHttpClient();
  }

  private async request(
    method: 'get' | 'post',
    sid: number,
    command: string,
    params?: Record<string, any>,
  ): Promise<any> {
    const path = sid > 0 ? `/${sid}/${command}` : `/${command}`;

    try {
      const response = method === 'get'
        ? await this.http.get(path, { params: this.cleanParams(params) })
        : await this.http.post(path, null, { params: this.cleanParams(params) });

      const data = response.data;
      if (data.status && data.status.code !== 0) {
        throw new TSApiError(data.status.code, data.status.message);
      }

      return data.body || data;
    } catch (error: any) {
      if (error instanceof TSApiError) throw error;
      if (error.response?.data?.status) {
        throw new TSApiError(
          error.response.data.status.code,
          error.response.data.status.message,
        );
      }
      if (this.isTransientNetworkError(error)) {
        for (const waitMs of [0, 500, 1500]) {
          if (waitMs > 0) {
            await this.delay(waitMs);
          }
          this.rebuildConnection();
          try {
            const retryResponse = method === 'get'
              ? await this.http.get(path, { params: this.cleanParams(params) })
              : await this.http.post(path, null, { params: this.cleanParams(params) });
            const retryData = retryResponse.data;
            if (retryData.status && retryData.status.code !== 0) {
              throw new TSApiError(retryData.status.code, retryData.status.message);
            }
            return retryData.body || retryData;
          } catch (retryError: any) {
            if (retryError instanceof TSApiError) throw retryError;
            if (retryError.response?.data?.status) {
              throw new TSApiError(
                retryError.response.data.status.code,
                retryError.response.data.status.message,
              );
            }
            if (!this.isTransientNetworkError(retryError)) {
              throw new TSApiError(-1, retryError.message || 'Connection failed');
            }
          }
        }
        throw new TSApiError(-1, error.message || 'Connection failed');
      }
      throw new TSApiError(-1, error.message || 'Connection failed');
    }
  }

  // Remove undefined/null values from params
  private cleanParams(params?: Record<string, any>): Record<string, any> | undefined {
    if (!params) return undefined;
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.execute(0, 'version');
      return true;
    } catch {
      return false;
    }
  }

  // Destroy the HTTP agent, closing all keep-alive sockets.
  // Call this for temporary clients (e.g. test connection) to avoid lingering query logins.
  destroy(): void {
    this.agent.destroy();
  }
}
