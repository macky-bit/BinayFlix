CREATE OR REPLACE FUNCTION public.get_content_comments_with_authors(
  selected_content_id bigint
)
RETURNS TABLE (
  comment_id bigint,
  comment_text text,
  commented_at timestamp without time zone,
  user_id uuid,
  status character varying,
  member_profile_id bigint,
  author_name text,
  author_avatar text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    comment.comment_id,
    comment.comment_text,
    comment.commented_at,
    comment.user_id,
    comment.status,
    comment.member_profile_id,
    coalesce(
      nullif(btrim(profile.profile_name), ''),
      nullif(btrim(account.username), ''),
      nullif(btrim(concat_ws(' ', account.first_name, account.last_name)), ''),
      'Community member'
    ) AS author_name,
    coalesce(
      nullif(btrim(profile.avatar_image), ''),
      nullif(btrim(account.avatar_image), '')
    ) AS author_avatar
  FROM public.content_comment AS comment
  JOIN public."user" AS account
    ON account.user_id = comment.user_id
  LEFT JOIN public.member_profile AS profile
    ON profile.member_profile_id = comment.member_profile_id
   AND profile.user_id = comment.user_id
  WHERE comment.content_id = selected_content_id
    AND lower(comment.status) = 'active'
  ORDER BY comment.commented_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_content_comments_with_authors(bigint)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_content_comments_with_authors(bigint)
  TO anon, authenticated, postgres, service_role;
