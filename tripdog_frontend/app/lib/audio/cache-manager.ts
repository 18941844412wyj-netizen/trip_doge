// lib/audio/cache-manager.ts
class AudioCacheManager {
    private cache: Map<string, Blob> = new Map();
    private db: IDBDatabase | null = null;

    async init() {
        // 使用 IndexedDB 缓存音频
        this.db = await openDB('audio-cache', 1);
    }

    async getOrGenerate(text: string, voice: string): Promise<Blob> {
        const key = `${voice}:${text}`;

        // 检查内存缓存
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        // 检查 IndexedDB
        const cached = await this.db?.get('audio', key);
        if (cached) {
            this.cache.set(key, cached);
            return cached;
        }

        // 生成新音频
        const audio = await generateAudio(text, voice);

        // 缓存
        this.cache.set(key, audio);
        await this.db?.put('audio', audio, key);

        return audio;
    }
}