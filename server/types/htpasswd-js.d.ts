declare module "htpasswd-js" {
	interface AuthenticateOptionsBase {
		username: string;
		password: string;
	}

	type AuthenticateOptions =
		| (AuthenticateOptionsBase & { file: string; data?: never })
		| (AuthenticateOptionsBase & { data: string; file?: never });

	export function authenticate(options: AuthenticateOptions): Promise<boolean>;
}
