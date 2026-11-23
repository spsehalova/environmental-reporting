import type { AuthenticateError, AuthenticateHandler } from "aedes";
import htpasswd from "htpasswd-js";
import path from "path";

/* eslint no-unused-vars: 0 */
const enum AuthErrorCode {
	UNNACCEPTABLE_PROTOCOL = 1,
	IDENTIFIER_REJECTED = 2,
	SERVER_UNAVAILABLE = 3,
	BAD_USERNAME_OR_PASSWORD = 4,
	NOT_AUTHORIZED = 5,
}

const htpasswdFilePath = path.join(process.cwd(), process.env.HTPASSWD_PATH || "../.htpasswd");

export const aedesAuthentificate: AuthenticateHandler = (client, user, pass, done) => {
	if (!user || !pass) {
		done(authError("Missing username or password", AuthErrorCode.BAD_USERNAME_OR_PASSWORD), false);
		return;
	}

	htpasswd.authenticate({
		username: user,
		password: pass.toString(),
		file: htpasswdFilePath,
	})
		.then((result) => {
			if (result) {
				done(null, true);
			} else {
				done(authError("Bad username or password", AuthErrorCode.BAD_USERNAME_OR_PASSWORD), false);
			}
		})
		.catch((error) => {
			console.error("Error during authentication:", error);
			done(authError("Authentication error", AuthErrorCode.SERVER_UNAVAILABLE), false);
		});
}

function authError(message: string, returnCode: AuthErrorCode): AuthenticateError {
	return Object.assign(new Error(message), { returnCode });
}