import { useState } from "react";

export default function People() {
const [email, setEmail] = useState("");
const [role, setRole] = useState("player");
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);
try {
const response = await fetch("/api/invites", { 
method: "POST", 
headers: { "Content-Type": "application/json" }, 
body: JSON.stringify({ email, role }) 
});
if (response.ok) {
alert("Invite sent successfully!");
setEmail("");
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
<h2 className="text-2xl font-bold mb-6">Invite People</h2>
<form onSubmit={handleSubmit} className="space-y-4">
<input 
placeholder="Email Address" 
type="email"
value={email} 
onChange={e => setEmail(e.target.value)}
className="w-full p-2 border rounded"
required
data-testid="input-email"
/>
<select 
value={role} 
onChange={e => setRole(e.target.value)}
className="w-full p-2 border rounded"
data-testid="select-role"
>
<option value="player">Player</option>
<option value="parent">Parent</option>
<option value="coach">Coach</option>
</select>
<button 
type="submit" 
disabled={loading || !email}
className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
data-testid="button-send-invite"
>
{loading ? "Sending..." : "Send Invitation"}
</button>
</form>
</div>
);
}