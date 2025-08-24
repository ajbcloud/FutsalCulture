import { useState } from "react";

export default function GetStarted() {
const [form, setForm] = useState({ org_name: "", contact_name: "", contact_email: "", city: "", state: "", country: "" });
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);
try {
const response = await fetch("/api/get-started", { 
method: "POST", 
headers: { "Content-Type": "application/json" }, 
body: JSON.stringify(form) 
});
if (response.ok) {
alert("Success! Check your email to verify your account.");
setForm({ org_name: "", contact_name: "", contact_email: "", city: "", state: "", country: "" });
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
<h2 className="text-2xl font-bold mb-6">Get Started with Futsal Culture</h2>
<form onSubmit={handleSubmit} className="space-y-4">
<input 
placeholder="Club or Organization Name" 
value={form.org_name} 
onChange={e => setForm({ ...form, org_name: e.target.value })}
className="w-full p-2 border rounded"
required
data-testid="input-org-name"
/>
<input 
placeholder="Contact Name" 
value={form.contact_name} 
onChange={e => setForm({ ...form, contact_name: e.target.value })}
className="w-full p-2 border rounded"
required
data-testid="input-contact-name"
/>
<input 
placeholder="Email" 
type="email"
value={form.contact_email} 
onChange={e => setForm({ ...form, contact_email: e.target.value })}
className="w-full p-2 border rounded"
required
data-testid="input-contact-email"
/>
<input 
placeholder="City (optional)" 
value={form.city} 
onChange={e => setForm({ ...form, city: e.target.value })}
className="w-full p-2 border rounded"
data-testid="input-city"
/>
<input 
placeholder="State (optional)" 
value={form.state} 
onChange={e => setForm({ ...form, state: e.target.value })}
className="w-full p-2 border rounded"
data-testid="input-state"
/>
<input 
placeholder="Country (optional)" 
value={form.country} 
onChange={e => setForm({ ...form, country: e.target.value })}
className="w-full p-2 border rounded"
data-testid="input-country"
/>
<button 
type="submit" 
disabled={loading}
className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
data-testid="button-create-account"
>
{loading ? "Creating..." : "Create Free Account"}
</button>
</form>
</div>
);
}