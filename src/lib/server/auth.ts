import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { username } from 'better-auth/plugins/username';
import { polar, checkout, portal, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { env } from '$env/dynamic/private';
import { building, dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { setUserSubscribed, setTrialStarted } from '$lib/server/db/queries';
import { log } from '$lib/server/logger';
import { sendEmail } from '$lib/server/email';
import { passwordResetTemplate, emailVerificationTemplate } from '$lib/server/email-templates';

function createAuth() {
	const polarClient = new Polar({
		accessToken: env.POLAR_ACCESS_TOKEN,
		server: dev ? 'sandbox' : 'production'
	});

	return betterAuth({
		...(env.BETTER_AUTH_URL && !dev ? { baseURL: env.BETTER_AUTH_URL } : {}),
		trustedOrigins: [
			'http://localhost:5173',
			...(env.TRUSTED_ORIGINS ? env.TRUSTED_ORIGINS.split(',') : [])
		],
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, { provider: 'pg' }),
		rateLimit: {
			window: 60,
			max: 100,
			customRules: {
				'/sign-in/email': { window: 60, max: 5 },
				'/sign-up/email': { window: 60, max: 3 },
				'/forget-password': { window: 300, max: 3 }
			}
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				void sendEmail({
					to: user.email,
					subject: 'Reset your password',
					html: passwordResetTemplate({ url, name: user.name })
				});
			},
			onPasswordReset: async ({ user }) => {
				log.info({ userId: user.id }, 'password reset completed');
			}
		},
		emailVerification: {
			sendVerificationEmail: async ({ user, url }) => {
				void sendEmail({
					to: user.email,
					subject: 'Verify your email address',
					html: emailVerificationTemplate({ url, name: user.name })
				});
			},
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			async afterEmailVerification(verifiedUser) {
				log.info({ userId: verifiedUser.id }, 'email verified, starting trial');
				await setTrialStarted(verifiedUser.id);
			}
		},
		...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
			? {
					socialProviders: {
						github: {
							clientId: env.GITHUB_CLIENT_ID,
							clientSecret: env.GITHUB_CLIENT_SECRET
						}
					}
				}
			: {}),
		plugins: [
			username({
				minUsernameLength: 3,
				maxUsernameLength: 39,
				usernameValidator: (u) => /^[a-z0-9]+$/.test(u)
			}),
			polar({
				client: polarClient,
				createCustomerOnSignUp: true,
				use: [
					checkout({
						products: [
							{ productId: env.POLAR_PRODUCT_ID_MONTHLY ?? '', slug: 'monthly' },
							{ productId: env.POLAR_PRODUCT_ID_YEARLY ?? '', slug: 'yearly' }
						],
						successUrl: '/subscribe/success?checkout_id={CHECKOUT_ID}',
						authenticatedUsersOnly: true
					}),
					portal(),
					webhooks({
						secret: env.POLAR_WEBHOOK_SECRET ?? '',
						onSubscriptionActive: async (payload) => {
							const userId = payload.data.customer.externalId;
							if (!userId) {
								log.warn(
									{ customerId: payload.data.customerId },
									'subscription.active: no externalId'
								);
								return;
							}
							log.info({ userId, subscriptionId: payload.data.id }, 'subscription activated');
							await setUserSubscribed(userId, true);
						},
						onSubscriptionRevoked: async (payload) => {
							const userId = payload.data.customer.externalId;
							if (!userId) {
								log.warn(
									{ customerId: payload.data.customerId },
									'subscription.revoked: no externalId'
								);
								return;
							}
							log.info({ userId, subscriptionId: payload.data.id }, 'subscription revoked');
							await setUserSubscribed(userId, false);
						},
						onCustomerStateChanged: async (payload) => {
							const userId = payload.data.externalId;
							if (!userId) return;
							const hasActive = payload.data.activeSubscriptions.length > 0;
							log.info(
								{ userId, activeSubscriptions: payload.data.activeSubscriptions.length },
								'customer state changed'
							);
							await setUserSubscribed(userId, hasActive);
						}
					})
				]
			}),
			sveltekitCookies(getRequestEvent) // must be last
		]
	});
}

/**
 * Skip initialization during SvelteKit's postbuild analysis where env vars
 * are unavailable. The cast preserves the full plugin-augmented type.
 */
export const auth = building
	? (undefined as unknown as ReturnType<typeof createAuth>)
	: createAuth();
