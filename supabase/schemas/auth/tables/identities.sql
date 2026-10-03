CREATE TRIGGER on_google_identity_created
  AFTER INSERT ON auth.identities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_google_identity();
