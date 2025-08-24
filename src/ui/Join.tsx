import { useState, useEffect } from "react";

export default function Join() {
const [token, setToken] = useState<string | null>(null);
const [form, setForm] = useState({ tenant_code: "", email: "", role: "player", parent_email: "", password: "" });
const [loading, setLoading] = useState(false);

useEffect(() => {
const params = new URLSearchParams(location.search);
const urlToken = params.get("token");
setToken(urlToken);
}, []);

const handleTokenSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);
try {
const response = await fetch("/api/join/by-token", { 
method: "POST", 
headers: { "Content-Type": "application/json" }, 
body: JSON.stringify({ token, password: form.password }) 
});
if (response.ok) {
alert("Successfully joined!");
} else {
const error = await response.json();
alert(`Error: ${error.error}`);
}
} catch (error) {
alert("Network error. Please try again.");
} finally {
setLoading(false);
}
};

const handleCodeSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);
try {
const response = await fetch("/api/join/by-code", { 
method: "POST", 
headers: { "Content-Type": "application/json" }, 
body: JSON.stringify(form) 
});
if (response.ok) {
const result = await response.json();
if (result.queued) {
alert("Join request sent for approval!");
} else {
alert("Successfully joined!");
}
} else {
const error = await response.json();
alert(`Error: ${error.error}`);
}
} catch (error) {
alert("Network error. Please try again.");
} finally {
setLoading(false);
}
};

return (
<div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
{token ? (
<div>
<h2 className="text-2xl font-bold mb-6">Accept Invitation</h2>
<form onSubmit={handleTokenSubmit} className="space-y-4">
<input 
placeholder="Password" 
type="password"
value={form.password} 
onChange={e => setForm({ ...form, password: e.target.value })}
className="w-full p-2 border rounded"
required
data-testid="input-password"
/>
<button 
type="submit" 
disabled={loading}
className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
data-testid="button-accept-invite"
>
{loading ? "Joining..." : "Accept Invitation"}
</button>
</form>
</div>
) : (
<div>
<h2 className="text-2xl font-bold mb-6">Join by Code</h2>
<form onSubmit={handleCodeSubmit} className="space-y-4">
<input 
placeholder="Tenant Code" 
value={form.tenant_code} 
onChange={e => setForm({ ...form, tenant_code: e.target.value.toUpperCase() })}
className="w-full p-2 border rounded"
required
data-testid="input-tenant-code"
/>
<input 
placeholder="Email" 
type="email"
value={form.email} 
onChange={e => setForm({ ...form, email: e.target.value })}
className="w-full p-2 border rounded"
required
data-testid="input-email"
/>
<input 
placeholder="Password" 
type="password"
value={form.password} 
onChange={e => setForm({ ...form, password: e.target.value })}
className="w-full p-2 border rounded"
required
data-testid="input-password"
/>
<select 
value={form.role} 
onChange={e => setForm({ ...form, role: e.target.value })}
className="w-full p-2 border rounded"
data-testid="select-role"
>
<option value="player">Player</option>
<option value="parent">Parent</option>
<option value="coach">Coach</option>
</select>
<input 
placeholder="Parent Email (for players under 13)" 
type="email"
value={form.parent_email} 
onChange={e => setForm({ ...form, parent_email: e.target.value })}
className="w-full p-2 border rounded"
data-testid="input-parent-email"
/>
<button 
type="submit" 
disabled={loading}
className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
data-testid="button-join"
>
{loading ? "Joining..." : "Join Organization"}
</button>
</form>
</div>
)}
</div>
);
}