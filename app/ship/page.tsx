import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import users from "@/data/users.json";
import Navbar from "@/components/Navbar";
import StarSystemBackground from "@/components/StarSystemBackground";
import ShipViewer from "@/components/ship/ShipViewer";
import shipData from "@/content/ship/graviton.json";
import type { ShipData } from "@/types/ship";

export default async function ShipPage() {
  const cookieStore = await cookies();
  const username = cookieStore.get("nh_user")?.value;

  if (!username) redirect("/login");

  const user = users.find((u) => u.username === username);
  if (!user) redirect("/login");

  return (
    <>
      <Navbar
        username={user.username}
        character={"character" in user ? user.character : undefined}
        role={"role" in user ? user.role : undefined}
        group={user.group}
      />
      <StarSystemBackground />
      <ShipViewer ship={shipData as ShipData} />
    </>
  );
}
