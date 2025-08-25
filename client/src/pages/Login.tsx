
```tsx
import SocialButtons from "../components/SocialButtons";

export default function Login(){
  return (
    <div className="mx-auto max-w-md p-10 space-y-6">
      <h1 className="text-2xl font-bold">Log in to PlayHQ</h1>
      <form method="POST" action="/api/auth/login" className="space-y-3">
        <input name="email" type="email" required placeholder="Email" className="w-full border rounded-xl p-3" />
        <input name="password" type="password" required placeholder="Password" className="w-full border rounded-xl p-3" />
        <button className="w-full rounded-2xl bg-black text-white px-6 py-3">Log in</button>
      </form>
      <div className="text-center text-sm"><a className="underline" href="/forgot">Forgot password?</a></div>
      <div className="pt-4 border-t"><SocialButtons /></div>
    </div>
  );
}
```
