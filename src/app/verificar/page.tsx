import { Suspense } from "react";
import VerifyClient from "./verify-client";
export const dynamic = "force-dynamic";
export default function Page() {
  return <Suspense><VerifyClient /></Suspense>;
}
