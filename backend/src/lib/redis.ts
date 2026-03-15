type RedisValue = string | number;

class UpstashRedisClient {
  private readonly url: string | null;
  private readonly token: string | null;

  constructor() {
    this.url = process.env.UPSTASH_REDIS_REST_URL ?? null;
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN ?? null;

    if (this.isConfigured()) {
      console.log("✅ Upstash Redis configured");
    } else {
      console.warn(
        "⚠️ Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
      );
    }
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command<string | null>(["GET", key]);
    return result ?? null;
  }

  async setex(key: string, seconds: number, value: string): Promise<unknown> {
    return this.command(["SETEX", key, seconds, value]);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.command<number>(["ZADD", key, score, member]);
  }

  async zrangebyscore(key: string, min: RedisValue, max: RedisValue): Promise<string[]> {
    return this.command<string[]>(["ZRANGEBYSCORE", key, min, max]);
  }

  async zremrangebyscore(key: string, min: RedisValue, max: RedisValue): Promise<number> {
    return this.command<number>(["ZREMRANGEBYSCORE", key, min, max]);
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.command<number>(["LPUSH", key, ...values]);
  }

  async ltrim(key: string, start: number, stop: number): Promise<unknown> {
    return this.command(["LTRIM", key, start, stop]);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.command<string[]>(["LRANGE", key, start, stop]);
  }

  async del(key: string): Promise<number> {
    return this.command<number>(["DEL", key]);
  }

  private isConfigured() {
    return Boolean(this.url && this.token);
  }

  private async command<T>(args: Array<string | number>): Promise<T> {
    if (!this.url || !this.token) {
      throw new Error(
        "Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
      );
    }

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      throw new Error(`Upstash request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { result?: T; error?: string };

    if (payload.error) {
      throw new Error(payload.error);
    }

    return payload.result as T;
  }
}

export const redis = new UpstashRedisClient();
