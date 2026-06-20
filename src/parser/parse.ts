export class ModParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ModParseError';
	}
}
