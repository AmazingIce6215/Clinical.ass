import { redirect } from "next/navigation";

export default function FavoritesRedirectPage() {
  redirect("/library?mode=teaching");
}
