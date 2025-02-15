/* eslint-disable camelcase */
/* eslint-disable unicorn/consistent-destructuring */
import { CreatableCheckoutSession, PLAN_DETAILS_LIST, SubscriptionDetails } from '@api-interfaces';
import { Injectable, Scope } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { OrganizationsRepository } from '@server/app/repositories/organizations';
import { UsersRepository } from '@server/app/repositories/users';
import { environment } from '@server/environments/environment';
import { Request } from 'express';
import * as E from 'fp-ts/lib/Either';
import { flow, pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import Stripe from 'stripe';

type CheckoutOutputData = {
  checkoutURL: string;
};

const calculePrice = (checkoutData: CreatableCheckoutSession): number => {
  const pricePerMonth = checkoutData.features.reduce((accumulator, featureKey) => {
    const featurePrice = PLAN_DETAILS_LIST.find(feature => feature.key === featureKey)?.price;
    return accumulator + (featurePrice ?? 0);
  }, 0);

  // * If the user chooses to pay yearly, we give a discount of 2 months
  const price = checkoutData.interval === 'year' ? pricePerMonth * 10 : pricePerMonth;
  // * Calcule price in cents
  return Math.round(price * 100);
};

const stripeSubscriptionMetadataCodec = t.type({
  organizationID: t.string,
  digitalMenu: t.union([t.literal('t'), t.literal('f')]),
  supervision: t.union([t.literal('t'), t.literal('f')]),
});

type StripeSubscriptionMetadata = t.TypeOf<typeof stripeSubscriptionMetadataCodec>;

const CHECKOUT_SUCCESS_URL = `${environment.apiURL}/payments/success?session_id={CHECKOUT_SESSION_ID}`;

@Injectable({
  scope: Scope.DEFAULT,
})
export class PaymentsService {
  private readonly _stripeSecretKey = environment.stripe.secretKey;
  private readonly _stripeWebhookSecret = environment.stripe.webhookSecret;
  private readonly _stripe = new Stripe(this._stripeSecretKey);

  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _organizationsRepository: OrganizationsRepository,
  ) {}

  public readonly onSuccessCheckout = (sessionID: string): TE.TaskEither<Exception, void> =>
    pipe(
      TE.tryCatch(async () => {
        const session = await this._stripe.checkout.sessions.retrieve(sessionID);
        // * Get subscription
        const subscription = t.string.is(session.subscription)
          ? await this._stripe.subscriptions.retrieve(session.subscription)
          : session.subscription;
        if (!subscription) {
          // eslint-disable-next-line functional/no-throw-statements
          throw new Error('Invalid subscription');
        }
        const { metadata } = subscription;
        if (!stripeSubscriptionMetadataCodec.is(metadata)) {
          // eslint-disable-next-line functional/no-throw-statements
          throw new Error('Invalid metadata');
        }

        const item = subscription.items.data[0];
        if (!item) {
          // eslint-disable-next-line functional/no-throw-statements
          throw new Error('Invalid item');
        }

        return {
          id: subscription.id,
          cancelAt: subscription.cancel_at,
          // `created` is in seconds, we need to convert to milliseconds to create a Date
          createdAt: subscription.created * 1000,
          interval: item.plan.interval,
          price: item.plan.amount ?? 1,
          metadata,
        };
      }, EXCEPTIONS.to.bad),
      TE.chain(sessionData => {
        // * Create the subscription details
        const subscription: Omit<SubscriptionDetails, 'id'> = {
          externalID: sessionData.id,
          price: sessionData.price / 100,
          cancelAt: sessionData.cancelAt ? new Date(sessionData.cancelAt) : null,
          interval: sessionData.interval === 'month' ? 'month' : 'year',
          createdAt: new Date(sessionData.createdAt),
          digitalMenu: sessionData.metadata.digitalMenu === 't',
          supervision: sessionData.metadata.supervision === 't',
        };

        // * Update organization
        return this._organizationsRepository.createSubscription(sessionData.metadata.organizationID, subscription);
      }),
      TE.map(() => void 0),
    );

  public readonly cancelSubscription = (loggedUser: LoggedUser): TE.TaskEither<Exception, void> =>
    pipe(
      // * Check if the user is the owner of the organization
      this._usersRepository.isOrganizationOwner({
        userID: loggedUser.id,
        organizationID: loggedUser.organizationID,
      }),
      // * Get the subscription details
      TE.chain(() => this._organizationsRepository.findSubscriptionByOrganizationID(loggedUser.organizationID)),
      TE.bindTo('subscription'),
      // * Cancel on Stripe
      TE.bind('cancelAtDate', ({ subscription }) =>
        TE.tryCatch(async () => {
          const sessionE = await TE.tryCatch(
            async () =>
              await this._stripe.subscriptions.update(subscription.externalID, {
                cancel_at_period_end: true,
              }),
            error => error,
          )();
          if (E.isLeft(sessionE)) {
            const error = sessionE.left;
            console.warn('Error canceling subscription', error);
            // eslint-disable-next-line functional/no-throw-statements
            throw new Error('Subscription not canceled');
          }

          const session = sessionE.right;

          if (!session.cancel_at) {
            // eslint-disable-next-line functional/no-throw-statements
            throw new Error('Subscription not canceled');
          }
          return session.cancel_at;
        }, EXCEPTIONS.to.bad),
      ),
      // * Update the organization's subscription
      TE.chain(
        flow(
          ({ subscription, cancelAtDate }) =>
            this._organizationsRepository.updateSubscription(loggedUser.organizationID, {
              ...subscription,
              // * `cancel_at` is in seconds, we need to convert to milliseconds to create a Date
              cancelAt: new Date(cancelAtDate * 1000),
            }),
          TE.map(() => void 0),
        ),
      ),
    );

  public readonly createCheckoutSession = (
    loggedUser: LoggedUser,
    creatableCheckoutSession: CreatableCheckoutSession,
  ): TE.TaskEither<Exception, { checkoutURL: string }> =>
    pipe(
      // * Check if the user is the owner of the organization
      this._organizationsRepository.findMinimalByID(loggedUser.organizationID),
      TE.fromTaskOption(() => EXCEPTIONS.notFound('Organization not found')),
      TE.filterOrElse(
        organization => organization.ownerID === loggedUser.id,
        () => EXCEPTIONS.forbidden('Only organization owners can create a checkout session'),
      ),
      // * Return if the organization already has a subscription
      TE.filterOrElse(
        organization => !organization.subscription,
        () => EXCEPTIONS.bad('Organization already has a subscription'),
      ),
      TE.chain(() => this._usersRepository.findMetadataByID(loggedUser.id)),
      // * Create the checkout session
      TE.chain(userData =>
        pipe(
          TE.tryCatch(
            async () =>
              await this._stripe.customers.list({
                email: userData.email,
              }),
            EXCEPTIONS.to.bad,
          ),
          TE.map(customers => customers.data[0]),
          TE.chain(stripeCustomer => {
            const metadata: StripeSubscriptionMetadata = {
              organizationID: loggedUser.organizationID,
              digitalMenu: creatableCheckoutSession.features.includes('digital_menu') ? 't' : 'f',
              supervision: creatableCheckoutSession.features.includes('supervision') ? 't' : 'f',
            };

            const item: Stripe.Checkout.SessionCreateParams.LineItem = {
              price_data: {
                currency: 'brl',
                product_data: {
                  name: 'Bundle',
                },
                recurring: {
                  interval: creatableCheckoutSession.interval,
                },
                unit_amount: calculePrice(creatableCheckoutSession),
              },
              quantity: 1,
            };

            return this._createStripeSession(
              item,
              stripeCustomer,
              metadata,
              userData,
              loggedUser,
              creatableCheckoutSession.cupomID,
            );
          }),
        ),
      ),
    );

  /**
   * Should only be triggered by stripe webhooks to delete the subscription from our system
   */
  public readonly deleteSubscription = (subscriptionID: string): TE.TaskEither<Exception, void> => {
    return pipe(
      // * Delete the subscription
      this._organizationsRepository.deleteSubscriptionByExternalID(subscriptionID),
    );
  };

  /**
   * Should only be triggered by stripe webhooks to delete the subscription from our system
   */
  public readonly updateSubscription = (subscription: Stripe.Subscription): TE.TaskEither<Exception, void> => {
    return pipe(
      TE.tryCatch(async () => {
        const { metadata } = subscription;
        if (!stripeSubscriptionMetadataCodec.is(metadata)) {
          // eslint-disable-next-line functional/no-throw-statements
          throw new Error('Invalid metadata');
        }

        const item = subscription.items.data[0];
        if (!item) {
          // eslint-disable-next-line functional/no-throw-statements
          throw new Error('Invalid item');
        }

        // * Create the subscription details
        const subscriptionDetails: Omit<SubscriptionDetails, 'id' | 'createdAt'> = {
          externalID: subscription.id,
          price: (item.plan.amount ?? 1) / 100,
          cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at) : null,
          interval: item.plan.interval === 'month' ? 'month' : 'year',
          digitalMenu: metadata.digitalMenu === 't',
          supervision: metadata.supervision === 't',
        };

        return subscriptionDetails;
      }, EXCEPTIONS.to.bad),
      // * Delete the subscription
      TE.chain(data => this._organizationsRepository.updateSubscriptionByExternalID(data)),
    );
  };

  public readonly getSubscription = (loggedUser: LoggedUser): TE.TaskEither<Exception, SubscriptionDetails> =>
    pipe(
      this._usersRepository.isOrganizationOwner({
        userID: loggedUser.id,
        organizationID: loggedUser.organizationID,
      }),
      TE.mapLeft(() => EXCEPTIONS.forbidden('Only organization owners can get subscription details')),
      TE.chain(() => this._organizationsRepository.findSubscriptionByOrganizationID(loggedUser.organizationID)),
    );

  public readonly verifyStripeSignature = (request: Request): TE.TaskEither<Exception, Stripe.Event> =>
    pipe(
      TE.tryCatch(async () => {
        const sig = request.headers['stripe-signature'] as string;
        return this._stripe.webhooks.constructEvent(request.body, sig, this._stripeWebhookSecret);
      }, EXCEPTIONS.to.bad),
    );

  private readonly _createStripeSession = (
    item: Stripe.Checkout.SessionCreateParams.LineItem,
    stripeCustomer: Stripe.Customer | undefined,
    metadata: StripeSubscriptionMetadata,
    userData: { email: string },
    loggedUser: LoggedUser,
    cupomID: string | undefined,
  ): TE.TaskEither<Exception, CheckoutOutputData> => {
    return pipe(
      TE.tryCatch(async () => {
        const sessionData = {
          locale: 'pt-BR',
          customer_email: userData.email,
          client_reference_id: loggedUser.organizationID,
          mode: 'subscription',
          success_url: CHECKOUT_SUCCESS_URL,
        } as const;

        // * If the stripe customer already exists, the trial was already used, so we won't give another trial
        if (stripeCustomer) {
          // * Create a checkout session without a trial
          const session = await this._stripe.checkout.sessions.create({
            ...sessionData,
            payment_method_types: ['card'],
            line_items: [item],
            discounts: cupomID
              ? [
                  {
                    coupon: cupomID,
                  },
                ]
              : [],
            subscription_data: {
              metadata,
            },
          });

          return session.url;
        }

        // * Create a checkout session with a trial
        const session = await this._stripe.checkout.sessions.create({
          ...sessionData,
          payment_method_types: ['card'],
          line_items: [item],
          discounts: cupomID
            ? [
                {
                  coupon: cupomID,
                },
              ]
            : [],
          subscription_data: {
            metadata,
            trial_settings: {
              end_behavior: {
                missing_payment_method: 'cancel',
              },
            },
            trial_period_days: 7,
          },
          payment_method_collection: 'if_required',
        });

        return session.url;
      }, EXCEPTIONS.to.bad),
      TE.filterOrElse(t.string.is, () => EXCEPTIONS.bad('Error creating checkout session')),
      TE.map(checkoutURL => ({ checkoutURL })),
    );
  };
}
