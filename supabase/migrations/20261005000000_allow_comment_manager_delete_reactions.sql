create policy comment_manager_can_delete_reactions
on public.reaction
for delete
to authenticated
using (
  public.is_admin_role('commentManager'::character varying)
  or public.is_master_admin()
);
