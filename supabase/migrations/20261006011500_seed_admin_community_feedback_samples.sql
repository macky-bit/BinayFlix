-- Seed representative records for the Community and Feedback admin workspaces.
-- Text-bearing rows carry a [Demo] marker. Reactions use an exact
-- user/content/emoji existence check, making the entire migration safe to rerun.

do $$
declare
  first_user_id uuid;
  second_user_id uuid;
  first_content_id bigint;
  second_content_id bigint;
  welcome_post_id bigint;
  recommendations_post_id bigint;
begin
  select user_id
    into first_user_id
    from public."user"
   order by user_id
   limit 1;

  if first_user_id is null then
    raise notice 'Community/feedback demo seed skipped: public.user has no rows.';
    return;
  end if;

  select user_id
    into second_user_id
    from public."user"
   order by user_id
   offset 1
   limit 1;

  second_user_id := coalesce(second_user_id, first_user_id);

  select content_id
    into first_content_id
    from public.content
   order by content_id
   limit 1;

  select content_id
    into second_content_id
    from public.content
   order by content_id
   offset 1
   limit 1;

  second_content_id := coalesce(second_content_id, first_content_id);

  if first_content_id is not null then
    insert into public.content_review
      (content_id, user_id, rating, review_text, status, created_at)
    select first_content_id, first_user_id, 5,
           '[Demo] Excellent pacing and a memorable ending.', 'Active',
           now() - interval '3 days'
    where not exists (
      select 1 from public.content_review
       where review_text = '[Demo] Excellent pacing and a memorable ending.'
    );

    insert into public.content_review
      (content_id, user_id, rating, review_text, status, created_at)
    select second_content_id, second_user_id, 4,
           '[Demo] Strong performances and beautiful cinematography.', 'Active',
           now() - interval '2 days'
    where not exists (
      select 1 from public.content_review
       where review_text = '[Demo] Strong performances and beautiful cinematography.'
    );

    insert into public.content_review
      (content_id, user_id, rating, review_text, status, created_at)
    select first_content_id, second_user_id, 3,
           '[Demo] Enjoyable overall, although the middle felt slow.', 'Active',
           now() - interval '1 day'
    where not exists (
      select 1 from public.content_review
       where review_text = '[Demo] Enjoyable overall, although the middle felt slow.'
    );

    insert into public.reaction (content_id, user_id, emoji, created_at)
    select first_content_id, first_user_id, '👍', now() - interval '22 hours'
    where not exists (
      select 1 from public.reaction
       where content_id = first_content_id
         and user_id = first_user_id
         and emoji = '👍'
    );

    insert into public.reaction (content_id, user_id, emoji, created_at)
    select second_content_id, second_user_id, '❤️', now() - interval '18 hours'
    where not exists (
      select 1 from public.reaction
       where content_id = second_content_id
         and user_id = second_user_id
         and emoji = '❤️'
    );

    insert into public.reaction (content_id, user_id, emoji, created_at)
    select first_content_id, second_user_id, '😂', now() - interval '8 hours'
    where not exists (
      select 1 from public.reaction
       where content_id = first_content_id
         and user_id = second_user_id
         and emoji = '😂'
    );
  else
    raise notice 'Review/reaction demo seed skipped: public.content has no rows.';
  end if;

  insert into public.community_post
    (user_id, title, body, status, created_at, updated_at)
  select first_user_id,
         '[Demo] Welcome to the StreamFlix community',
         'Introduce yourself and share the first title you watched on StreamFlix.',
         'Active', now() - interval '4 days', now() - interval '4 days'
  where not exists (
    select 1 from public.community_post
     where title = '[Demo] Welcome to the StreamFlix community'
  );

  insert into public.community_post
    (user_id, title, body, status, created_at, updated_at)
  select second_user_id,
         '[Demo] What should I watch this weekend?',
         'I am looking for a suspenseful series with strong characters. Any recommendations?',
         'Active', now() - interval '2 days', now() - interval '2 days'
  where not exists (
    select 1 from public.community_post
     where title = '[Demo] What should I watch this weekend?'
  );

  insert into public.community_post
    (user_id, title, body, status, created_at, updated_at)
  select first_user_id,
         '[Demo] Spoiler discussion temporarily hidden',
         'This sample demonstrates how a hidden moderation record appears.',
         'Hidden', now() - interval '1 day', now() - interval '6 hours'
  where not exists (
    select 1 from public.community_post
     where title = '[Demo] Spoiler discussion temporarily hidden'
  );

  select post_id
    into welcome_post_id
    from public.community_post
   where title = '[Demo] Welcome to the StreamFlix community'
   order by post_id
   limit 1;

  select post_id
    into recommendations_post_id
    from public.community_post
   where title = '[Demo] What should I watch this weekend?'
   order by post_id
   limit 1;

  insert into public.community_comment
    (post_id, user_id, body, status, created_at)
  select welcome_post_id, second_user_id,
         '[Demo] Happy to be here! My first watch was fantastic.',
         'Active', now() - interval '3 days'
  where welcome_post_id is not null
    and not exists (
      select 1 from public.community_comment
       where body = '[Demo] Happy to be here! My first watch was fantastic.'
    );

  insert into public.community_comment
    (post_id, user_id, body, status, created_at)
  select welcome_post_id, first_user_id,
         '[Demo] Welcome! Remember to keep discussions friendly.',
         'Active', now() - interval '2 days'
  where welcome_post_id is not null
    and not exists (
      select 1 from public.community_comment
       where body = '[Demo] Welcome! Remember to keep discussions friendly.'
    );

  insert into public.community_comment
    (post_id, user_id, body, status, created_at)
  select recommendations_post_id, first_user_id,
         '[Demo] Try one of the top-ranked mystery series in the catalog.',
         'Active', now() - interval '20 hours'
  where recommendations_post_id is not null
    and not exists (
      select 1 from public.community_comment
       where body = '[Demo] Try one of the top-ranked mystery series in the catalog.'
    );

  insert into public.platform_feedback
    (user_id, feedback_type, subject, description, screenshot, submission_date, status)
  select first_user_id, 'Bug Report',
         '[Demo] Subtitle timing issue',
         'Subtitles occasionally appear a few seconds before the dialogue.',
         null, now() - interval '5 days', 'Open'
  where not exists (
    select 1 from public.platform_feedback
     where subject = '[Demo] Subtitle timing issue'
  );

  insert into public.platform_feedback
    (user_id, feedback_type, subject, description, screenshot, submission_date, status)
  select second_user_id, 'Feature Request',
         '[Demo] Add a continue-watching filter',
         'A filter for unfinished titles would make it easier to resume a series.',
         null, now() - interval '3 days', 'In Progress'
  where not exists (
    select 1 from public.platform_feedback
     where subject = '[Demo] Add a continue-watching filter'
  );

  insert into public.platform_feedback
    (user_id, feedback_type, subject, description, screenshot, submission_date, status)
  select first_user_id, 'Suggestion',
         '[Demo] Improve profile avatar choices',
         'Please add more colors and character styles for profile avatars.',
         null, now() - interval '1 day', 'Closed'
  where not exists (
    select 1 from public.platform_feedback
     where subject = '[Demo] Improve profile avatar choices'
  );
end
$$;
