-- Subscription selection is handled by select_subscription_plan. The retired
-- activation RPC manufactured payment metadata without a payment provider.
drop function if exists public.activate_my_subscription(bigint);
