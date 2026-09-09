// Shared per-key TTL cache for the per-address reporting endpoints (positions/prices/savings/reporting
// owner lookups). These all have the same shape: an unbounded address-keyed key space, recomputed from
// Ponder/live reads with no cache today. One instance per method, sized by how fast that method's data
// actually changes.
export class TtlCache<T> {
	private store = new Map<string, { value: T; expiresAt: number }>();

	constructor(private readonly ttlMs: number) {}

	async getOrCompute(key: string, compute: () => Promise<T>): Promise<T> {
		const cached = this.store.get(key);
		if (cached && cached.expiresAt > Date.now()) return cached.value;

		const value = await compute();
		this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
		return value;
	}
}
