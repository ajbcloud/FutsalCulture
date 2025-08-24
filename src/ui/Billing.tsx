import { useState } from "react";

export default function Billing() {
const [loading, setLoading] = useState(false);

const upgrade = async (price_id: string) => {
setLoading(true);
try {
const res = await fetch("/api/billing/checkout", { 
method: "POST", 
headers: { "Content-Type": "application/json" }, 
body: JSON.stringify({ price_id }) 
});
const data = await res.json();
if (data.url) {
window.location.href = data.url;
} else {
alert("Error creating checkout session");
}
} catch (error) {
alert("Network error. Please try again.");
} finally {
setLoading(false);
}
};

return (
<div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
<h2 className="text-2xl font-bold mb-6">Billing & Upgrades</h2>
<div className="space-y-4">
<div className="p-4 border rounded">
<h3 className="font-semibold">Current Plan: Free</h3>
<p className="text-sm text-gray-600">Limited features</p>
</div>
<div className="p-4 border rounded">
<h3 className="font-semibold">Pro Plan - $29/month</h3>
<p className="text-sm text-gray-600">Unlimited features, priority support</p>
<button 
onClick={() => upgrade("price_1234567890")} // Replace with actual Stripe price ID
disabled={loading}
className="mt-2 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
data-testid="button-upgrade-pro"
>
{loading ? "Processing..." : "Upgrade to Pro"}
</button>
</div>
</div>
</div>
);
}