import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton({ label }: { label: string }) {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm">
        {label}
      </Button>
    </form>
  );
}
