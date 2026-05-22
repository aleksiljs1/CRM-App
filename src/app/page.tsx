import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#00968a]/10 via-white to-[#00968a]/5">
      <div className="text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#00968a]">
          <span className="text-4xl font-bold text-white">K</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Kreston CRM
        </h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          AI-powered client relationship management for Kreston Albania
        </p>
        <Link href="/login">
          <Button className="bg-[#00968a] hover:bg-[#007a70] text-white px-8 h-11 text-base">
            Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
