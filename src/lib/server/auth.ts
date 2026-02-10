import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { polar, checkout, portal, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { setUserSubscribed } from '$lib/server/db/queries';
import { log } from '$lib/server/logger';

const polarClient = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
	server: 'sandbox'
});

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true },
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET
		}
	},
	plugins: [
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
