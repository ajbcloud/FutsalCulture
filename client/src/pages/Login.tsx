import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <SignIn 
          routing="path" 
          path="/login"
          signUpUrl="/signup"
          afterSignInUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg rounded-xl",
            }
          }}
        />
        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          New here? <a className="underline text-blue-600 dark:text-blue-400" href="/get-started">Create your club</a>
        </div>
      </div>
    </div>
  );
}
